import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import MealTracker from './pages/MealTracker';
import FoodDatabase from './pages/FoodDatabase';
import Profile from './pages/Profile';
import Login from './pages/LoginPage';
import Signup from './pages/SignupPage';
import LandingPage from './pages/landingpage';
import About from './pages/Aboutus';
import Contact from './pages/Contactus';

function AppContent() {
  const { user, loading } = useAuth();
  
  // Protected route component as an inline function
  const ProtectedRoute = ({ children }) => {
    // Show loading state while checking auth
    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    return children;
  };

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/meal-tracker" 
          element={
            <ProtectedRoute>
              <MealTracker />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/food-database" 
          element={
            <ProtectedRoute>
              <FoodDatabase />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {/* Toast Notifications */}
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}