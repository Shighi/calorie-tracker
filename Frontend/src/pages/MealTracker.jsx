// src/pages/MealTracker.jsx
import { useState } from 'react';
import { DndProvider } from '../contexts/DndContext';
import MealSection from '../components/MealSection';

// Initial mock data structure
const initialItems = {
  breakfast: [],
  lunch: [
    { id: 1, name: 'Grilled Chicken', calories: 165, quantity: 150 },
    { id: 2, name: 'Brown Rice', calories: 215, quantity: 100 }
  ],
  dinner: [],
  snacks: []
};

export default function MealTracker() {
  const [foods, setFoods] = useState(initialItems);

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-poppins font-bold mb-6">Meal Tracker</h1>
        
        <DndProvider items={foods} setItems={setFoods}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MealSection 
              id="breakfast" 
              title="Breakfast" 
              items={foods.breakfast} 
            />
            <MealSection 
              id="lunch" 
              title="Lunch" 
              items={foods.lunch} 
            />
            <MealSection 
              id="dinner" 
              title="Dinner" 
              items={foods.dinner} 
            />
            <MealSection 
              id="snacks" 
              title="Snacks" 
              items={foods.snacks} 
            />
          </div>
        </DndProvider>
      </div>
    </div>
  );
}