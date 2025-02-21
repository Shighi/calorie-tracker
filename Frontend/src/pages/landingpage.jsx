import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "../components/ui/button";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-primary/10">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
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

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Food Database</h3>
              <p className="text-gray-600">Access thousands of foods with detailed nutritional information.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Meal Tracking</h3>
              <p className="text-gray-600">Log your meals and track your daily nutrition goals easily.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Progress Insights</h3>
              <p className="text-gray-600">View detailed analytics of your nutrition journey over time.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}