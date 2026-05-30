const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch monorepo packages
config.watchFolders = [workspaceRoot];

// Resolve from workspace first
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = true;

// Enable package exports for monorepo packages
config.resolver.unstable_enablePackageExports = false;

// Cache store
config.cacheStores = [new FileStore({ root: path.join(projectRoot, '.metro-cache') })];

module.exports = config;
