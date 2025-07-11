// Environment configuration for React Native
// Uses environment variables for security

import Constants from 'expo-constants';

// Helper function to get config values
const getConfigValue = (key: string): string => {
  // First try process.env (works in development)
  const envValue = process.env[`EXPO_PUBLIC_${key}`];
  if (envValue) return envValue;
  
  // Then try Constants.expoConfig.extra (works in production builds)
  const extraValue = Constants.expoConfig?.extra?.[`firebase${key.charAt(0).toUpperCase() + key.slice(1)}`];
  if (extraValue) return extraValue;
  
  // Log error if value is missing
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

// Debug logging
console.log('Firebase Config Source:', {
  usingEnv: !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  usingConstants: !!Constants.expoConfig?.extra?.firebaseApiKey
});

if (__DEV__) {
  console.log('Firebase Config:', {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey ? '***' + firebaseConfig.apiKey.slice(-4) : 'MISSING'
  });
}