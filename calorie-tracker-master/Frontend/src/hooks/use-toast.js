import { toast as hotToast } from 'react-hot-toast';

export function useToast() {
  const toast = ({ title, description, variant }) => {
    if (variant === "destructive") {
      return hotToast.error(description || title);
    } else if (variant === "success") {
      return hotToast.success(description || title);
    } else {
      return hotToast(description || title);
    }
  };

  return {
    toast,
    // Keep original methods for backward compatibility
    success: (message) => hotToast.success(message),
    error: (message) => hotToast.error(message),
    info: (message) => hotToast(message),
  };
}