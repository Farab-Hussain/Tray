/* eslint-env node */
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {};

// Polyfill for toReversed method (Node.js 18 compatibility)
if (typeof Array.prototype.toReversed === 'undefined') {
  Array.prototype.toReversed = function() {
    return [...this].reverse();
  };
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
