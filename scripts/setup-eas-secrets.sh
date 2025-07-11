#!/bin/bash

echo "Setting up EAS environment variables for FinSync..."
echo "This will configure your Firebase credentials as EAS environment variables."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Error: .env.local file not found!"
    echo "Please create a .env.local file with your Firebase credentials first."
    exit 1
fi

# Function to check if a variable exists
check_and_delete_if_exists() {
    local var_name=$1
    if eas env:list --environment production | grep -q "$var_name"; then
        echo "Removing existing variable: $var_name"
        eas env:delete --variable-environment production --variable-name "$var_name" --non-interactive || true
    fi
}

echo "Checking for existing environment variables..."

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

# Check and delete existing variables
for var in "${FIREBASE_VARS[@]}"; do
    check_and_delete_if_exists "$var"
done

echo ""
echo "Setting up fresh EAS environment variables..."

# Push the .env.local file
eas env:push --environment production --path .env.local

echo ""
echo "✅ EAS environment variables have been configured!"
echo ""
echo "You can now build your app with:"
echo "  eas build --platform ios --profile preview"
echo ""
echo "The build will automatically use the environment variables you just configured."
echo ""
echo "To view your environment variables:"
echo "  eas env:list --environment production"