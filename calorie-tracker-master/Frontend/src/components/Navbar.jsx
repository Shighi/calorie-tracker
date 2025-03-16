import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "./ui/button";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/'); // This will redirect to the landing page
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <nav className="bg-[#008000] text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">NutriTrack</Link>
        
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-gray-200">Dashboard</Link>
              <Link to="/food-database" className="hover:text-gray-200">Food Database</Link>
              <Link to="/meal-tracker" className="hover:text-gray-200">Meal Tracker</Link>
              <Link to="/profile" className="hover:text-gray-200">Profile</Link>
              <Button 
                variant="secondary"
                className="text-primary hover:text-primary/80 bg-white hover:bg-gray-100"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/home" className="hover:text-gray-200">Home</Link>
              <Link to="/about-us" className="hover:text-gray-200">About Us</Link>
              <Link to="/contact-us" className="hover:text-gray-200">Contact Us</Link>
              <Link to="/login" className="hover:text-gray-200">Login</Link>
              <Link to="/signup" className="hover:text-gray-200">Signup</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}