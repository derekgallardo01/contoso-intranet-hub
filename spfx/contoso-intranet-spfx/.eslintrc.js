module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    browser: true,
    es2020: true,
    jest: true,
  },
  rules: {
    // TypeScript handles these better
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

    // Allow explicit any in specific cases (SPFx API types)
    '@typescript-eslint/no-explicit-any': 'warn',

    // React 18 doesn't need React in scope
    'react/react-in-jsx-scope': 'off',

    // SPFx uses class components extensively
    'react/prefer-stateless-function': 'off',

    // Allow empty catch blocks (used for graceful fallbacks in services)
    'no-empty': ['error', { allowEmptyCatch: true }],
    '@typescript-eslint/no-empty-function': 'off',

    // SPFx uses empty interfaces for extension properties
    '@typescript-eslint/no-empty-object-type': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    'lib/',
    'dist/',
    'temp/',
    'coverage/',
    '*.js',
    '!.eslintrc.js',
    '!jest.config.js',
  ],
};
