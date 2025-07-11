#!/bin/bash

echo "Cleaning up EAS environment variables..."
echo ""

# List of Firebase environment variables
FIREBASE_VARS=(
  "EXPO_PUBLIC_FIREBASE_API_KEY"
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID"
  "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"
  "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  "EXPO_PUBLIC_FIREBASE_APP_ID"
  "EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID"
)

echo "This will delete the following environment variables from production:"
for var in "${FIREBASE_VARS[@]}"; do
  echo "  - $var"
done

echo ""
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  for var in "${FIREBASE_VARS[@]}"; do
    echo "Deleting $var..."
    eas env:delete --variable-environment production --variable-name "$var" --non-interactive || echo "  Failed to delete $var (might not exist)"
  done
  echo ""
  echo "✅ Cleanup complete!"
else
  echo "Cleanup cancelled."
fi

