import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import FoodItem from "../contexts/FoodItem"; // Updated to correct relative path

export default function MealSection({ id, items, title }) {
  const { setNodeRef } = useDroppable({ id });
  
  // Extract IDs for the SortableContext
  const itemIds = items.map(item => item.id);

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div ref={setNodeRef} className="min-h-[100px]">
        <SortableContext 
          items={itemIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((item) => (
              <FoodItem key={item.id} id={item.id} item={item} />
            ))}
          </div>
        </SortableContext>
        {items.length === 0 && (
          <p className="text-gray-400 text-sm py-4">Drag food items here</p>
        )}
      </div>
    </div>
  );
}