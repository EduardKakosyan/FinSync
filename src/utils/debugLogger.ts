/**
 * Debug logging utility for iOS white screen debugging
 */

export const debugLogger = {
  // Flag to enable debug logging
  enabled: __DEV__ || process.env.NODE_ENV !== 'production',

  log: (message: string, data?: any) => {
    if (!debugLogger.enabled) return;
    
    const timestamp = new Date().toISOString();
    console.log(`🐛 [DEBUG ${timestamp}] ${message}`, data || '');
  },

  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`❌ [ERROR ${timestamp}] ${message}`, error || '');
  },

  firebase: (step: string, data?: any) => {
    if (!debugLogger.enabled) return;
    
    const timestamp = new Date().toISOString();
    console.log(`🔥 [FIREBASE ${timestamp}] ${step}`, data || '');
  },

  ios: (message: string, data?: any) => {
    if (!debugLogger.enabled) return;
    
    const timestamp = new Date().toISOString();
    console.log(`📱 [iOS ${timestamp}] ${message}`, data || '');
  }
};

// Export functions for app initialization debugging
export const logAppStart = () => {
  debugLogger.ios('App starting...');
  debugLogger.ios('Platform:', {
    OS: require('react-native').Platform.OS,
    version: require('react-native').Platform.Version
  });
};

export const logFirebaseInit = (config: any) => {
  debugLogger.firebase('Initializing Firebase with config:', {
    hasApiKey: !!config.apiKey,
    hasProjectId: !!config.projectId,
    hasAppId: !!config.appId,
    authDomain: config.authDomain
  });
};

export const logFirebaseSuccess = () => {
  debugLogger.firebase('Firebase initialized successfully');
};

export const logFirebaseError = (error: any) => {
  debugLogger.error('Firebase initialization failed:', {
    message: error.message,
    code: error.code,
    stack: error.stack
  });
};