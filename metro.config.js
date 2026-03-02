const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for Firebase modular SDK
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
