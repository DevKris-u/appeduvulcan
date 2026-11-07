module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  setupFiles: ['./jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: ['node_modules/(?!(react-native|@react-native|react-native-paper)/)'],
};
