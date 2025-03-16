import { useState } from 'react';
import { DndProvider } from '../contexts/DndContext';
import MealSection from '../components/MealSection';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

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
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [quantity, setQuantity] = useState('');

  // Function to add new food item
  const addFoodItem = (mealType) => {
    if (!foodName || !calories || !quantity) {
      alert("Please fill out all fields!");
      return;
    }

    const newItem = {
      id: new Date().getTime(),
      name: foodName,
      calories: parseInt(calories),
      quantity: parseInt(quantity)
    };

    setFoods(prevFoods => ({
      ...prevFoods,
      [mealType]: [...prevFoods[mealType], newItem]
    }));

    // Reset form fields after adding food
    setFoodName('');
    setCalories('');
    setQuantity('');
  };

  // Function to remove food item
  const removeFoodItem = (mealType, id) => {
    const updatedItems = foods[mealType].filter(item => item.id !== id);
    setFoods(prevFoods => ({
      ...prevFoods,
      [mealType]: updatedItems
    }));
  };

  // Calculate total calories for the day
  const calculateTotalCalories = () => {
    let totalCalories = 0;
    for (const meal in foods) {
      foods[meal].forEach(item => {
        totalCalories += item.calories * (item.quantity / 100);
      });
    }
    return totalCalories;
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-6 flex-grow">
        <h1 className="text-3xl font-poppins font-bold mb-6">Meal Tracker</h1>

        {/* Add food form */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Food Name"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              className="mb-2"
            />
            <Input
              type="number"
              placeholder="Calories per 100g"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="mb-2"
            />
            <Input
              type="number"
              placeholder="Quantity (in grams)"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mb-2"
            />
          </div>
          <Button
            onClick={() => addFoodItem('lunch')}  // For now adding to lunch as an example
            className="mt-4 md:mt-0 w-full md:w-auto"
          >
            Add Food
          </Button>
        </div>

        {/* Display Total Calories */}
        <div className="mb-6 text-lg font-semibold">
          <p>Total Calories for the day: {calculateTotalCalories()} kcal</p>
        </div>

        <DndProvider items={foods} setItems={setFoods}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MealSection 
              id="breakfast" 
              title="Breakfast" 
              items={foods.breakfast} 
              removeFoodItem={removeFoodItem}
            />
            <MealSection 
              id="lunch" 
              title="Lunch" 
              items={foods.lunch} 
              removeFoodItem={removeFoodItem}
            />
            <MealSection 
              id="dinner" 
              title="Dinner" 
              items={foods.dinner} 
              removeFoodItem={removeFoodItem}
            />
            <MealSection 
              id="snacks" 
              title="Snacks" 
              items={foods.snacks} 
              removeFoodItem={removeFoodItem}
            />
          </div>
        </DndProvider>
      </div>

      {/* Footer Section */}
      <div className="bg-gray-800 text-white py-8 mt-auto">
        <div className="container text-center">
          <p>&copy; {new Date().getFullYear()} NutriTrack. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
