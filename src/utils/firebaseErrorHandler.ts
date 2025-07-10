import { FirebaseError } from 'firebase/app';

export interface ErrorInfo {
  title: string;
  message: string;
  isRetryable: boolean;
  suggestedAction: string;
}

export const handleFirebaseError = (error: any): ErrorInfo => {
  console.error('🔥 Firebase Error:', error);

  // Network/Connection errors
  if (error.code === 'unavailable' || error.message?.includes('transport')) {
    return {
      title: 'Connection Issue',
      message: 'Unable to connect to server. Check your internet connection.',
      isRetryable: true,
      suggestedAction: 'Check internet connection and try again'
    };
  }

  // Permission errors
  if (error.code === 'permission-denied') {
    return {
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action.',
      isRetryable: false,
      suggestedAction: 'Contact support if this persists'
    };
  }

  // Quota exceeded
  if (error.code === 'resource-exhausted') {
    return {
      title: 'Service Limit',
      message: 'Service temporarily unavailable due to high usage.',
      isRetryable: true,
      suggestedAction: 'Try again in a few minutes'
    };
  }

  // Network offline
  if (error.code === 'failed-precondition' && error.message?.includes('offline')) {
    return {
      title: 'Offline Mode',
      message: 'App is working offline. Data will sync when connected.',
      isRetryable: true,
      suggestedAction: 'Connect to internet to sync data'
    };
  }

  // Generic error
  return {
    title: 'Unknown Error',
    message: 'Something went wrong. Please try again.',
    isRetryable: true,
    suggestedAction: 'Try again or restart the app'
  };
};

export const retryWithExponentialBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      const errorInfo = handleFirebaseError(error);
      console.log(`❌ Attempt ${attempt}/${maxRetries} failed: ${errorInfo.message}`);
      
      if (!errorInfo.isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};