import { useFormContext } from 'react-hook-form';

export default function FormInput({ label, name, type = 'text', defaultValue = '', validation = {} }) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        {...register(name, validation)}
        className={`w-full px-3 py-2 border rounded-lg ${
          errors[name] ? 'border-red-500' : 'border-gray-300'
        } focus:outline-none focus:ring-2 focus:ring-primary`}
      />
      {errors[name] && (
        <span className="text-red-500 text-sm">{errors[name].message}</span>
      )}
    </div>
  );
}