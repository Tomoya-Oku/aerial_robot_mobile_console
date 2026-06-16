module.exports = {
  root: true,
  extends: '@react-native',
  parser: '@typescript-eslint/parser',
  rules: {
    'react/react-in-jsx-scope': 'off',
    // Removed from @typescript-eslint v8 (moved to @stylistic); the RN preset
    // still references it, so disable to avoid "rule not found" errors.
    '@typescript-eslint/func-call-spacing': 'off',
  },
};
