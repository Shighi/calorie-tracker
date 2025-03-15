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
  const { weeklyData, isLoading } = useNutritionData();
  const [nutrientData, setNutrientData] = useState({
    protein: 0,
    carbs: 0,
    fat: 0,
  });

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
      <div className="min-h-screen bg-secondary">
        <div className="max-w-7xl mx-auto px-4 py-6">
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

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-poppins font-bold mb-6">
          Welcome, {user?.name}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Daily Nutrients</h2>
            <div className="h-64">
              <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Weekly Calories</h2>
            <div className="h-64">
              <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

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
    </div>
  );
}