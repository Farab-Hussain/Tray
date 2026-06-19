module.exports = {
  preset: 'react-native',
  testMatch: ['**/__tests__/*.test.ts?(x)'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|lucide-react-native|react-native-image-picker|react-native-vector-icons|@react-native-community)/)',
  ],
  moduleNameMapper: {
    '^\\.\\./\\.\\./(Screen|services|components|contexts|navigator|constants|utils|hooks|types)/(.*)$': '<rootDir>/src/$1/$2',
    '^@testing-library/react-native$': '<rootDir>/__mocks__/@testing-library/react-native.js',
    '^lucide-react-native$': '<rootDir>/__mocks__/lucide-react-native.js',
    '^react-native-image-picker$': '<rootDir>/__mocks__/react-native-image-picker.js',
    '^react-native-fs$': '<rootDir>/__mocks__/react-native-fs.js',
    '^@stripe/stripe-react-native$': '<rootDir>/__mocks__/@stripe/stripe-react-native.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
