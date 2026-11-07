const eslintPluginPrettier = require('eslint-plugin-prettier');
const eslintConfigPrettier = require('eslint-config-prettier');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const rnPlugin = require('eslint-plugin-react-native');

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      prettier: eslintPluginPrettier,
      '@typescript-eslint': tsPlugin,
      'react-native': rnPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react-native/no-unused-styles': 'warn',
      'react-native/split-platform-components': 'off',
    },
    ignores: ['node_modules/', '.expo/', 'android/', 'coverage/', 'dist/', 'jest.setup.js', 'babel.config.js', 'jest.config.js'],
  },
  eslintConfigPrettier,
];
