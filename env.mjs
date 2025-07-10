const { z } = require('zod');

const envSchema = z.object({
  FIRESTORE_API_KEY: z.string(),
  GCM_SENDER_ID: z.string(),
  BUNDLE_ID: z.string(),
  FIRESTORE_PROJECT_ID: z.string(),
  FIRESTORE_STORAGE_BUCKET: z.string(),
  GOOGLE_APP_ID: z.string(),
  GOOGLE_MEASUREMENTID: z.string(),
});

const validateEnv = (env) => {
  try {
    return envSchema.parse(env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw new Error('Invalid environment configuration');
  }
};

module.exports = { validateEnv };