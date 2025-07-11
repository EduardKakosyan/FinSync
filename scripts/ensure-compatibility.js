#!/usr/bin/env node

/**
 * Ensure dependency compatibility before build
 */

const { execSync } = require('child_process');

console.log('🔧 Ensuring dependency compatibility...');

try {
  // Fix Expo dependencies
  console.log('📦 Running expo install --fix...');
  execSync('npx expo install --fix', { stdio: 'inherit' });
  
  console.log('✅ Dependencies fixed successfully');
} catch (error) {
  console.error('❌ Failed to fix dependencies:', error.message);
  process.exit(1);
}