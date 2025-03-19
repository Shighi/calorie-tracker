import { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfWeek, endOfWeek } from 'date-fns';

const useNutritionData = () => {
  const [dailyNutritionData, setDailyNutritionData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNutritionData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get today's date in YYYY-MM-DD format
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Fetch daily nutrition data
        const dailyResponse = await axios.get(`/api/nutrition/daily?date=${today}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Fetch weekly nutrition data
        const startDate = format(startOfWeek(new Date()), 'yyyy-MM-dd');
        const endDate = format(endOfWeek(new Date()), 'yyyy-MM-dd');
        const weeklyResponse = await axios.get(`/api/nutrition/weekly?startDate=${startDate}&endDate=${endDate}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Process daily nutrition data
        if (dailyResponse.data && dailyResponse.data.data) {
          // Map API response to the format expected by the Dashboard component
          setDailyNutritionData({
            calories: dailyResponse.data.data.total_calories || 0,
            protein: dailyResponse.data.data.protein || 0,
            carbs: dailyResponse.data.data.carbs || 0,
            fats: dailyResponse.data.data.fat || 0,
            daily_calorie_goal: dailyResponse.data.data.daily_goal || 2000
          });
        }
        
        // Process weekly nutrition data
        if (weeklyResponse.data && weeklyResponse.data.data && weeklyResponse.data.data.summary) {
          // Map the weekly summary to an array of calorie values for each day of the week
          // Initialize with zeros
          const weeklyCalories = [0, 0, 0, 0, 0, 0, 0];
          
          weeklyResponse.data.data.summary.forEach(day => {
            const dayDate = new Date(day.date);
            const dayOfWeek = dayDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
            weeklyCalories[dayOfWeek] = day.total_calories || 0;
          });
          
          setWeeklyData(weeklyCalories);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching nutrition data:', err);
        setError(err.message || 'Failed to fetch nutrition data');
        setIsLoading(false);
      }
    };
    
    fetchNutritionData();
  }, []);
  
  return { dailyNutritionData, weeklyData, isLoading, error };
};

export default useNutritionData;