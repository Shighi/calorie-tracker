import { useForm, FormProvider } from 'react-hook-form';
import FormInput from '../components/FormInput';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import if you're using React Router

export default function Profile() {
  const methods = useForm();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate(); // Only if you're using React Router
  
  // Local state to track loading, success, and error messages
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Fetch user profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Check if token exists
        if (!token) {
          setError('No authentication token found. Please log in again.');
          setFetchLoading(false);
          if (navigate) navigate('/login'); // Redirect to login if no token
          return;
        }
        
        setFetchLoading(true);
        
        const response = await axios.get('http://localhost:3000/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setProfileData(response.data.data); // Accessing data inside the API response wrapper
        
        // Reset form with fetched data using field names that match the database schema
        methods.reset({
          username: response.data.data.username,
          email: response.data.data.email,
          last_name: response.data.data.last_name,
          daily_calorie_target: response.data.data.daily_calorie_target
        });
      } catch (err) {
        if (err.response && err.response.status === 401) {
          setError('Your session has expired. Please log in again.');
          // Handle expired token by logging out
          await logout();
          if (navigate) navigate('/login');
        } else {
          setError('Failed to load profile data');
        }
        console.error('Error fetching profile:', err);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchProfile();
  }, [token, methods, logout, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      // Check if token exists
      if (!token) {
        setError('No authentication token found. Please log in again.');
        if (navigate) navigate('/login');
        return;
      }

      // Call API endpoint to update profile with field names that match the backend
      const response = await axios.put('http://localhost:3000/api/auth/profile', {
        // Only include fields that exist in the User model
        last_name: data.last_name,
        daily_calorie_target: data.daily_calorie_target
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state with the updated profile data
      setProfileData(response.data.data);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      // Handle error from API call
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
        await logout();
        if (navigate) navigate('/login');
      } else {
        let errorMessage = 'Failed to update profile. Please try again.';
        
        if (err.response && err.response.status === 400) {
          errorMessage = 'Invalid profile data. Please check your inputs.';
        } else if (err.response && err.response.status === 409) {
          errorMessage = 'Username or email already exists.';
        }
        
        setError(errorMessage);
      }
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <div className="max-w-2xl mx-auto px-4 py-8 flex-grow">
        <h2 className="text-2xl font-semibold mb-6 text-center">Profile Settings</h2>
        
        {fetchLoading ? (
          <div className="bg-white p-6 rounded-lg shadow flex justify-center">
            <p>Loading profile data...</p>
          </div>
        ) : (
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow">
              
              {/* Success message */}
              {success && (
                <div className="mb-4 text-green-600 bg-green-100 border border-green-300 px-4 py-3 rounded">
                  {success}
                </div>
              )}
              
              {/* Error message */}
              {error && (
                <div className="mb-4 text-red-600 bg-red-100 border border-red-300 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              {/* Username display (read-only) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <div className="mt-1 p-2 bg-gray-100 border border-gray-300 rounded-md">
                  {profileData?.username || 'Loading...'}
                </div>
              </div>
              
              {/* Email display (read-only) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1 p-2 bg-gray-100 border border-gray-300 rounded-md">
                  {profileData?.email || 'Loading...'}
                </div>
              </div>
              
              {/* Last name input */}
              <FormInput
                label="Last Name"
                name="last_name"
                type="text"
                defaultValue={profileData?.last_name || ''}
                validation={{ 
                  maxLength: { value: 50, message: 'Last name must be less than 50 characters' }
                }}
              />
              
              {/* Daily calorie target input */}
              <FormInput
                label="Daily Calorie Target"
                name="daily_calorie_target"
                type="number"
                defaultValue={profileData?.daily_calorie_target || 2000}
                validation={{ 
                  required: 'Calorie target is required',
                  min: { value: 500, message: 'Minimum 500 calories' },
                  max: { value: 10000, message: 'Maximum 10000 calories' }
                }}
              />

              {/* Save button */}
              <button
                type="submit"
                className={`w-full py-2 px-4 rounded text-white ${loading ? 'bg-gray-400' : 'bg-primary hover:bg-green-600'}`}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </FormProvider>
        )}
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