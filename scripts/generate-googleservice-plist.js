#!/usr/bin/env node

/**
 * Generate GoogleService-Info.plist from environment variables
 * This runs during the EAS build process to create the plist file
 * without storing it in the repository
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file if available (for local testing)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv might not be available in production builds, that's ok
  console.log('dotenv not available, using process.env directly');
}

// Function to generate plist content from environment variables
function generatePlist() {
  const config = {
    API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    BUNDLE_ID: 'com.eduardkakosyan.finsync',
    PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    GCM_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    PLIST_VERSION: '1',
    IS_ADS_ENABLED: false,
    IS_ANALYTICS_ENABLED: true,
    IS_APPINVITE_ENABLED: false,
    IS_GCM_ENABLED: true,
    IS_SIGNIN_ENABLED: false,
    GOOGLE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    DATABASE_URL: ''
  };

  // Validate required fields
  const requiredFields = ['API_KEY', 'PROJECT_ID', 'GCM_SENDER_ID', 'GOOGLE_APP_ID'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required Firebase configuration: ${missingFields.join(', ')}`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>API_KEY</key>
    <string>${config.API_KEY}</string>
    <key>BUNDLE_ID</key>
    <string>${config.BUNDLE_ID}</string>
    <key>PROJECT_ID</key>
    <string>${config.PROJECT_ID}</string>
    <key>STORAGE_BUCKET</key>
    <string>${config.STORAGE_BUCKET}</string>
    <key>IS_ADS_ENABLED</key>
    <${config.IS_ADS_ENABLED}/>
    <key>IS_ANALYTICS_ENABLED</key>
    <${config.IS_ANALYTICS_ENABLED}/>
    <key>IS_APPINVITE_ENABLED</key>
    <${config.IS_APPINVITE_ENABLED}/>
    <key>IS_GCM_ENABLED</key>
    <${config.IS_GCM_ENABLED}/>
    <key>IS_SIGNIN_ENABLED</key>
    <${config.IS_SIGNIN_ENABLED}/>
    <key>GOOGLE_APP_ID</key>
    <string>${config.GOOGLE_APP_ID}</string>
    <key>GCM_SENDER_ID</key>
    <string>${config.GCM_SENDER_ID}</string>
    <key>PLIST_VERSION</key>
    <string>${config.PLIST_VERSION}</string>
    <key>DATABASE_URL</key>
    <string>${config.DATABASE_URL}</string>
</dict>
</plist>`;
}

// Main execution
try {
  const plistContent = generatePlist();
  const outputPath = path.join(__dirname, '..', 'ios', 'FinSync', 'GoogleService-Info.plist');
  
  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write the plist file
  fs.writeFileSync(outputPath, plistContent, 'utf8');
  console.log('✅ GoogleService-Info.plist generated successfully at:', outputPath);
} catch (error) {
  console.error('❌ Error generating GoogleService-Info.plist:', error.message);
  process.exit(1);
}