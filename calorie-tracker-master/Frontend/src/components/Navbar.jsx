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
    <nav className="bg-primary text-white border-b border-gray-200 px-4 py-2.5 fixed w-full top-0 z-50">
      <div className="flex flex-wrap justify-between items-center">
        <Link to="/" className="flex items-center">
          <span className="self-center text-xl font-semibold whitespace-nowrap text-white">
            NutriTrack
          </span>
        </Link>

        <div className="flex md:order-2">
          {user ? (
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="ml-2"
            >
              Logout
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" className="text-white border-white hover:bg-primary-dark" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button className="bg-white text-primary hover:bg-gray-100" asChild>
                <Link to="/signup">Signup</Link>
              </Button>
            </div>
          )}
        </div>

        <div className="hidden w-full md:flex md:w-auto md:order-1">
          <ul className="flex flex-col p-4 mt-4 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium">
            {user ? (
              <>
                <li>
                  <Link 
                    to="/dashboard" 
                    className="block py-2 pr-4 pl-3 text-white hover:text-gray-200 rounded md:p-0"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/meal-tracker" 
                    className="block py-2 pr-4 pl-3 text-white hover:text-gray-200 rounded md:p-0"
                  >
                    Meal Tracker
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/food-database" 
                    className="block py-2 pr-4 pl-3 text-white hover:text-gray-200 rounded md:p-0"
                  >
                    Food Database
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/profile" 
                    className="block py-2 pr-4 pl-3 text-white hover:text-gray-200 rounded md:p-0"
                  >
                    Profile
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link 
                    to="/" 
                    className="block py-2 pr-4 pl-3 text-white hover:text-gray-200 rounded md:p-0"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/about" 
                    className="block py-2 pr-4 pl-3 text-white hover:text-gray-200 rounded md:p-0"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/contact" 
                    className="block py-2 pr-4 pl-3 text-white hover:text-gray-200 rounded md:p-0"
                  >
                    Contact Us
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}