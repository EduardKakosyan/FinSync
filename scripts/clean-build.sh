#!/bin/bash

# Clean build script for iOS build issues
echo "🧹 Cleaning build artifacts..."

# Clean iOS build directory
rm -rf ios/build
rm -rf ios/DerivedData

# Clean Pods
cd ios
rm -rf Pods
rm -f Podfile.lock
echo "✅ iOS artifacts cleaned"

# Return to root
cd ..

# Clean node modules (optional - uncomment if needed)
# rm -rf node_modules
# npm install

# Clean Expo cache
npx expo install --fix
echo "✅ Expo dependencies fixed"

# Clean Metro cache
npx expo start --clear
echo "✅ Metro cache cleared"

echo "🎉 Build cleaning complete!"
echo "You can now run: eas build --platform ios --profile preview"