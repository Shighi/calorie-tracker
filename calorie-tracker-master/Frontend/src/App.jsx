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
import LandingPage from './pages/LandingPage';
import About from './pages/Aboutus';
import Contact from './pages/Contactus';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-16 flex-1">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/meal-tracker" element={
            <ProtectedRoute>
              <MealTracker />
            </ProtectedRoute>
          } />
          <Route path="/food-database" element={
            <ProtectedRoute>
              <FoodDatabase />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      
      {/* Toast Notifications */}
      <Toaster position="bottom-right" />
    </div>
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