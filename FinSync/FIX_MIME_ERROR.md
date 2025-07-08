# Fix for MIME-Type Error on iOS Development Build

## Problem
Getting "expected MIME-Type to be 'application/javascript' but got 'text/html'" when running EAS development build on iOS device.

## Root Cause
The EAS development build is trying to fetch JavaScript bundles from an incorrect URL, receiving HTML error pages instead of the actual JavaScript files.

## Solution Applied

### 1. Updated Metro Configuration
- Added middleware to set proper MIME type for `.bundle` files
- Ensures JavaScript files are served with `application/javascript` content type

### 2. Updated app.json
- Added `packagerOpts` configuration to ensure proper Metro config usage

### 3. Fixed App Entry Point
- Changed `package.json` main entry from `node_modules/expo/AppEntry.js` to `expo-router/entry`
- This resolves the "Unable to resolve module ../../App" error for Expo Router apps

## How to Use Your Development Build Correctly

### Step 1: Start Metro Development Server
```bash
npx expo start --dev-client
```

### Step 2: Connect Your iPhone
1. Make sure your iPhone and computer are on the same Wi-Fi network
2. Open your FinSync development build (the one you downloaded via Orbit)
3. The app should automatically detect the Metro server
4. If not, manually enter the Metro server URL shown in the terminal

### Step 3: Alternative Connection Method
If automatic detection fails:
```bash
# Get your computer's IP address
ipconfig getifaddr en0  # macOS
# or
ifconfig | grep inet    # Linux/macOS detailed

# Then use the IP in your development build
# Example: http://192.168.1.100:8081
```

## Important Notes

1. **DO NOT** use the EAS build link directly as a server URL
2. **ALWAYS** run the Metro development server first
3. **ENSURE** your iPhone and computer are on the same network
4. **KEEP** the Metro server running while developing

## Verification
After implementing this fix and following the steps above, your app should:
- Load without MIME-Type errors
- Connect to the Metro bundler properly
- Enable hot reloading for development

## If You Still Have Issues

1. Clear Metro cache: `npx expo start --dev-client --clear`
2. Restart your development build on iPhone
3. Check that no firewall is blocking the Metro server port (8081)
4. Try connecting via USB if Wi-Fi connection fails

This fix addresses the specific MIME-Type error you're experiencing with your EAS development build on iOS.