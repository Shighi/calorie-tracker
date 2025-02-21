import { useForm, FormProvider } from 'react-hook-form';
import FormInput from '../components/FormInput';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const methods = useForm();
  const { user } = useAuth();

  const onSubmit = (data) => {
    console.log('Profile updated:', data);
    // Add API call here
  };

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-6">Profile Settings</h2>
            
            <FormInput
              label="Name"
              name="name"
              defaultValue={user?.name || ''}
              validation={{ required: 'Name is required' }}
            />
            
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

            <button
              type="submit"
              className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Save Changes
            </button>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}