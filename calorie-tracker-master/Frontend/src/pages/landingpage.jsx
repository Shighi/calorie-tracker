import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "../components/ui/button";
import SliderImage from '../assets/images/Slider2.jpg'; 


export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-primary/10">
      {/* Hero Section with Parallax */}
      <div 
        className="hero bg-cover bg-fixed bg-center relative py-24"
        style={{ backgroundImage: `url(${SliderImage})`
      }}
      >
        <div className="container mx-auto px-4 text-center text-white relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Welcome to Your Nutrition Journey
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join us today to track your nutrition, set personalized goals, and make better food choices for a healthier lifestyle.
          </p>

          {/* Call to Action Buttons */}
          <div className="space-x-4">
            {!user && (
              <Link to="/signup">
                <Button size="lg" className="px-8">
                  Get Started Free
                </Button>
              </Link>
            )}
            {user && (
              <Link to="/meal-tracker">
                <Button size="lg" className="px-8">
                  Track Your Meals
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-black">
            Track Your Nutrition Journey
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Achieve your health goals with our comprehensive nutrition tracking platform. 
            Monitor calories, track macros, and maintain a balanced diet effortlessly.
          </p>
          
          <div className="space-x-4">
            {!user && (
              <Link to="/signup">
                <Button size="lg" className="px-8">
                  Get Started Free
                </Button>
              </Link>
            )}
            {user && (
              <Link to="/meal-tracker">
                <Button size="lg" className="px-8">
                  Track Your Meals
                </Button>
              </Link>
            )}
          </div>

          {/* Feature Highlights */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-black">Food Database</h3>
              <p className="text-gray-600">Access thousands of foods with detailed nutritional information.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-black">Meal Tracking</h3>
              <p className="text-gray-600">Log your meals and track your daily nutrition goals easily.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-black">Progress Insights</h3>
              <p className="text-gray-600">View detailed analytics of your nutrition journey over time.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="bg-gray-800 text-white py-8">
        <div className="container mx-auto text-center">
          <p>&copy; 2025 Nutritrack. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
