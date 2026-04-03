/* Metro on Windows expects CommonJS; dynamic ESM loading can fail with file:// URLs. */
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;
