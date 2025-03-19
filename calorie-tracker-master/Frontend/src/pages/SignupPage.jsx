// src/pages/SignupPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/button';

export default function SignupPage() {
  const { signup, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  // React Hook Form setup
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle form submission
  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      clearError?.();
      setLoading(true);
      
      const additionalData = {
        last_name: data.lastName || null,
        daily_calorie_target: data.dailyCalorieTarget || null
      };
      
      const success = await signup(data.email, data.password, data.username, additionalData);
      
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Failed to create an account. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex-grow">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/login" className="font-medium text-primary hover:text-green-500">
            sign in to existing account
          </Link>
        </p>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {/* Error message */}
            {(error || authError) && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error || authError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    {...register('username', { 
                      required: 'Username is required',
                      minLength: { value: 3, message: 'Username must be at least 3 characters long' }
                    })}
                  />
                  {errors.username && <p className="text-sm text-red-600">{errors.username.message}</p>}
                </div>
              </div>
              
              {/* Last Name Field (Optional based on DB schema) */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name (Optional)
                </label>
                <div className="mt-1">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    {...register('lastName')}
                  />
                  {errors.lastName && <p className="text-sm text-red-600">{errors.lastName.message}</p>}
                </div>
              </div>
            
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    {...register('email', { 
                      required: 'Email is required', 
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                        message: 'Please enter a valid email address'
                      }
                    })}
                  />
                  {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                </div>
              </div>

              {/* Daily Calorie Target Field (Optional) */}
              <div>
                <label htmlFor="dailyCalorieTarget" className="block text-sm font-medium text-gray-700">
                  Daily Calorie Target (Optional)
                </label>
                <div className="mt-1">
                  <input
                    id="dailyCalorieTarget"
                    name="dailyCalorieTarget"
                    type="number"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="e.g. 2000"
                    min="500"
                    max="10000"
                    {...register('dailyCalorieTarget', { 
                      min: { value: 500, message: 'Minimum daily calorie target is 500' },
                      max: { value: 10000, message: 'Maximum daily calorie target is 10000' }
                    })}
                  />
                  {errors.dailyCalorieTarget && <p className="text-sm text-red-600">{errors.dailyCalorieTarget.message}</p>}
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters long' },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/,
                        message: 'Password must include uppercase, lowercase, number and special character'
                      }
                    })}
                  />
                  {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    {...register('confirmPassword', { required: 'Confirm Password is required' })}
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex justify-center items-center">
                      <span className="loader"></span> Creating account...
                    </div>
                  ) : (
                    'Sign up'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="bg-gray-800 text-white py-4 mt-auto">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} NutriTrack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}