import { useEffect, useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import useNutritionData from '../hooks/useNutritionData';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { user } = useAuth();
  const { weeklyData, dailyNutritionData, isLoading, error } = useNutritionData();
  const [nutrientData, setNutrientData] = useState({
    protein: 0,
    carbs: 0,
    fat: 0,
    calories: 0,
  });
  const [showMealForm, setShowMealForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [meal, setMeal] = useState({
    name: '',
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0,
    meal_type: 'breakfast',
  });
  const [goals, setGoals] = useState({
    daily_calorie_goal: user?.daily_calorie_goal || 2000,
    protein_goal: user?.protein_goal || 50,
    carbs_goal: user?.carbs_goal || 250,
    fats_goal: user?.fats_goal || 70,
  });

  useEffect(() => {
    if (dailyNutritionData) {
      setNutrientData({
        protein: dailyNutritionData.protein || 0,
        carbs: dailyNutritionData.carbs || 0,
        fat: dailyNutritionData.fats || 0,
        calories: dailyNutritionData.calories || 0,
      });
    }
  }, [dailyNutritionData]);

  const pieData = {
    labels: ['Protein', 'Carbohydrates', 'Fats'],
    datasets: [
      {
        data: [nutrientData.protein, nutrientData.carbs, nutrientData.fat],
        backgroundColor: ['#4CAF50', '#81C784', '#A5D6A7'],
      },
    ],
  };

  const barData = {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        label: 'Calories Consumed',
        data: weeklyData,
        backgroundColor: '#4CAF50',
      },
    ],
  };

  const handleMealChange = (e) => {
    const { name, value } = e.target;
    setMeal({
      ...meal,
      [name]: name === 'name' || name === 'meal_type' ? value : Number(value),
    });
  };

  const handleGoalChange = (e) => {
    const { name, value } = e.target;
    setGoals({
      ...goals,
      [name]: Number(value),
    });
  };

  const handleMealSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send this data to your API
    console.log('Meal logged:', meal);
    
    // For demonstration, let's update the nutrient data directly
    setNutrientData({
      protein: nutrientData.protein + meal.protein,
      carbs: nutrientData.carbs + meal.carbs,
      fat: nutrientData.fat + meal.fats,
      calories: nutrientData.calories + meal.calories,
    });
    
    // Reset form and close
    setMeal({
      name: '',
      protein: 0,
      carbs: 0,
      fats: 0,
      calories: 0,
      meal_type: 'breakfast',
    });
    setShowMealForm(false);
  };

  const handleGoalSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send this data to your API
    console.log('Goals updated:', goals);
    
    // Close the form
    setShowGoalForm(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary flex flex-col pt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-100 h-96 rounded-lg"></div>
              <div className="bg-gray-100 h-96 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary flex flex-col pt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
          <div className="text-red-500 text-center">
            <p>Error loading data: {error}</p>
            <button 
              className="mt-4 bg-primary text-white py-2 px-4 rounded hover:bg-green-600"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const calorieGoal = goals.daily_calorie_goal || dailyNutritionData?.daily_calorie_goal || 2000;
  const currentCalories = nutrientData.calories;
  const caloriePercentage = Math.min(Math.round((currentCalories / calorieGoal) * 100), 100);

  return (
    <div className="min-h-screen bg-secondary flex flex-col pt-16"> {/* Added pt-16 for navbar space */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        <h1 className="text-3xl font-poppins font-bold mb-6">
          Welcome, {user?.username || 'User'}
        </h1>

        {/* Profile Overview */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Profile Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-700">Daily Calorie Goal: {calorieGoal} kcal</p>
              <p className="text-gray-700">Current Calories: {currentCalories} kcal</p>
              <p className="text-gray-700">
                Progress: {caloriePercentage}% of daily goal
              </p>
            </div>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-primary h-4 rounded-full"
                  style={{ width: `${caloriePercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nutrients Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Daily Nutrients</h2>
            <div className="h-64">
              <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-100 p-2 rounded">
                <p className="font-semibold">Protein</p>
                <p>{nutrientData.protein}g</p>
              </div>
              <div className="bg-green-100 p-2 rounded">
                <p className="font-semibold">Carbs</p>
                <p>{nutrientData.carbs}g</p>
              </div>
              <div className="bg-green-100 p-2 rounded">
                <p className="font-semibold">Fats</p>
                <p>{nutrientData.fat}g</p>
              </div>
            </div>
          </div>

          {/* Weekly Calories Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Weekly Calories</h2>
            <div className="h-64">
              <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <button 
              className="w-full bg-primary text-white py-2 px-4 rounded mb-4 hover:bg-green-600"
              onClick={() => setShowMealForm(true)}
            >
              Log Meal
            </button>
            <button 
              className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-green-600"
              onClick={() => setShowGoalForm(true)}
            >
              Set Goals
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Meal Logging */}
      {showMealForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Log a Meal</h2>
            <form onSubmit={handleMealSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Meal Name
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g., Oatmeal with Berries"
                  value={meal.name}
                  onChange={handleMealChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="meal_type">
                  Meal Type
                </label>
                <select
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="meal_type"
                  name="meal_type"
                  value={meal.meal_type}
                  onChange={handleMealChange}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="protein">
                  Protein (g)
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="protein"
                  name="protein"
                  type="number"
                  min="0"
                  value={meal.protein}
                  onChange={handleMealChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carbs">
                  Carbohydrates (g)
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="carbs"
                  name="carbs"
                  type="number"
                  min="0"
                  value={meal.carbs}
                  onChange={handleMealChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fats">
                  Fats (g)
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="fats"
                  name="fats"
                  type="number"
                  min="0"
                  value={meal.fats}
                  onChange={handleMealChange}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="calories">
                  Calories (kcal)
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="calories"
                  name="calories"
                  type="number"
                  min="0"
                  value={meal.calories}
                  onChange={handleMealChange}
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  className="bg-primary text-white py-2 px-4 rounded hover:bg-green-600 focus:outline-none focus:shadow-outline"
                  type="submit"
                >
                  Log Meal
                </button>
                <button
                  className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 focus:outline-none focus:shadow-outline"
                  type="button"
                  onClick={() => setShowMealForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Setting Goals */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Set Nutrition Goals</h2>
            <form onSubmit={handleGoalSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="daily_calorie_goal">
                  Daily Calorie Goal (kcal)
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="daily_calorie_goal"
                  name="daily_calorie_goal"
                  type="number"
                  min="1000"
                  max="5000"
                  value={goals.daily_calorie_goal}
                  onChange={handleGoalChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="protein_goal">
                  Protein Goal (g)
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="protein_goal"
                  name="protein_goal"
                  type="number"
                  min="0"
                  value={goals.protein_goal}
                  onChange={handleGoalChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="carbs_goal">
                  Carbohydrates Goal (g)
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="carbs_goal"
                  name="carbs_goal"
                  type="number"
                  min="0"
                  value={goals.carbs_goal}
                  onChange={handleGoalChange}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fats_goal">
                  Fats Goal (g)
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="fats_goal"
                  name="fats_goal"
                  type="number"
                  min="0"
                  value={goals.fats_goal}
                  onChange={handleGoalChange}
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  className="bg-primary text-white py-2 px-4 rounded hover:bg-green-600 focus:outline-none focus:shadow-outline"
                  type="submit"
                >
                  Save Goals
                </button>
                <button
                  className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 focus:outline-none focus:shadow-outline"
                  type="button"
                  onClick={() => setShowGoalForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Section */}
      <div className="bg-gray-800 text-white py-8 mt-auto w-full">
        <div className="container text-center">
          <p>&copy; {new Date().getFullYear()} NutriTrack. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}