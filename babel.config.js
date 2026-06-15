module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@app': './src/app',
          '@components': './src/components',
          '@design': './src/design',
          '@features': './src/features',
          '@ros': './src/ros',
        },
      },
    ],
  ],
};
