import Toast from 'react-native-toast-message';

export interface ToastConfig {
  title?: string;
  message: string;
  duration?: number;
  position?: 'top' | 'bottom';
}

export const showToast = {
  success: (config: ToastConfig) => {
    Toast.show({
      type: 'success',
      text1: config.title || 'Success',
      text2: config.message,
      visibilityTime: config.duration || 4000,
      position: config.position || 'top',
      autoHide: true,
    });
  },

  error: (config: ToastConfig) => {
    Toast.show({
      type: 'error',
      text1: config.title || 'Error',
      text2: config.message,
      visibilityTime: config.duration || 5000,
      position: config.position || 'top',
      autoHide: true,
    });
  },

  info: (config: ToastConfig) => {
    Toast.show({
      type: 'info',
      text1: config.title || 'Info',
      text2: config.message,
      visibilityTime: config.duration || 4000,
      position: config.position || 'top',
      autoHide: true,
    });
  },

  warning: (config: ToastConfig) => {
    Toast.show({
      type: 'info', // Using info type for warning since there's no built-in warning type
      text1: config.title || 'Warning',
      text2: config.message,
      visibilityTime: config.duration || 4500,
      position: config.position || 'top',
      autoHide: true,
    });
  },
};

// Convenience functions for common error scenarios
export const showNetworkError = () => {
  showToast.error({
    title: 'Connection Error',
    message: 'Please check your internet connection and try again.',
  });
};

export const showServerError = (message?: string) => {
  showToast.error({
    title: 'Server Error',
    message: message || 'Something went wrong. Please try again later.',
  });
};

export const showNotFoundError = (resource: string = 'Resource') => {
  showToast.error({
    title: 'Not Found',
    message: `${resource} not found. Please try again.`,
  });
};

export const showValidationError = (message: string) => {
  showToast.error({
    title: 'Validation Error',
    message,
  });
};

export const showUnauthorizedError = () => {
  showToast.error({
    title: 'Access Denied',
    message: 'You are not authorized to perform this action.',
  });
};

export const showSuccess = (message: string, title?: string) => {
  showToast.success({
    title: title || 'Success',
    message,
  });
};

export const showInfo = (message: string, title?: string) => {
  showToast.info({
    title: title || 'Info',
    message,
  });
};

export const showWarning = (message: string, title?: string) => {
  showToast.warning({
    title: title || 'Warning',
    message,
  });
};

export const showError = (message: string, title?: string) => {
  showToast.error({
    title: title || 'Error',
    message,
  });
};

// Function to handle API errors with proper toast messages
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.error || error.response.data?.message;
    
    switch (status) {
      case 400:
        showValidationError(message || 'Invalid request. Please check your input.');
        break;
      case 401:
        showUnauthorizedError();
        break;
      case 403:
        showToast.error({
          title: 'Forbidden',
          message: message || 'You do not have permission to access this resource.',
        });
        break;
      case 404:
        showNotFoundError();
        break;
      case 422:
        showValidationError(message || 'Validation failed. Please check your input.');
        break;
      case 500:
        showServerError(message);
        break;
      default:
        showServerError(message || 'An unexpected error occurred.');
    }
  } else if (error.request) {
    // Network error
    showNetworkError();
  } else {
    // Other error
    showServerError('An unexpected error occurred.');
  }
};
