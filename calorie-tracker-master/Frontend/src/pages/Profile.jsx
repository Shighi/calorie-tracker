import { useForm, FormProvider } from 'react-hook-form';
import FormInput from '../components/FormInput';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function Profile() {
  const methods = useForm();
  const { user } = useAuth();
  
  // Local state to track loading, success, and error messages
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      // Simulate API call to update profile
      console.log('Profile updated:', data);
      // You can add your API call here to update the profile
      // e.g., await updateProfileAPI(data);

      // Simulate success
      setSuccess('Profile updated successfully!');
    } catch (err) {
      // Handle error from API call
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <div className="max-w-2xl mx-auto px-4 py-8 flex-grow">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-6 text-center">Profile Settings</h2>
            
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
            
            {/* Name input */}
            <FormInput
              label="Name"
              name="name"
              defaultValue={user?.name || ''}
              validation={{ required: 'Name is required' }}
            />
            
            {/* Calorie goal input */}
            <FormInput
              label="Daily Calorie Goal"
              name="calorieGoal"
              type="number"
              defaultValue={user?.calorieGoal || 2000}
              validation={{ 
                required: 'Calorie goal is required',
                min: { value: 1000, message: 'Minimum 1000 calories' }
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
