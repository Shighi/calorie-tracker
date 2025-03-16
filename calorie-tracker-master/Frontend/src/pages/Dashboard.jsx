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
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Calories Consumed',
        data: weeklyData,
        backgroundColor: '#4CAF50',
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary flex flex-col">
        <div className="max-w-7xl mx-auto px-4 py-6 flex-1">
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
      <div className="min-h-screen bg-secondary flex flex-col">
        <div className="max-w-7xl mx-auto px-4 py-6 flex-1">
          <div className="text-red-500 text-center">
            <p>Error loading data. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-6 flex-1">
        <h1 className="text-3xl font-poppins font-bold mb-6">
          Welcome, {user?.name}
        </h1>

        {/* Profile Overview */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Profile Overview</h2>
          <p className="text-gray-700">Weight: {user?.weight} kg</p>
          <p className="text-gray-700">Height: {user?.height} cm</p>
          <p className="text-gray-700">Daily Calorie Goal: {user?.daily_calorie_goal} kcal</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nutrients Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Daily Nutrients</h2>
            <div className="h-full">
              <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Weekly Calories Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Weekly Calories</h2>
            <div className="h-full">
              <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <button className="w-full bg-primary text-white py-2 px-4 rounded mb-4 hover:bg-green-600">
              Log Meal
            </button>
            <button className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-green-600">
              Set Goals
            </button>
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
