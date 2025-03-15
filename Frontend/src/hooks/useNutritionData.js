import { useState, useEffect } from 'react';

export default function useNutritionData() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Replace with actual API call
        const response = await mockApiCall();
        setData(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { weeklyData: data, isLoading, error };
}