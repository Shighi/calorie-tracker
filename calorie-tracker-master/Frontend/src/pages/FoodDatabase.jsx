import { useState, useEffect } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

// Enhanced FoodCard component with locale display
const FoodCard = ({ food }) => {
  // Ensure all necessary properties exist
  const displayData = {
    name: food.name || 'Unknown Food',
    category: food.category || 'Uncategorized',
    calories: food.calories || 0,
    proteins: food.proteins || food.protein || 0,
    carbs: food.carbs || 0,
    fats: food.fats || food.fat || 0,
    locale: food.locale || food.region || null,
    serving_size: food.serving_size || null,
    serving_unit: food.serving_unit || null
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{displayData.name}</CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{displayData.category}</Badge>
          {displayData.locale && (
            <Badge variant="outline">
              {displayData.locale.name || displayData.locale.country || displayData.locale.region || displayData.locale}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Location</span>
            <span className="font-medium">
              {displayData.locale?.name || displayData.locale?.country || displayData.locale || 'Not Specified'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Calories</span>
            <span className="font-medium">{displayData.calories}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Protein</span>
            <span className="font-medium">{displayData.proteins}g</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Carbs</span>
            <span className="font-medium">{displayData.carbs}g</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Fat</span>
            <span className="font-medium">{displayData.fats}g</span>
          </div>
          {displayData.serving_size && displayData.serving_unit && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Serving</span>
              <span className="font-medium">{displayData.serving_size} {displayData.serving_unit}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Add Food Modal Component
const AddFoodModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    calories: '',
    proteins: '',
    carbs: '',
    fats: '',
    serving_size: '',
    serving_unit: '',
    is_public: false,
    locale_id: ''
  });
  const [locales, setLocales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLocales = async () => {
      if (!isOpen) return;
      
      try {
        // Configure API base URL
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        const response = await axios.get(`${API_BASE_URL}/locales`);
        
        if (response.data && response.data.data) {
          setLocales(response.data.data.locales || []);
        } else if (Array.isArray(response.data)) {
          setLocales(response.data);
        } else {
          setLocales([]);
        }
      } catch (error) {
        console.error('Error fetching locales:', error);
        setError('Failed to load locations. Please try again.');
      }
    };

    fetchLocales();
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
    setError('');
    
    try {
      const numericFields = ['calories', 'proteins', 'carbs', 'fats', 'locale_id', 'serving_size'];
      const formattedData = { ...formData };
      
      // Convert string values to numbers for numeric fields
      numericFields.forEach(field => {
        if (formattedData[field]) {
          formattedData[field] = parseFloat(formattedData[field]);
        }
      });
      
      // Configure API base URL
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const response = await axios.post(`${API_BASE_URL}/foods`, formattedData);
      
      let savedFood;
      if (response.data && response.data.data) {
        savedFood = response.data.data;
      } else {
        savedFood = response.data;
      }
      
      onSave(savedFood);
      onClose();
    } catch (error) {
      console.error('Error adding food:', error);
      setError(error.response?.data?.message || 'Failed to add food item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add New Food</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
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
            <label className="block text-sm font-medium">Description</label>
            <Input 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
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
              <label className="block text-sm font-medium">Proteins (g)</label>
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
              <label className="block text-sm font-medium">Fats (g)</label>
              <Input 
                type="number" 
                name="fats" 
                value={formData.fats} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Serving Size</label>
              <Input 
                type="number" 
                name="serving_size" 
                value={formData.serving_size} 
                onChange={handleChange} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium">Serving Unit</label>
              <Input 
                name="serving_unit" 
                value={formData.serving_unit} 
                onChange={handleChange} 
                placeholder="g, ml, oz, etc." 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium">Location</label>
            <select 
              name="locale_id" 
              value={formData.locale_id} 
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a location</option>
              {locales.map(locale => (
                <option key={locale.id} value={locale.id}>
                  {locale.name || locale.code} {locale.region ? `- ${locale.region}` : ''}
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
  const [selectedLocale, setSelectedLocale] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [locales, setLocales] = useState(['All', 'East Africa', 'West Africa']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  
  // Configure API base URL from environment
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // Debounce search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      // Reset page to 1 when search changes
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch all food categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/foods/categories`);
        
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          setCategories(['All', ...response.data.data]);
        } else if (Array.isArray(response.data)) {
          setCategories(['All', ...response.data]);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        // Don't set error state here, as it's not critical for the app to function
      }
    };

    fetchCategories();
  }, [API_BASE_URL]);

  // Main data fetching effect
  useEffect(() => {
    const fetchFoodData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Configure the endpoint and params based on search state
        let endpoint = `${API_BASE_URL}/foods`;
        let params = {
          page,
          limit,
          sort: 'name',
          order: 'ASC'
        };
        
        // Add search query if it exists
        if (debouncedSearchQuery) {
          params.query = debouncedSearchQuery;
        }
        
        // Add category filter if it's not "All"
        if (selectedCategory !== 'All') {
          // Use category-specific endpoint if available
          params.category = selectedCategory;
        }

        // Add locale filter if it's not "All"
        if (selectedLocale !== 'All') {
          // Use locale-specific endpoint
          params.locale = selectedLocale;
        }
        
        const response = await axios.get(endpoint, { params });
        
        // Function to extract foods array from various response formats
        const extractFoodsAndCount = (data) => {
          let extractedFoods = [];
          let totalCount = 0;
          
          if (Array.isArray(data)) {
            extractedFoods = data;
            totalCount = data.length;
          } else if (data && typeof data === 'object') {
            // Check for common response structures
            if (data.data) {
              if (Array.isArray(data.data)) {
                extractedFoods = data.data;
              } else if (data.data.foods) {
                extractedFoods = data.data.foods;
              } else if (data.data.results) {
                extractedFoods = data.data.results;
              } else if (data.data.items) {
                extractedFoods = data.data.items;
              }
            } else if (data.foods) {
              extractedFoods = data.foods;
            } else if (data.results) {
              extractedFoods = data.results;
            } else if (data.items) {
              extractedFoods = data.items;
            }
            
            // Get total count from various possible fields
            totalCount = data.total || data.totalCount || 
                        (data.data && (data.data.total || data.data.totalCount)) || 
                        extractedFoods.length;
          }
          
          return { foods: extractedFoods, totalCount };
        };
        
        const { foods: fetchedFoods, totalCount } = extractFoodsAndCount(response.data);
        
        setFoods(Array.isArray(fetchedFoods) ? fetchedFoods : []);
        setTotalPages(Math.max(1, Math.ceil(totalCount / limit)));
        
        // Update search results state
        if (debouncedSearchQuery) {
          setSearchResults({
            query: debouncedSearchQuery,
            count: totalCount
          });
        } else {
          setSearchResults(null);
        }
      } catch (err) {
        console.error('API Error:', err);
        setError(`Failed to load food data: ${err.response?.data?.message || err.message}`);
        setFoods([]);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFoodData();
  }, [debouncedSearchQuery, selectedCategory, selectedLocale, page, limit, API_BASE_URL]);

  const handleAddFood = () => {
    setIsModalOpen(true);
  };

  const handleSaveFood = (newFood) => {
    // Add the new food to the list
    setFoods([newFood, ...foods]);
    
    // Update categories if needed
    if (newFood.category && !categories.includes(newFood.category)) {
      setCategories([...categories, newFood.category]);
    }

    // Update locales if needed
    if (newFood.locale && !locales.includes(newFood.locale)) {
      setLocales([...locales, newFood.locale]);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      // Scroll to top when changing pages
      window.scrollTo(0, 0);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  // Function to generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    
    // Logic to show 5 pages centered around current page
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={i === page ? "default" : "outline"}
          className="w-10 h-10 p-0"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    
    return buttons;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full pt-20">
        <div className="space-y-6">
          {/* Search and Add Food Bar */}
          <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search foods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              {searchQuery && (
                <button 
                  className="absolute right-3 top-3 text-gray-400" 
                  onClick={handleClearSearch}
                >
                  ✕
                </button>
              )}
            </div>
            <Button className="flex items-center gap-2" onClick={handleAddFood}>
              <Plus className="w-4 h-4" />
              Add New Food
            </Button>
          </div>

          {/* Search Results Summary */}
          {searchResults && (
            <div className="text-sm text-gray-600">
              Found {searchResults.count} result{searchResults.count !== 1 ? 's' : ''} for "{searchResults.query}"
            </div>
          )}

          {/* Category and Locale Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Categories:</span>
              {categories.map(category => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedCategory(category);
                    setPage(1);
                  }}
                >
                  {category}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Regions:</span>
              {locales.map(locale => (
                <Badge
                  key={locale}
                  variant={selectedLocale === locale ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedLocale(locale);
                    setPage(1);
                  }}
                >
                  {locale}
                </Badge>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="bg-gray-100 h-64 rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Food Cards Grid */}
              {foods && foods.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {foods.map((food, index) => (
                    <FoodCard key={food.id || food.food_id || `food-${index}`} food={food} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  {searchQuery ? (
                    <>
                      <p className="text-xl mb-2">No foods found matching "{searchQuery}"</p>
                      <p>Try a different search term or add a new food item</p>
                    </>
                  ) : error ? (
                    <p className="text-xl">Error loading foods</p>
                  ) : (
                    <p className="text-xl">No foods found in this category/region</p>
                  )}
                </div>
              )}
            </>
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
              <div className="flex items-center gap-1">
                {renderPaginationButtons()}
              </div>
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

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-center mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p>{error}</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="bg-gray-800 text-white py-8 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
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