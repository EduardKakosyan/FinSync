// Environment configuration for React Native
// Since React Native doesn't have process.env, we need to handle this differently

const { validateEnv } = require('../../env.mjs');

// Define the environment variables based on the .env.local file
const ENV_CONFIG = {
  FIRESTORE_API_KEY: 'AIzaSyDFNvw_YWXaJXiwZu66-GACR-_JyDsVJgs',
  GCM_SENDER_ID: '418670155712',
  BUNDLE_ID: 'com.eduardkakosyan.finsync',
  FIRESTORE_PROJECT_ID: 'finsync-v2',
  FIRESTORE_STORAGE_BUCKET: 'finsync-v2.firebasestorage.app',
  GOOGLE_APP_ID: '1:418670155712:ios:d105ffe2d7cfa62ca69a25',
  GOOGLE_MEASUREMENTID: 'G-VQ7GKW6DC9',
};

// Validate the environment configuration
export const ENV = validateEnv(ENV_CONFIG);

// Export Firebase config
export const firebaseConfig = {
  apiKey: ENV.FIRESTORE_API_KEY,
  authDomain: `${ENV.FIRESTORE_PROJECT_ID}.firebaseapp.com`,
  projectId: ENV.FIRESTORE_PROJECT_ID,
  storageBucket: ENV.FIRESTORE_STORAGE_BUCKET,
  messagingSenderId: ENV.GCM_SENDER_ID,
  appId: ENV.GOOGLE_APP_ID,
  measurementId: ENV.GOOGLE_MEASUREMENTID,
};