const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'ts', 'tsx', 'mjs', 'cjs',
];

// Force Metro to only look at root node_modules — ignore all nested ones
config.resolver.nodeModulesPaths = [
  `${__dirname}/node_modules`,
];

module.exports = config;
