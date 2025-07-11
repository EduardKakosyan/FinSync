# Firebase Setup Guide for FinSync

## Overview
This guide explains how to resolve the Firebase WebChannelConnection RPC 'Listen' stream error and ensure proper data fetching in production builds.

## Issue Description
The app was experiencing issues where:
- Transactions weren't loading after app restart
- Firebase showed "WebChannelConnection RPC 'Listen' stream transport errored"
- Data existed in Firebase but wasn't being fetched properly

## Solution Implementation

### 1. Updated Firebase Initialization
We've updated the Firebase initialization to use `initializeFirestore` with specific settings:

```javascript
db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Fix for WebChannel issues
  useFetchStreams: false, // Required for React Native
  cacheSizeBytes: CACHE_SIZE_UNLIMITED // Enable unlimited cache
});
```

### 2. Added Offline Persistence
The app now supports offline persistence, allowing it to work without an internet connection:
- Data is cached locally using IndexedDB
- Changes sync automatically when connection is restored
- Unlimited cache size for better offline experience

### 3. Connection Recovery System
Implemented automatic connection recovery:
- Monitors network connectivity
- Automatic reconnection with exponential backoff
- Visual indicator showing connection status
- Graceful handling of app foreground/background transitions

### 4. Enhanced Error Handling
- Specific handling for WebChannel errors
- User-friendly error messages
- Automatic retry logic for failed operations

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the project root with your Firebase configuration:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 2. Building for Production

#### iOS Build:
```bash
expo prebuild --platform ios
expo run:ios --configuration Release
```

#### Android Build:
```bash
expo prebuild --platform android
expo run:android --variant release
```

#### Web Build:
```bash
expo export:web
```

### 3. Testing the Fix

1. **Add a transaction** while online
2. **Close the app completely**
3. **Reopen the app** - transactions should load immediately
4. **Test offline mode**:
   - Turn on airplane mode
   - Add a transaction (it will be queued)
   - Turn off airplane mode
   - Transaction should sync automatically

## Troubleshooting

### If transactions still don't load:

1. **Check Firebase Console**:
   - Verify data exists in Firestore
   - Check security rules haven't expired
   - Ensure the database name is "(default)"

2. **Check Console Logs**:
   - Look for "Firebase initialized successfully"
   - Check for "Fetched X transactions" messages
   - Monitor connection status messages

3. **Clear App Data**:
   - iOS: Delete and reinstall the app
   - Android: Clear app data in settings
   - Web: Clear browser cache and localStorage

### Common Issues:

1. **"Failed to get document because the client is offline"**
   - This is normal when offline
   - Data will sync when connection is restored

2. **"Multiple tabs open" warning**
   - Normal in web browsers
   - Persistence works in the first tab only

3. **Slow initial load**
   - First load may take longer while establishing connection
   - Subsequent loads use cached data for instant display

## Performance Notes

- The app now uses long polling instead of WebSockets for better reliability
- Initial connection may take 2-3 seconds
- Offline mode provides instant access to cached data
- Background sync ensures data stays up-to-date

## Security Considerations

- Never commit `.env` files to version control
- Use environment variables for all sensitive data
- Regularly update Firebase security rules
- Monitor Firebase usage to prevent abuse