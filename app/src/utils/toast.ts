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
  showToast.info({
    title: 'No connection',
    message: 'Check your internet connection and try again.',
  });
};

export const showServerError = (message?: string) => {
  showToast.info({
    title: 'We\'re having trouble',
    message: message || 'Give it a moment and try again. If it keeps happening, contact support.',
  });
};

export const showNotFoundError = (resource: string = 'Resource') => {
  showToast.info({
    title: 'Can\'t find that',
    message: `${resource} doesn't seem to be here. Try going back.`,
  });
};

export const showValidationError = (message: string) => {
  showToast.warning({
    title: 'Almost there!',
    message: message || 'Please check the highlighted fields and try again.',
  });
};

export const showUnauthorizedError = () => {
  showToast.info({
    title: 'Sign in needed',
    message: 'Please sign in to continue with this action.',
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
    if (__DEV__) {
    console.error('API Error:', error)
  };
  
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.error || error.response.data?.message;
    
    switch (status) {
      case 400:
        showToast.warning({
          title: 'Let\'s fix that',
          message: message || 'Double-check your information and try again.',
        });
        break;
      case 401:
        showToast.info({
          title: 'Please sign in',
          message: 'You\'ll need to sign in to continue.',
        });
        break;
      case 403:
        showToast.info({
          title: 'Access needed',
          message: message || 'You\'ll need permission to access this. Contact support if this seems wrong.',
        });
        break;
      case 404:
        showToast.info({
          title: 'Not found',
          message: 'This doesn\'t seem to exist. Try going back and checking again.',
        });
        break;
      case 422:
        showValidationError(message || 'Let\'s double-check those fields.');
        break;
      case 500:
        showServerError(message);
        break;
      default:
        showToast.info({
          title: 'Something unexpected happened',
          message: 'Don\'t worry, we\'ve logged this. Please try again in a moment.',
        });
    }
  } else if (error.request) {
    // Network error
    showNetworkError();
  } else {
    // Other error
    showToast.info({
      title: 'Hmm, something went wrong',
      message: 'Try again in a moment. If it persists, we\'re here to help!',
    });
  }
};
