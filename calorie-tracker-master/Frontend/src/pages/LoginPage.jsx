import { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      
      // Call the login function from AuthContext with the correct parameter names
      const success = await login(emailOrUsername, password);
      
      if (success) {
        // Navigate to dashboard on successful login
        navigate('/dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      let errorMessage = 'Failed to sign in';
      
      console.error('Login error:', err);
      
      // Handle specific error responses from API
      if (err.response) {
        switch (err.response.status) {
          case 400:
            errorMessage = 'Email/username and password are required';
            break;
          case 401:
            errorMessage = 'Invalid credentials';
            break;
          default:
            errorMessage = err.response.data?.message || errorMessage;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex-grow">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sign in to your account
        </h2>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700">
                  Email or Username
                </label>
                <div className="mt-1">
                  <input
                    id="emailOrUsername"
                    name="emailOrUsername"
                    type="text"
                    autoComplete="email username"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="Enter your email or username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>
            </form>

            {/* Forgot Password Link */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Forgot your password?{' '}
                <a href="/forgot-password" className="font-medium text-primary hover:text-primary-dark">
                  Reset it here
                </a>
              </p>
            </div>

            {/* Don't have an account? */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/signup" className="font-medium text-primary hover:text-primary-dark">
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} NutriTrack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}