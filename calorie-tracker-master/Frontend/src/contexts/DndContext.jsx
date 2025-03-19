import React, { createContext, useContext } from 'react';
import {
  DndContext as DndKitContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { 
  SortableContext,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';

export const DndContext = createContext();

export const useDnd = () => useContext(DndContext);

export function DndProvider({ children, items, setItems }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!active || !over) return;
    
    const sourceContainer = Object.keys(items).find(key => 
      items[key].some(item => item.id === active.id)
    );
    
    if (!sourceContainer) return;
    
    if (sourceContainer !== over.id && Object.keys(items).includes(over.id)) {
      const draggedItem = items[sourceContainer].find(item => item.id === active.id);
      
      try {
        if (draggedItem && draggedItem.meal_id) {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Authentication token not found');
          }
          
          const [mealId, foodId] = draggedItem.id.split('_');
          
          const mealData = {
            meal_type: over.id === 'snacks' ? 'snack' : over.id,
            log_date: new Date().toISOString().split('T')[0],
            foods: [{
              food_id: parseInt(foodId),
              serving_size: draggedItem.quantity
            }]
          };
          
          const response = await fetch('/api/meals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(mealData)
          });
          
          if (!response.ok) {
            throw new Error('Failed to move food item');
          }
          
          const result = await response.json();
          
          const foodsInMeal = items[sourceContainer].filter(
            item => item.meal_id.toString() === mealId
          );
          
          if (foodsInMeal.length === 1) {
            await fetch(`/api/meals/${mealId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
          } else {
            const mealResponse = await fetch(`/api/meals/${mealId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (!mealResponse.ok) {
              throw new Error('Failed to fetch meal data');
            }
            
            const mealData = await mealResponse.json();
            
            const updatedFoods = mealData.data.Foods.filter(food => 
              food.food_id.toString() !== foodId
            ).map(food => ({
              food_id: food.food_id,
              serving_size: food.MealFood.serving_qty
            }));
            
            await fetch(`/api/meals/${mealId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                foods: updatedFoods
              })
            });
          }
          
          const updatedDraggedItem = {
            ...draggedItem,
            id: `${result.data.meal_id}_${foodId}`,
            meal_id: result.data.meal_id
          };
          
          setItems({
            ...items,
            [sourceContainer]: items[sourceContainer].filter(item => item.id !== active.id),
            [over.id]: [...items[over.id], updatedDraggedItem]
          });
        }
      } catch (err) {
        console.error('Error moving food item:', err);
      }
    }
  };

  return (
    <DndKitContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <DndContext.Provider value={{ items, setItems }}>
        {children}
      </DndContext.Provider>
    </DndKitContext>
  );
}