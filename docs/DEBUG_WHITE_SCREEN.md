# Debug Guide: iOS White Screen Issue

## Enhanced Debug Logging Added

I've added comprehensive debug logging to help diagnose the white screen issue. The app now logs detailed information about:

### 1. App Startup
- Platform information
- App component initialization

### 2. Firebase Configuration
- Environment variable detection
- Config source validation (process.env vs Constants.expoConfig.extra)
- Missing configuration fields

### 3. Firebase Initialization
- Step-by-step initialization process
- Firestore setup (custom vs fallback)
- Network enablement attempts
- Any errors with full context

## How to Get Debug Information

### On Physical Device (iPhone 13 Pro):

1. **Install the latest build** (with debug logging):
   ```bash
   eas build --platform ios --profile preview
   ```

2. **Connect your iPhone to your Mac and open Console.app**:
   - Open Console.app on your Mac
   - Connect your iPhone via USB
   - Select your iPhone in the sidebar
   - Filter by "FinSync" to see only your app's logs

3. **Launch the app** and watch for log messages:
   - Look for messages starting with: `🐛 [DEBUG]`, `❌ [ERROR]`, `🔥 [FIREBASE]`, `📱 [iOS]`
   - Pay special attention to any error messages

4. **Key things to look for**:
   - "App starting..." - confirms app launches
   - "Firebase Config Sources:" - shows where config is coming from
   - "Missing Firebase config value:" - indicates configuration problems
   - "Firebase initialization failed" - shows Firebase errors
   - Any crash logs or native iOS errors

### Expected Debug Output:

**Successful flow should show:**
```
📱 [iOS] App starting...
📱 [iOS] Platform: {OS: "ios", version: "17.x"}
🔥 [FIREBASE] Firebase Config Sources: {usingEnv: false, usingConstants: true, ...}
🔥 [FIREBASE] initializeFirebase called
🔥 [FIREBASE] No existing app, creating new Firebase app
🔥 [FIREBASE] Firebase config validation: {hasApiKey: true, hasAuthDomain: true, ...}
🔥 [FIREBASE] Calling initializeApp with config
🔥 [FIREBASE] initializeApp completed successfully
🔥 [FIREBASE] Initializing Firestore with custom settings
🔥 [FIREBASE] Firebase initialization completed successfully
```

**Failed flow might show:**
```
❌ [ERROR] Missing Firebase config value: FIREBASE_API_KEY
❌ [ERROR] Firebase initialization failed: {message: "...", code: "...", stack: "..."}
```

## Next Steps Based on Debug Output

### If you see "Missing Firebase config value":
- The GoogleService-Info.plist generation script didn't run
- Environment variables aren't being passed correctly to the app

### If you see "Firebase initialization failed":
- The plist file exists but Firebase can't use it
- Network or permission issues

### If you see no Firebase logs at all:
- App is crashing before Firebase initialization
- Check for earlier error messages

## Manual Testing

You can also test locally to compare:

```bash
# Generate plist locally
node scripts/generate-googleservice-plist.js

# Build and run on device
npx expo run:ios --device

# Check if the plist file was generated
ls -la ios/FinSync/GoogleService-Info.plist
```

## Common Issues to Check For

1. **EAS Build Environment**: Verify the generation script ran during build
2. **Bundle Inclusion**: Ensure the plist file is included in the iOS app bundle
3. **Firebase Project Settings**: Verify the bundle identifier matches Firebase console
4. **iOS Permissions**: Check if the app has necessary network permissions

Please run the app and share the debug output from Console.app so we can identify the exact issue.