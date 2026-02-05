module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!react-native|@react-native|expo|@expo|@react-navigation)',
  ],
  moduleNameMapper: {
    '^expo-image-picker$': '<rootDir>/node_modules/expo-image-picker/build/ImagePicker.js',
    '^@react-navigation/native$': '<rootDir>/node_modules/@react-navigation/native/lib/index.js',
    '^firebase/(.*)$': '<rootDir>/node_modules/firebase/app/dist/$1.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  projects: [
    {
      displayName: 'React Native Tests',
      testMatch: ['**/__tests__/*.test.ts'],
    },
  ],
  requireConfigFile: false,
};
