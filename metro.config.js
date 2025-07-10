const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude directories that shouldn't be watched
config.watchFolders = [path.resolve(__dirname)];
config.resolver.blockList = [
  /node_modules\/.*\/node_modules/,
  /.git\//,
  /.hive-mind\//,
  /.swarm\//,
  /memory\//,
  /coordination\//,
  /.claude\//,
  /.cursor\//,
];

// Reduce file watching overhead
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Disable file watching for certain paths
      if (req.url.includes('/.hive-mind/') || 
          req.url.includes('/.swarm/') ||
          req.url.includes('/memory/') ||
          req.url.includes('/coordination/')) {
        res.statusCode = 404;
        res.end();
        return;
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;