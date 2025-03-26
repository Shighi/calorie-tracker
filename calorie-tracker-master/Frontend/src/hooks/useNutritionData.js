import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfDay } from 'date-fns';
import api from '../utils/api';

const useNutritionData = () => {
  const [dailyNutritionData, setDailyNutritionData] = useState(null);
  const [weeklyNutritionData, setWeeklyNutritionData] = useState([]);
  const [monthlyNutritionData, setMonthlyNutritionData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const fetchDailyNutrition = async (date) => {
    try {
      const response = await api.get('/nutrition/daily', {
        params: { date: format(date, 'yyyy-MM-dd') }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching daily nutrition:', error);
      throw error;
    }
  };

  const fetchWeeklyNutrition = async (startDate, endDate) => {
    try {
      const response = await api.get('/nutrition/weekly', {
        params: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd')
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching weekly nutrition:', error);
      throw error;
    }
  };

  const fetchMonthlyNutrition = async (month, year) => {
    try {
      const response = await api.get('/nutrition/monthly', {
        params: { month, year }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly nutrition:', error);
      throw error;
    }
  };

  const refreshData = () => setRefreshTrigger(prev => !prev);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // Months are 1-based in the API
        const currentYear = now.getFullYear();

        // Fetch all data in parallel
        const [daily, weekly, monthly] = await Promise.all([
          fetchDailyNutrition(startOfDay(now)),
          fetchWeeklyNutrition(startOfWeek(now), endOfWeek(now)),
          fetchMonthlyNutrition(currentMonth, currentYear)
        ]);

        // Process daily data
        setDailyNutritionData({
          calories: daily.calories || 0,
          protein: daily.protein || 0,
          carbs: daily.carbs || 0,
          fat: daily.fat || 0,
          daily_calorie_goal: daily.daily_calorie_goal || 2000
        });

        // Process weekly data
        setWeeklyNutritionData(
          weekly.summary?.map(day => ({
            date: format(new Date(day.date), 'EEE'),
            calories: day.total_calories || 0
          })) || []
        );

        // Process monthly data
        setMonthlyNutritionData(
          monthly.summary?.map(week => ({
            week: week.week_number,
            calories: week.total_calories || 0
          })) || []
        );

      } catch (error) {
        setError(error.response?.data?.message || error.message || 'Failed to fetch nutrition data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [refreshTrigger]);

  return { 
    dailyNutritionData, 
    weeklyNutritionData, 
    monthlyNutritionData,
    isLoading, 
    error,
    refreshData
  };
};

export default useNutritionData;