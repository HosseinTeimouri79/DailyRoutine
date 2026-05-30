module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./'],
        alias: {
          '@hadafino/core': '../../packages/core/src',
          '@hadafino/theme': '../../packages/theme/src',
          '@hadafino/i18n': '../../packages/i18n/src',
          '@hadafino/ui': '../../packages/ui/src',
          '@hadafino/notifications': '../../packages/notifications/src',
        },
      }],
      'react-native-reanimated/plugin',
    ],
  };
};
