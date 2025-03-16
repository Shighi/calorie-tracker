import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/landingpage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import MealTracker from './pages/MealTracker';
import FoodDatabase from './pages/FoodDatabase';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import AboutUs from './pages/AboutUs'; 
import ContactUs from './pages/ContactUs'; 

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<LandingPage />} />
              <Route path="/about-us" element={<AboutUs />} /> 
              <Route path="/contact-us" element={<ContactUs />} /> 
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/meal-tracker" element={<MealTracker />} />
              <Route path="/food-database" element={<FoodDatabase />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
