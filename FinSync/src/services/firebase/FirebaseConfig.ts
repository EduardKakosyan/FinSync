import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { initializeAuth, getAuth, connectAuthEmulator, getReactNativePersistence } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'demo-key-for-local-testing',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'finsync-594f3',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'finsync-594f3.firebaseapp.com',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'finsync-594f3.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '107508349376207863893',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'finsync-594f3',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Debug Firebase config in development
if (__DEV__) {
  console.log('🔥 Firebase Config:', {
    apiKey: firebaseConfig.apiKey?.substring(0, 10) + '...',
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId
  });
}

// Initialize Firebase only if it hasn't been initialized
const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Auth with proper React Native persistence
let auth;
try {
  if (isFirstInit) {
    // First initialization - use initializeAuth with AsyncStorage
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
    console.log('✅ Firebase Auth initialized with AsyncStorage persistence');
  } else {
    // App already exists, get existing auth instance
    auth = getAuth(app);
    console.log('✅ Firebase Auth retrieved existing instance');
  }
} catch (error) {
  console.error('❌ Firebase Auth initialization failed:', error);
  // Fallback to basic auth without persistence
  auth = getAuth(app);
}

export { auth };

export const functions = getFunctions(app);

// Connect to emulators in development (optional)
if (__DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('🔥 Connected to Firebase emulators');
  } catch (error) {
    console.log('Firebase emulators already connected');
  }
}

export default app;