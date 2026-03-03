module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|lucide-react-native|react-native-image-picker)/)',
  ],
  moduleNameMapper: {
    '^@react-navigation/native$': '<rootDir>/node_modules/@react-navigation/native/lib/index.js',
    '^firebase/(.*)$': '<rootDir>/node_modules/firebase/app/dist/$1.js',
    '^@testing-library/react-native$': '<rootDir>/__mocks__/@testing-library/react-native.js',
    '^react-native-image-picker$': '<rootDir>/__mocks__/react-native-image-picker.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  projects: [
    {
      displayName: 'React Native Tests',
      testMatch: ['**/__tests__/*.test.ts?(x)'],
    },
  ],
};
