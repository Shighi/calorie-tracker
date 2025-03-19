import { useState, useEffect } from 'react';
import { DndProvider } from '../contexts/DndContext';
import MealSection from '../components/MealSection';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select'; // Make sure this file exists and exports Select
import { Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function MealTracker() {
  const [foods, setFoods] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('lunch');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  // Fetch user's meals for the selected date
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        setLoading(true);
        // Check for token
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Make sure the API URL is correct - use absolute path
        const response = await fetch(`/api/meals?startDate=${date}&endDate=${date}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json' // Explicitly request JSON
          }
        });
        
        // Better error handling to debug API responses
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API response:', response.status, errorText);
          throw new Error(`Failed to fetch meals: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Invalid content type:', contentType);
          throw new Error('Expected JSON response but got something else');
        }
        
        const data = await response.json();
        
        // Transform backend data to frontend format
        const transformedMeals = {
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: []
        };
        
        if (data.meals && Array.isArray(data.meals)) {
          data.meals.forEach(meal => {
            const mealType = meal.meal_type === 'snack' ? 'snacks' : meal.meal_type;
            
            if (meal.Foods && Array.isArray(meal.Foods)) {
              meal.Foods.forEach(food => {
                const mealFood = meal.MealFood?.find(mf => mf.food_id === food.food_id) || 
                                food.MealFood;
                const quantity = mealFood ? mealFood.serving_qty : 0;
                
                transformedMeals[mealType].push({
                  id: `${meal.meal_id}_${food.food_id}`,
                  meal_id: meal.meal_id,
                  food_id: food.food_id,
                  name: food.name,
                  calories: food.calories,
                  quantity: quantity,
                  notes: meal.notes
                });
              });
            }
          });
        }
        
        setFoods(transformedMeals);
        setError(null);
      } catch (err) {
        console.error('Error fetching meals:', err);
        setError(`Failed to load meals: ${err.message}`);
        
        toast({
          title: "Error",
          description: `Failed to load meals: ${err.message}`,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMeals();
  }, [date, toast]);

  // Rest of the component remains the same...

  // Function to add new food item
  const addFoodItem = async () => {
    if (!foodName || !calories || !quantity) {
      toast({
        title: "Error",
        description: "Please fill out all fields!",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Create a new food item in the database
      const foodItem = {
        name: foodName,
        calories: parseFloat(calories),
        // Add other nutritional info if needed
        proteins: 0,
        carbs: 0,
        fats: 0
      };
      
      // First create/get the food
      const foodResponse = await fetch('/api/foods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(foodItem)
      });
      
      if (!foodResponse.ok) {
        const errorText = await foodResponse.text();
        console.error('Food API response:', foodResponse.status, errorText);
        throw new Error('Failed to create food item');
      }
      
      const foodData = await foodResponse.json();
      const foodId = foodData.data.food_id;
      
      // Now create the meal with the food
      const mealData = {
        meal_type: selectedMealType,
        log_date: date,
        foods: [{
          food_id: foodId,
          serving_size: parseFloat(quantity)
        }]
      };
      
      const mealResponse = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(mealData)
      });
      
      if (!mealResponse.ok) {
        const errorText = await mealResponse.text();
        console.error('Meal API response:', mealResponse.status, errorText);
        throw new Error('Failed to add meal');
      }
      
      const mealResult = await mealResponse.json();
      
      // Create new item for UI
      const newItem = {
        id: `${mealResult.data.meal_id}_${foodId}`,
        meal_id: mealResult.data.meal_id,
        food_id: foodId,
        name: foodName,
        calories: parseFloat(calories),
        quantity: parseFloat(quantity)
      };

      // Update UI
      setFoods(prevFoods => ({
        ...prevFoods,
        [selectedMealType]: [...prevFoods[selectedMealType], newItem]
      }));

      // Reset form fields
      setFoodName('');
      setCalories('');
      setQuantity('');
      
      toast({
        title: "Success",
        description: 'Food added successfully!',
        variant: "default"
      });
    } catch (err) {
      console.error('Error adding food item:', err);
      toast({
        title: "Error",
        description: `Failed to add food item: ${err.message}`,
        variant: "destructive"
      });
    }
  };

  // Function to remove food item
  const removeFoodItem = async (mealType, id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Parse the composite ID to get meal_id and food_id
      const [mealId, foodId] = id.split('_');
      
      // Check if this is the only food in the meal
      const foodsInMeal = foods[mealType].filter(item => item.meal_id.toString() === mealId);
      
      if (foodsInMeal.length === 1) {
        // Delete the entire meal if this is the only food
        const response = await fetch(`/api/meals/${mealId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Delete API response:', response.status, errorText);
          throw new Error('Failed to delete meal');
        }
      } else {
        // Get current meal data
        const mealResponse = await fetch(`/api/meals/${mealId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (!mealResponse.ok) {
          const errorText = await mealResponse.text();
          console.error('Meal fetch API response:', mealResponse.status, errorText);
          throw new Error('Failed to fetch meal data');
        }
        
        const mealData = await mealResponse.json();
        
        // Filter out the food to remove
        const updatedFoods = mealData.data.Foods.filter(food => 
          food.food_id.toString() !== foodId
        ).map(food => ({
          food_id: food.food_id,
          serving_size: food.MealFood.serving_qty
        }));
        
        // Update the meal
        const updateResponse = await fetch(`/api/meals/${mealId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            foods: updatedFoods
          })
        });
        
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error('Update API response:', updateResponse.status, errorText);
          throw new Error('Failed to update meal');
        }
      }
      
      // Update UI
      const updatedItems = foods[mealType].filter(item => item.id !== id);
      setFoods(prevFoods => ({
        ...prevFoods,
        [mealType]: updatedItems
      }));
      
      toast({
        title: "Success",
        description: 'Food removed successfully',
        variant: "default"
      });
    } catch (err) {
      console.error('Error removing food item:', err);
      toast({
        title: "Error",
        description: `Failed to remove food item: ${err.message}`,
        variant: "destructive"
      });
    }
  };

  // Calculate total calories for the day
  const calculateTotalCalories = () => {
    let totalCalories = 0;
    for (const meal in foods) {
      foods[meal].forEach(item => {
        totalCalories += item.calories * (item.quantity / 100);
      });
    }
    return totalCalories.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-6 flex-grow">
        <h1 className="text-3xl font-poppins font-bold mb-6">Meal Tracker</h1>
        
        {/* Date selector */}
        <div className="mb-6">
          <label htmlFor="date" className="block text-sm font-medium mb-1">
            Date
          </label>
          <Input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full md:w-64"
          />
        </div>

        {/* Add food form */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Food</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Input
                type="text"
                placeholder="Food Name"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Calories per 100g"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Quantity (in grams)"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <Select
                value={selectedMealType}
                onValueChange={setSelectedMealType}
                options={[
                  { value: 'breakfast', label: 'Breakfast' },
                  { value: 'lunch', label: 'Lunch' },
                  { value: 'dinner', label: 'Dinner' },
                  { value: 'snacks', label: 'Snack' }
                ]}
                placeholder="Select meal type"
              />
            </div>
            <Button
              onClick={addFoodItem}
              className="mt-4 md:mt-auto w-full md:w-auto"
            >
              Add Food
            </Button>
          </div>
        </div>

        {/* Display Total Calories */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <p className="text-lg font-semibold">
            Total Calories for the day: {calculateTotalCalories()} kcal
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading meals...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 bg-red-50 rounded-md mb-6">
            {error}
          </div>
        ) : (
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
        )}
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