import { useState, useEffect } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

const FoodCard = ({ food }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-semibold">{food.name}</CardTitle>
      <Badge variant="secondary">{food.category}</Badge>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Calories</span>
          <span className="font-medium">{food.calories}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Protein</span>
          <span className="font-medium">{food.protein}g</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Carbs</span>
          <span className="font-medium">{food.carbs}g</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Fat</span>
          <span className="font-medium">{food.fat}g</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function FoodDatabase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFoodData = async () => {
      try {
        const response = await axios.get('/api/foods');
        setFoods(response.data);
        const foodCategories = ['All', ...new Set(response.data.map(food => food.category))];
        setCategories(foodCategories);
        setIsLoading(false);
      } catch (err) {
        setError(`Failed to load food data: ${err.message}`);
        setIsLoading(false);
      }
    };

    fetchFoodData();
  }, []);

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-6 flex-1">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search foods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Food
            </Button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-gray-500" />
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div className="bg-gray-100 h-64 rounded-lg"></div>
                <div className="bg-gray-100 h-64 rounded-lg"></div>
                <div className="bg-gray-100 h-64 rounded-lg"></div>
                <div className="bg-gray-100 h-64 rounded-lg"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFoods.map(food => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          )}

          {filteredFoods.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              No foods found matching your criteria
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-500 text-center mt-4">
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="bg-gray-800 text-white py-8 w-full mt-auto">
        <div className="container text-center">
          <p>&copy; {new Date().getFullYear()} NutriTrack. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
