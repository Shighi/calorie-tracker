import { useState, useEffect, useRef, useCallback } from 'react';
import MealSection from '../components/MealSection';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Loader2, Search, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Card } from '../components/ui/card';
import { MEAL_TYPES, MEAL_TYPE_LABELS } from '../constants/mealTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const MEAL_TYPE_OPTIONS = Object.entries(MEAL_TYPES).map(([key, value]) => ({
  value: value,
  label: MEAL_TYPE_LABELS[value]
}));

const INITIAL_FOODS_STATE = {
  breakfast: [],
  lunch: [],
  dinner: [],
  snack: []
};

// Improved Food Search Results Component
const FoodSearchResults = ({ results, onSelect, onClose }) => {
  if (!results || results.length === 0) return null;
  
  return (
    <div className="absolute z-50 mt-1 w-full bg-gray-100 shadow-lg rounded-md border border-gray-300 max-h-64 overflow-y-auto">
      <div className="flex justify-between items-center p-2 border-b bg-gray-200">
        <span className="text-sm font-medium">Search Results</span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul>
        {results.map((food) => (
          <li 
            key={food.id || food.food_id} 
            className="p-2 hover:bg-gray-200 cursor-pointer border-b last:border-b-0"
            onClick={() => onSelect(food)}
          >
            <div className="font-medium">{food.name}</div>
            <div className="text-sm text-gray-600 flex justify-between">
              <span>{food.calories} kcal per 100g</span>
              <span>P: {food.proteins || 0}g C: {food.carbs || 0}g F: {food.fats || 0}g</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function MealTracker() {
  // State Management
  const [foods, setFoods] = useState(INITIAL_FOODS_STATE);
  const [manualFoodName, setManualFoodName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [calories, setCalories] = useState('');
  const [caloriesPer100g, setCaloriesPer100g] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState(MEAL_TYPES[1].value); // Default to lunch
  
  // Food search related state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);

  // Store the selected food ID and food object
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedFoodObject, setSelectedFoodObject] = useState(null);

  // Hooks
  const { toast } = useToast();

  // Comprehensive API Fetching Function
  const fetchFromApi = async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });

      // Handle 404 by returning empty data array
      if (response.status === 404 && options.method === 'GET') {
        return { data: [] };
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${options.errorMessage || 'Request failed'}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API error: ${error}`);
      throw error;
    }
  };

  // Handle Logout with Complete Reset
  const handleLogout = () => {
    // Clear all user-specific data
    localStorage.removeItem('token');
    
    // Reset all state to initial values
    setFoods(INITIAL_FOODS_STATE);
    setManualFoodName('');
    setQuantity('');
    setCalories('');
    setCaloriesPer100g('');
    setIsLoading(false);
    setError(null);
    setDate(new Date().toISOString().split('T')[0]);
    setIsAddingFood(false);
    setIsSaving(false);
    setSelectedMealType(MEAL_TYPES[1].value);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setShowSearchResults(false);
    setSelectedFood(null);
    setSelectedFoodObject(null);
  };

  // Updated parseApiResponse
  const parseApiResponse = (response) => {
    const transformedMeals = { ...INITIAL_FOODS_STATE };
    
    try {
      // Safely extract meals data
      const mealsData = response?.data?.meals || 
                        response?.data || 
                        response || 
                        [];
      
      // Ensure mealsData is an array
      if (!Array.isArray(mealsData)) {
        console.warn('Received invalid meals data format:', mealsData);
        return transformedMeals;
      }
      
      mealsData.forEach((meal) => {
        if (!meal) return;
        
        // Normalize meal type
        const mealType = (meal.meal_type || meal.type || 'lunch').toLowerCase();
        
        // Map meal type to lowercase keys in transformedMeals
        const validMealType = 
          ['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType) 
            ? mealType 
            : 'lunch';
        
        // Safely extract food items
        const foodItems = meal.foods || meal.food_items || [];
        
        foodItems.forEach((food) => {
          const foodItem = {
            id: `${meal.id || 'unknown'}_${food.id || food.food_id || 'unknown'}`, 
            meal_id: meal.id || meal.meal_id,
            food_id: food.food_id || food.id,
            name: food.name || 'Unknown Food',
            calories: Number(food.MealFood?.calories || food.calories || 0),
            quantity: Number(food.MealFood?.serving_qty || food.serving_qty || 100),
            mealType: validMealType,
            serverSaved: true  // Add flag to distinguish server-saved items
          };
          
          // Ensure the array exists and push the food item
          if (!transformedMeals[validMealType]) {
            transformedMeals[validMealType] = [];
          }
          
          // Prevent duplicate entries by checking if item already exists
          const isDuplicate = transformedMeals[validMealType].some(
            item => item.food_id === foodItem.food_id && 
                    item.calories === foodItem.calories && 
                    item.quantity === foodItem.quantity
          );
          
          if (!isDuplicate) {
            transformedMeals[validMealType].push(foodItem);
          }
        });
      });
    } catch (error) {
      console.error('Error parsing API response:', error);
      return INITIAL_FOODS_STATE;
    }
    
    return transformedMeals;
  };
  
  // Enhanced Meal Saving Function
  const saveMealToServer = async (mealType, foodItems) => {
    try {
      if (!mealType || !foodItems || foodItems.length === 0) {
        throw new Error('Invalid meal data: Missing meal type or food items');
      }

      const formattedFoods = foodItems.map(item => ({
        food_id: item.food_id || null, 
        name: item.name,
        serving_qty: item.quantity,
        serving_unit: 'g', 
        calories: item.calories || 0
      }));

      const mealPayload = {
        type: mealType, 
        log_date: date,
        foods: formattedFoods,
        metadata: {
          source: 'client_app',
          timestamp: new Date().toISOString()
        }
      };

      setIsSaving(true);

      const response = await fetchFromApi('/meals', {
        method: 'POST',
        body: JSON.stringify(mealPayload)
      });

      const savedMealId = response.data?.meal_id;
      if (!savedMealId) {
        throw new Error('No meal ID returned from server');
      }

      // Update local state with server-generated meal ID
      setFoods(prev => {
        const currentMealTypeItems = prev[mealType] || [];
        const updatedMealTypeItems = currentMealTypeItems.map(item => 
          item.id.includes('temp_') 
            ? { ...item, meal_id: savedMealId, serverSaved: true, id: `${savedMealId}_${item.id}` } 
            : item
        );

        return {
          ...prev,
          [mealType]: updatedMealTypeItems
        };
      });

      return response;
    } catch (error) {
      console.error('Detailed Meal Save Error:', {
        errorMessage: error.message,
        mealType,
        payload: JSON.stringify(foodItems)
      });

      toast({
        title: "Meal Save Failed", 
        description: error.message || "Failed to save meal to server",
        variant: "destructive"
      });

      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Updated Removal Function
  const removeFoodItem = async (mealType, id) => {
    try {
      const [mealId, foodId] = id.split('_');

      // If the item isn't server-saved, just remove locally
      const itemToRemove = foods[mealType].find(item => item.id === id);
      if (!itemToRemove || !itemToRemove.serverSaved) {
        setFoods(prev => ({
          ...prev,
          [mealType]: prev[mealType].filter(item => item.id !== id)
        }));
        return;
      }

      // Remove from server if a valid server-saved item
      await fetchFromApi(`/meals/${mealId}/foods/${foodId}`, {
        method: 'DELETE'
      });

      // Update local state
      setFoods(prev => ({
        ...prev,
        [mealType]: prev[mealType].filter(item => item.id !== id)
      }));

    } catch (err) {
      console.error('Error removing food:', err);
      toast({
        title: "Delete Error",
        description: "Failed to remove food",
        variant: "destructive"
      });
    }
  };

  // Remaining functions (unchanged)
  const resetFoodForm = () => {
    setManualFoodName('');
    setQuantity('');
    setCalories('');
    setCaloriesPer100g('');
    setSelectedFood(null);
    setSelectedFoodObject(null);
    setSearchQuery('');
  };

  const addFoodItem = async () => {
    if (!manualFoodName || !quantity || !calories) {
      toast({
        title: "Error",
        description: "Please enter food name, quantity, and calories!",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsAddingFood(true);
      
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newItem = {
        id: tempId,
        name: manualFoodName,
        food_id: selectedFood,
        calories: parseFloat(calories),
        quantity: parseFloat(quantity),
        mealType: selectedMealType,
        serverSaved: false
      };
      
      setFoods(prev => ({
        ...prev,
        [selectedMealType]: [...(prev[selectedMealType] || []), newItem]
      }));

      await saveMealToServer(selectedMealType, [newItem]);

      resetFoodForm();
      
      toast({
        title: "Success",
        description: 'Food added successfully!',
      });
      
    } catch (err) {
      console.error('Error adding food:', err);
      toast({
        title: "Error",
        description: `Failed to add food: ${err.message}`,
        variant: "destructive"
      });
    } finally {
      setIsAddingFood(false);
    }
  };

  const calculateTotalCalories = () => {
    return Object.values(foods).reduce((total, mealFoods) => {
      return total + mealFoods.reduce((sum, item) => {
        const caloriesForQuantity = item.calories * (item.quantity / 100);
        return sum + caloriesForQuantity;
      }, 0);
    }, 0).toFixed(1);
  };

  const searchFoods = async (query) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetchFromApi(`/foods?query=${encodeURIComponent(query)}`);
      
      const foundFoods = response.data?.foods || 
                          response.data || 
                          response || 
                          [];
      
      setSearchResults(foundFoods);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Error searching foods:', err);
      toast({
        title: "Search Error",
        description: "Failed to search foods. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectFood = (food) => {
    setManualFoodName(food.name);
    setCaloriesPer100g(food.calories.toString());
    setQuantity('100');
    setCalories(food.calories.toString());
    setShowSearchResults(false);
    setSearchQuery('');
    
    setSelectedFoodObject(food);
    setSelectedFood(food.id || food.food_id);
  };

  const handleQuantityChange = (e) => {
    const newQuantity = e.target.value;
    setQuantity(newQuantity);
    
    if (caloriesPer100g && newQuantity) {
      const calculatedCalories = (parseFloat(caloriesPer100g) * parseFloat(newQuantity) / 100).toFixed(1);
      setCalories(calculatedCalories);
    }
  };

  // Side Effects
  useEffect(() => {
    let isMounted = true;
    
    const fetchMeals = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setFoods(INITIAL_FOODS_STATE);
        return;
      }

      setIsLoading(true);
      
      try {
        const queryParams = new URLSearchParams({
          startDate: date,
          endDate: date
        });
        
        const response = await fetchFromApi(`/meals?${queryParams}`);
        
        if (!isMounted) return;
        
        const transformedMeals = parseApiResponse(response);
        
        setFoods(transformedMeals);
        setError(null);
      } catch (err) {
        console.error('Unexpected error in fetchMeals:', err);
        if (isMounted) {
          setError('An unexpected error occurred. Please try again.');
          setFoods(INITIAL_FOODS_STATE);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchMeals();
    
    return () => {
      isMounted = false;
    };
  }, [date]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(() => {
      searchFoods(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Render 
  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-6 flex-grow">
        <h1 className="text-3xl font-bold mb-6">Meal Tracker</h1>

        <div className="mb-6">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full md:w-64"
          />
        </div>

        <div className="bg-gray-100 p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Food</h2>
          
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div className="relative" ref={searchInputRef}>
              <div className="relative">
                <Input
                  placeholder="Search for a food..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-300"
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <Search className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                {searchQuery && (
                  <button 
                    className="absolute inset-y-0 right-0 flex items-center pr-3" 
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
              
              {showSearchResults && (
                <div ref={searchResultsRef}>
                  <FoodSearchResults 
                    results={searchResults} 
                    onSelect={handleSelectFood}
                    onClose={() => setShowSearchResults(false)}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Input
              placeholder="Food name"
              value={manualFoodName}
              onChange={(e) => setManualFoodName(e.target.value)}
              className="bg-gray-50 border-gray-300"
            />
            
            <Input
              type="number"
              placeholder="Quantity (grams)"
              value={quantity}
              onChange={handleQuantityChange}
              className="bg-gray-50 border-gray-300"
            />
            
            <div className="relative">
              <Input
                type="number"
                placeholder="Calories per serving"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="bg-gray-50 border-gray-300"
              />
              {selectedFood && caloriesPer100g && (
                <div className="text-xs text-gray-500 mt-1">
                  Auto-calculated from {caloriesPer100g} kcal/100g
                </div>
              )}
            </div>
            
            <div className="relative" style={{ zIndex: 50 }}>
            <Select
              value={selectedMealType}
              onValueChange={setSelectedMealType}
              options={MEAL_TYPES}
              className="bg-gray-200 border-gray-300"
            />
            </div>
          </div>

          {selectedFoodObject && (
            <Card className="p-3 mb-4 border-blue-200 bg-blue-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{manualFoodName}</p>
                  <p className="text-sm text-gray-600">{caloriesPer100g} calories per 100g</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetFoodForm}
                  className="text-gray-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          <Button onClick={addFoodItem} disabled={isAddingFood} style={{ zIndex: 10 }}>
            {isAddingFood ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Adding...
              </>
            ) : "Add Food"}
          </Button>
        </div>

        <div className="mb-6 bg-gray-100 p-4 rounded-lg shadow">
          <p className="text-lg font-semibold">
            Total Calories: {calculateTotalCalories()} kcal
          </p>
          {isLoading && (
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
              <span>Syncing...</span>
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-500 p-4 bg-red-50 rounded-md mb-4">
            {error}
            <Button 
              onClick={() => setError(null)} 
              className="ml-4"
              variant="outline"
            >
              Dismiss
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MEAL_TYPES.map((mealType) => (
            <MealSection
              key={mealType.value}
              id={mealType.value}
              title={mealType.label}
              items={foods[mealType.value] || []}
              removeFoodItem={(id) => removeFoodItem(mealType.value, id)}
            />
          ))}
        </div>

        <div className="bg-gray-800 text-white py-8 mt-auto">
          <div className="container text-center">
            <p>&copy; {new Date().getFullYear()} NutriTrack. All rights reserved.</p>
            <Button 
              variant="outline" 
              className="mt-4 text-white border-white hover:bg-gray-700"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}