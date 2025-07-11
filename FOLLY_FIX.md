# Folly Build Fix for React Native 0.79.5 + Expo SDK 53

## The Issue
React Native 0.79.5 with Expo SDK 53 has a known compatibility issue with the Folly library where `folly/memory/MemoryResource.h` cannot be found during iOS builds.

## Alternative Solutions

### Option 1: Downgrade React Native (Recommended)
```bash
# Downgrade to a stable version
npx expo install react-native@0.79.3
eas build --platform ios --profile preview
```

### Option 2: Use Expo SDK 52 
```bash
# Downgrade Expo SDK to avoid the compatibility issue
npx expo install --fix --expo-version=52
eas build --platform ios --profile preview
```

### Option 3: Use patch-package (Advanced)
I've prepared a patch but it may not be sufficient for this complex issue.

## Root Cause
This is a React Native + Expo compatibility issue where:
- React Native 0.79.5 expects certain Folly headers
- Expo SDK 53 may not provide the complete Folly dependency
- iOS build process cannot resolve the missing header files

## Recommendation
Try Option 1 (downgrading React Native) as it's the most reliable fix for this issue.