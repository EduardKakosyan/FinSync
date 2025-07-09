const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Comprehensive fix for Firebase module resolution issues
config.resolver = {
  ...config.resolver,
  // Ensure proper module resolution paths
  nodeModulesPaths: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, '../node_modules'),
  ],
  // Force tslib resolution to our top-level node_modules
  alias: {
    ...config.resolver.alias,
    tslib: path.resolve(__dirname, 'node_modules/tslib'),
  },
  // Add platform-specific extensions for React Native
  platforms: ['ios', 'android', 'native', 'web'],
  // Ensure all Firebase modules can resolve their dependencies
  unstable_enableSymlinks: false,
  unstable_conditionNames: ['react-native', 'browser', 'require'],
};

// Fix for MIME-Type error in development builds
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    return (req, res, next) => {
      // Set proper MIME type for JavaScript files
      if (req.url && req.url.includes('.bundle')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;