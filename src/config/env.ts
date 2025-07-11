// Environment configuration for React Native
// Uses environment variables for security

import Constants from 'expo-constants';
import { debugLogger } from '../utils/debugLogger';

// Helper function to get config values
const getConfigValue = (key: string): string => {
  debugLogger.firebase(`Getting config value for key: ${key}`);
  
  // First try process.env (works in development and should work in EAS builds)
  const envValue = process.env[`EXPO_PUBLIC_${key}`];
  debugLogger.firebase(`process.env value for EXPO_PUBLIC_${key}:`, envValue ? 'found' : 'not found');
  if (envValue && envValue.trim() !== '') {
    debugLogger.firebase(`Using process.env value for ${key}`);
    return envValue;
  }
  
  // Then try Constants.expoConfig.extra (fallback for production builds)
  const extraKey = `firebase${key.charAt(0).toUpperCase() + key.slice(1)}`;
  const extraValue = Constants.expoConfig?.extra?.[extraKey];
  debugLogger.firebase(`Constants.expoConfig.extra value for ${extraKey}:`, extraValue ? 'found' : 'not found');
  if (extraValue && extraValue.trim() !== '') {
    debugLogger.firebase(`Using Constants.expoConfig.extra value for ${key}`);
    return extraValue;
  }
  
  // Log detailed debugging info before throwing error
  debugLogger.error(`Missing Firebase config value: ${key}`, {
    processEnvKeys: Object.keys(process.env).filter(k => k.includes('FIREBASE')),
    allProcessEnvKeys: Object.keys(process.env).filter(k => k.includes('EXPO_PUBLIC')),
    constantsExtra: Constants.expoConfig?.extra,
    expectedProcessEnvKey: `EXPO_PUBLIC_${key}`,
    expectedExtraKey: extraKey,
    nodeEnv: process.env.NODE_ENV,
    easBuild: process.env.EAS_BUILD
  });
  
  console.error(`Missing Firebase config value: ${key}`);
  throw new Error(`Firebase configuration incomplete: Missing ${key}`);
};

// Export Firebase config using environment variables with fallback to expo-constants
export const firebaseConfig = {
  apiKey: getConfigValue('FIREBASE_API_KEY'),
  authDomain: getConfigValue('FIREBASE_AUTH_DOMAIN'),
  projectId: getConfigValue('FIREBASE_PROJECT_ID'),
  storageBucket: getConfigValue('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getConfigValue('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getConfigValue('FIREBASE_APP_ID'),
  measurementId: getConfigValue('FIREBASE_MEASUREMENT_ID'),
};

// Log final config status for debugging
debugLogger.firebase('Final Firebase config created:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  hasAppId: !!firebaseConfig.appId,
  apiKeyLength: firebaseConfig.apiKey ? firebaseConfig.apiKey.length : 0
});

// Debug logging
debugLogger.firebase('Firebase Config Sources:', {
  usingEnv: !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  usingConstants: !!Constants.expoConfig?.extra?.firebaseApiKey,
  processEnvKeys: Object.keys(process.env).filter(k => k.includes('FIREBASE')),
  constantsExtraKeys: Constants.expoConfig?.extra ? Object.keys(Constants.expoConfig.extra).filter(k => k.includes('firebase')) : []
});

console.log('Firebase Config Source:', {
  usingEnv: !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  usingConstants: !!Constants.expoConfig?.extra?.firebaseApiKey
});

if (__DEV__) {
  console.log('Firebase Config:', {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey ? '***' + firebaseConfig.apiKey.slice(-4) : 'MISSING'
  });
  
  debugLogger.firebase('Detailed Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? `***${firebaseConfig.apiKey.slice(-4)}` : 'MISSING',
    authDomain: firebaseConfig.authDomain || 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
    appId: firebaseConfig.appId || 'MISSING'
  });
}