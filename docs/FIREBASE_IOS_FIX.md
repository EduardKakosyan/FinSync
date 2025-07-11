# Fix for iOS White Screen Issue

## Problem
The app shows a white screen on physical iOS devices (iPhone 13 Pro) but works fine in simulators. This is caused by the missing `GoogleService-Info.plist` file, which is required for Firebase initialization on iOS.

## Root Cause
- iOS physical devices strictly require `GoogleService-Info.plist` for Firebase initialization
- Simulators can sometimes work without it using just JavaScript configuration
- The file cannot be hardcoded in the repository due to security requirements

## Solution Implemented

### 1. Automatic Generation During Build
Created a script that generates `GoogleService-Info.plist` from environment variables during the EAS build process:
- Location: `scripts/generate-googleservice-plist.js`
- Runs automatically via `prebuildCommand` in `eas.json`
- Uses the same environment variables already configured in EAS

### 2. Updated Build Configuration
Modified `eas.json` to run the generation script before each iOS build:
```json
{
  "build": {
    "preview": {
      "ios": {
        "prebuildCommand": "node scripts/generate-googleservice-plist.js"
      }
    }
  }
}
```

### 3. Security Measures
- Added `GoogleService-Info.plist` to `.gitignore`
- Script uses environment variables from EAS (not hardcoded)
- File is generated fresh for each build

## How It Works
1. During EAS build, the `prebuildCommand` runs before the iOS build
2. The script reads Firebase configuration from environment variables
3. Generates a properly formatted `GoogleService-Info.plist`
4. Places it in the correct location: `ios/FinSync/GoogleService-Info.plist`
5. The iOS build process includes this file in the app bundle

## Verification Steps
1. Environment variables are properly set in EAS (already confirmed)
2. Script is executable and generates valid plist format
3. File is placed in the correct iOS directory
4. Build process includes the file in the bundle

## Testing
To test the fix:
```bash
# Build for preview (physical device testing)
eas build --platform ios --profile preview

# Install on your iPhone 13 Pro and verify Firebase connects properly
```

## Alternative Local Testing
For local development with physical devices:
```bash
# Generate the plist locally (requires .env file)
node scripts/generate-googleservice-plist.js

# Run prebuild to update iOS project
npx expo prebuild --clean

# Build and run on device
npx expo run:ios --device
```

Remember to never commit the generated `GoogleService-Info.plist` file.