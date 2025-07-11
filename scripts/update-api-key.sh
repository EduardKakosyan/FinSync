#!/bin/bash

echo "Updating Firebase API key in EAS..."

# Load the new API key from .env.local
if [ -f .env.local ]; then
    export $(cat .env.local | grep EXPO_PUBLIC_FIREBASE_API_KEY | xargs)
    echo "New API key loaded from .env.local"
else
    echo "Error: .env.local file not found!"
    exit 1
fi

# Delete the old key
echo "Removing old API key..."
eas env:delete --variable-environment production --variable-name EXPO_PUBLIC_FIREBASE_API_KEY --non-interactive || true

# Create the new key
echo "Setting new API key..."
eas env:create --environment production --name EXPO_PUBLIC_FIREBASE_API_KEY --value "$EXPO_PUBLIC_FIREBASE_API_KEY" --visibility plaintext

echo ""
echo "✅ Firebase API key has been updated!"
echo ""
echo "To verify the update:"
echo "  eas env:list --environment production | grep API_KEY"