# Firebase Setup for Production Builds

This document explains how to properly configure Firebase for production builds without exposing credentials.

## Development Setup

1. Create a `.env.local` file in the project root with your Firebase credentials:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

2. Run the development server:
   ```bash
   npx expo start
   ```

## Production Setup (EAS Build)

### Option 1: Using EAS Environment Variables (Recommended)

1. Make sure you have the EAS CLI installed:
   ```bash
   npm install -g eas-cli
   ```

2. Run the setup script to configure EAS environment variables:
   ```bash
   ./scripts/setup-eas-secrets.sh
   ```

3. Build your app:
   ```bash
   eas build --platform ios --profile preview
   ```

### Option 2: Manual EAS Environment Configuration

1. Push your entire `.env.local` file to EAS:
   ```bash
   eas env:push --environment production --path .env.local
   ```

2. Or create individual environment variables:
   ```bash
   eas env:create --environment production --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your_api_key"
   eas env:create --environment production --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your_auth_domain"
   eas env:create --environment production --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your_project_id"
   eas env:create --environment production --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your_storage_bucket"
   eas env:create --environment production --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "your_messaging_sender_id"
   eas env:create --environment production --name EXPO_PUBLIC_FIREBASE_APP_ID --value "your_app_id"
   eas env:create --environment production --name EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID --value "your_measurement_id"
   ```

### Managing Environment Variables

- List all environment variables:
  ```bash
  eas env:list --environment production
  ```

- Update a specific variable:
  ```bash
  eas env:update --environment production --name VARIABLE_NAME --value "new_value"
  ```

- Delete a variable:
  ```bash
  eas env:delete --environment production --name VARIABLE_NAME
  ```

## How It Works

1. **Development**: The app reads from `.env.local` via `process.env`
2. **Production**: The app reads from:
   - EAS environment variables (automatically injected during build)
   - `app.config.js` which loads from environment variables

## Security Notes

- Never commit `.env`, `.env.local`, or `eas.json` files
- All sensitive files are already in `.gitignore`
- EAS environment variables are stored securely on Expo's servers
- Only authorized team members can access EAS environment variables

## Troubleshooting

If Firebase isn't connecting in production:

1. Check that all EAS environment variables are set:
   ```bash
   eas env:list --environment production
   ```

2. Verify the build logs for any configuration errors

3. Check the app logs for Firebase initialization errors

4. Ensure you're using the correct environment:
   ```bash
   eas build --platform ios --profile preview
   ```
   The profile should match the environment where you set the variables.