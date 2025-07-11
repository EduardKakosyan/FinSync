const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add additional resolver configuration for better module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ensure proper module resolution for React Native dependencies
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native': require.resolve('react-native'),
};

module.exports = config;