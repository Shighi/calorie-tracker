import { useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const mockFoods = [
  { id: 1, name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, category: 'Fruits' },
  { id: 2, name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, category: 'Protein' },
  { id: 3, name: 'Brown Rice', calories: 216, protein: 5, carbs: 45, fat: 1.8, category: 'Grains' },
  { id: 4, name: 'Salmon', calories: 208, protein: 22, carbs: 0, fat: 13, category: 'Protein' },
  { id: 5, name: 'Broccoli', calories: 55, protein: 3.7, carbs: 11.2, fat: 0.6, category: 'Vegetables' },
  { id: 6, name: 'Greek Yogurt', calories: 130, protein: 12, carbs: 9, fat: 4, category: 'Dairy' }
];

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

  const categories = ['All', ...new Set(mockFoods.map(food => food.category))];

  const filteredFoods = mockFoods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFoods.map(food => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>

          {filteredFoods.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No foods found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  );
}