import { FirebaseError } from 'firebase/app';

export interface ErrorInfo {
  title: string;
  message: string;
  isRetryable: boolean;
  suggestedAction: string;
}

export const handleFirebaseError = (error: any): ErrorInfo => {
  console.error('🔥 Firebase Error:', error);

  // WebChannelConnection RPC error - specific handling
  if (error.message?.includes('WebChannelConnection') || error.message?.includes('RPC')) {
    return {
      title: 'Syncing Data',
      message: 'Reconnecting to server. Your data is safe and will sync automatically.',
      isRetryable: true,
      suggestedAction: 'Connection will recover automatically'
    };
  }

  // WebSocket connection errors
  if (error.message?.includes('WebSocket') || error.message?.includes('transport')) {
    return {
      title: 'Connection Issue',
      message: 'Real-time sync temporarily unavailable. Switching to polling mode.',
      isRetryable: true,
      suggestedAction: 'Connection will recover automatically'
    };
  }

  // Network/Connection errors
  if (error.code === 'unavailable' || error.message?.includes('transport')) {
    return {
      title: 'Connection Issue',
      message: 'Working in offline mode. Changes will sync when reconnected.',
      isRetryable: true,
      suggestedAction: 'Check internet connection'
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

// Wrapper for Firestore operations that handles WebChannel errors
export const withConnectionResilience = async <T>(
  operation: () => Promise<T>,
  fallbackOperation?: () => Promise<T>
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    const errorInfo = handleFirebaseError(error);
    
    // For WebChannel errors, try fallback if available
    if (errorInfo.isRetryable && (error.message?.includes('WebChannelConnection') || error.message?.includes('RPC'))) {
      console.log('🔄 WebChannel error detected, attempting fallback...');
      
      if (fallbackOperation) {
        try {
          return await fallbackOperation();
        } catch (fallbackError) {
          console.error('❌ Fallback operation also failed:', fallbackError);
          throw error; // Throw original error
        }
      }
    }
    
    throw error;
  }
};

// Check if error is related to WebChannel/RPC issues
export const isWebChannelError = (error: any): boolean => {
  return error.message?.includes('WebChannelConnection') || 
         error.message?.includes('RPC') || 
         error.message?.includes('WebSocket') ||
         error.message?.includes('transport');
};

// Get user-friendly error message for WebChannel issues
export const getWebChannelErrorMessage = (error: any): string => {
  if (isWebChannelError(error)) {
    return 'Connection interrupted. Switching to offline mode temporarily.';
  }
  return 'An error occurred while syncing data.';
};