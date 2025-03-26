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
import axios from 'axios';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Helper function to calculate nutritional info from meals
const calculateNutritionFromMeals = (meals) => {
  const nutritionSummary = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };

  if (!meals) return nutritionSummary;

  Object.values(meals).forEach(mealType => {
    mealType.forEach(food => {
      const servingFactor = food.quantity / 100;
      nutritionSummary.calories += food.calories * servingFactor;
      nutritionSummary.protein += food.proteins ? food.proteins * servingFactor : 0;
      nutritionSummary.carbs += food.carbs ? food.carbs * servingFactor : 0;
      nutritionSummary.fat += food.fats ? food.fats * servingFactor : 0;
    });
  });

  return nutritionSummary;
};

// Helper function to get weekly calorie data
const getWeeklyCalorieData = (meals, daysToShow = 7) => {
  if (!meals) return [];

  const today = new Date();
  const weekData = [];

  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    // Filter meals for this specific date
    const dailyMeals = Object.values(meals).reduce((acc, mealType) => {
      const filteredMeals = mealType.filter(food => 
        food.log_date === dateString
      );
      return [...acc, ...filteredMeals];
    }, []);

    const dailyCalories = dailyMeals.reduce((total, food) => {
      const servingFactor = food.quantity / 100;
      return total + (food.calories * servingFactor);
    }, 0);

    weekData.push({
      date: dateString,
      calories: Math.round(dailyCalories)
    });
  }

  return weekData;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [meals, setMeals] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calorieGoal, setCalorieGoal] = useState(2000);

  // Fetch user profile to get up-to-date calorie goal
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token');
        }

        const response = await axios.get('http://localhost:3000/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Update calorie goal from user profile
        if (response.data.data.daily_calorie_target) {
          setCalorieGoal(response.data.data.daily_calorie_target);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch meals data
  useEffect(() => {
    const fetchMeals = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token');
        setIsLoading(false);
        return;
      }

      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6); // Last 7 days

        const queryParams = new URLSearchParams({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });

        const response = await axios.get(`${API_BASE_URL}/meals?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        const transformedMeals = {
          breakfast: [],
          lunch: [],
          dinner: [],
          snack: []
        };

        (response.data.data?.meals || response.data.data || []).forEach(meal => {
          const mealType = (meal.type || 'lunch').toLowerCase();
          const validMealType = ['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType) 
            ? mealType 
            : 'lunch';

          const foodItems = meal.foods || meal.food_items || [];
          foodItems.forEach(food => {
            const foodItem = {
              name: food.name || 'Unknown Food',
              calories: Number(food.calories || 0),
              quantity: Number(food.serving_qty || 100),
              log_date: meal.log_date,
              proteins: food.proteins || 0,
              carbs: food.carbs || 0,
              fats: food.fats || 0
            };

            transformedMeals[validMealType].push(foodItem);
          });
        });

        setMeals(transformedMeals);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching meals:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchMeals();
  }, []);

  // Loading State
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

  // Error State
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

  // Calculate nutrition data
  const dailyNutritionData = calculateNutritionFromMeals(meals);
  const weeklyNutritionData = getWeeklyCalorieData(meals);

  // Prepare chart data
  const pieData = {
    labels: ['Protein', 'Carbohydrates', 'Fats'],
    datasets: [
      {
        data: [
          dailyNutritionData.protein, 
          dailyNutritionData.carbs, 
          dailyNutritionData.fat
        ],
        backgroundColor: ['#4CAF50', '#81C784', '#A5D6A7'],
      },
    ],
  };

  const barData = {
    labels: weeklyNutritionData.map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }),
    datasets: [
      {
        label: 'Calories Consumed',
        data: weeklyNutritionData.map(day => day.calories),
        backgroundColor: '#4CAF50',
      },
    ],
  };

  // Calculate calorie progress
  const currentCalories = dailyNutritionData.calories;
  const caloriePercentage = Math.min(Math.round((currentCalories / calorieGoal) * 100), 100);

  return (
    <div className="min-h-screen bg-secondary flex flex-col pt-16">
      <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        <h1 className="text-3xl font-poppins font-bold mb-6">
          Welcome, {user?.username || 'User'}
        </h1>

        {/* Profile Overview */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Daily Nutrition Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-700">Daily Calorie Goal: {calorieGoal} kcal</p>
              <p className="text-gray-700">Current Calories: {Math.round(currentCalories)} kcal</p>
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
              <Pie 
                data={pieData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }} 
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="bg-green-100 p-2 rounded">
                <p className="font-semibold">Protein</p>
                <p>{Math.round(dailyNutritionData.protein)}g</p>
              </div>
              <div className="bg-green-100 p-2 rounded">
                <p className="font-semibold">Carbs</p>
                <p>{Math.round(dailyNutritionData.carbs)}g</p>
              </div>
              <div className="bg-green-100 p-2 rounded">
                <p className="font-semibold">Fats</p>
                <p>{Math.round(dailyNutritionData.fat)}g</p>
              </div>
            </div>
          </div>

          {/* Weekly Calories Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Weekly Calories</h2>
            <div className="h-64">
              <Bar 
                data={barData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Calories'
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="bg-gray-800 text-white py-8 mt-auto w-full">
        <div className="container text-center">
          <p>&copy; {new Date().getFullYear()} NutriTrack. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}