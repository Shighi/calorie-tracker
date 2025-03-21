import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Common style for both authenticated and non-authenticated navbars
  const navbarBgColor = "bg-primary"; // Use the same green as buttons

  return (
    <nav className={`${navbarBgColor} text-white fixed w-full z-50`}> {/* Increased z-index from 10 to 50 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="font-bold text-xl">NutriTrack</Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {user ? (
                  // Authenticated navigation
                  <>
                    <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-600">Dashboard</Link>
                    <Link to="/meal-tracker" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-600">Meal Tracker</Link>
                    <Link to="/food-database" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-600">Food Database</Link>
                    <Link to="/profile" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-600">Profile</Link>
                  </>
                ) : (
                  // Non-authenticated navigation
                  <>
                    <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-600">Home</Link>
                    <Link to="/about" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-600">About Us</Link>
                    <Link to="/contact" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-600">Contact Us</Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-green-600 hover:bg-green-700"
                >
                  Logout
                </button>
              ) : (
                <div className="flex space-x-4">
                  <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-green-600">Login</Link>
                  <Link to="/signup" className="px-3 py-2 rounded-md text-sm font-medium bg-white text-primary hover:bg-gray-200">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-green-600 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon for menu (hamburger or X) */}
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, toggle based on menu state */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {user ? (
            // Authenticated mobile navigation
            <>
              <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-600">Dashboard</Link>
              <Link to="/meal-tracker" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-600">Meal Tracker</Link>
              <Link to="/food-database" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-600">Food Database</Link>
              <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-600">Profile</Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-green-600 hover:bg-green-700"
              >
                Logout
              </button>
            </>
          ) : (
            // Non-authenticated mobile navigation
            <>
              <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-600">Home</Link>
              <Link to="/about" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-600">About Us</Link>
              <Link to="/contact" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-600">Contact Us</Link>
              <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-600">Login</Link>
              <Link to="/signup" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-green-600">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}