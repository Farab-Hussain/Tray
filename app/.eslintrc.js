module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: [
    'metro.config.js',
    'android/app/build/**',
    'ios/build/**',
    'coverage/**',
    '__tests__/**',
    'src/__tests__/**',
    '__mocks__/**',
    'jest.setup.js',
    'test-jsx.tsx',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'no-dupe-keys': 'warn',
  },
};
