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
      <div className="flex gap-2 flex-wrap">
        <Badge variant="secondary">{food.category}</Badge>
        {food.locale && (
          <Badge variant="outline">{food.locale.country}, {food.locale.region}</Badge>
        )}
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Calories</span>
          <span className="font-medium">{food.calories}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Protein</span>
          <span className="font-medium">{food.proteins}g</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Carbs</span>
          <span className="font-medium">{food.carbs}g</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Fat</span>
          <span className="font-medium">{food.fats}g</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Add Food Modal Component
const AddFoodModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    calories: '',
    proteins: '',
    carbs: '',
    fats: '',
    is_public: false,
    location_id: ''
  });
  const [locales, setLocales] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLocales = async () => {
      try {
        const response = await axios.get('/api/locales');
        if (response.data && response.data.data) {
          setLocales(response.data.data.locales || []);
        }
      } catch (error) {
        console.error('Error fetching locales:', error);
      }
    };

    if (isOpen) {
      fetchLocales();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const numericFields = ['calories', 'proteins', 'carbs', 'fats', 'location_id'];
      const formattedData = { ...formData };
      
      // Convert string values to numbers for numeric fields
      numericFields.forEach(field => {
        if (formattedData[field]) {
          formattedData[field] = parseFloat(formattedData[field]);
        }
      });
      
      const response = await axios.post('/api/foods', formattedData);
      onSave(response.data.data);
      onClose();
    } catch (error) {
      console.error('Error adding food:', error);
      alert('Failed to add food item');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Food</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <Input 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium">Category</label>
            <Input 
              name="category" 
              value={formData.category} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Calories</label>
              <Input 
                type="number" 
                name="calories" 
                value={formData.calories} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium">Protein (g)</label>
              <Input 
                type="number" 
                name="proteins" 
                value={formData.proteins} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium">Carbs (g)</label>
              <Input 
                type="number" 
                name="carbs" 
                value={formData.carbs} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium">Fat (g)</label>
              <Input 
                type="number" 
                name="fats" 
                value={formData.fats} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium">Location</label>
            <select 
              name="location_id" 
              value={formData.location_id} 
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a location</option>
              {locales.map(locale => (
                <option key={locale.id} value={locale.id}>
                  {locale.country} - {locale.region || 'All regions'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="is_public" 
              name="is_public" 
              checked={formData.is_public} 
              onChange={handleChange} 
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_public" className="ml-2 block text-sm">
              Make this food public
            </label>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Food'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function FoodDatabase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchFoodData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Use the search endpoint if there's a query
        const endpoint = debouncedSearchQuery ? '/api/foods/search' : '/api/foods';
        
        // Fetch foods with appropriate query parameters
        const response = await axios.get(endpoint, {
          params: {
            page,
            limit,
            query: debouncedSearchQuery,
            category: selectedCategory !== 'All' ? selectedCategory : '',
            sort: 'name',
            order: 'ASC'
          }
        });
        
        // Handle the response structure from our backend
        if (response.data && response.data.data) {
          const { foods: fetchedFoods, totalCount } = response.data.data;
          // Make sure foods is always an array
          setFoods(Array.isArray(fetchedFoods) ? fetchedFoods : []);
          setTotalPages(Math.ceil(totalCount / limit));
          
          // Extract unique categories from foods
          if (fetchedFoods && Array.isArray(fetchedFoods) && fetchedFoods.length > 0) {
            const uniqueCategories = [...new Set(fetchedFoods.map(food => food.category).filter(Boolean))];
            setCategories(['All', ...uniqueCategories]);
          }
        } else {
          // If response doesn't have the expected structure, set foods to empty array
          setFoods([]);
        }
        
        setIsLoading(false);
      } catch (err) {
        setError(`Failed to load food data: ${err.message}`);
        setIsLoading(false);
        setFoods([]);
      }
    };

    fetchFoodData();
  }, [debouncedSearchQuery, selectedCategory, page, limit]);

  // Function to handle adding a new food
  const handleAddFood = () => {
    setIsModalOpen(true);
  };

  const handleSaveFood = (newFood) => {
    // Add the new food to the list and refresh the data
    setFoods([newFood, ...foods]);
    // You might also want to reset the page to 1 or reload the data completely
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

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
            <Button className="flex items-center gap-2" onClick={handleAddFood}>
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
              {foods.map(food => (
                <FoodCard key={food.food_id} food={food} />
              ))}
            </div>
          )}

          {foods.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              No foods found matching your criteria
            </div>
          )}
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              <Button 
                variant="outline" 
                onClick={() => handlePageChange(page - 1)} 
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button 
                variant="outline" 
                onClick={() => handlePageChange(page + 1)} 
                disabled={page === totalPages}
              >
                Next
              </Button>
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

      {/* Add Food Modal */}
      <AddFoodModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveFood}
      />
    </div>
  );
}