// eslint.config.cjs
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  // Ignore heavy folders
  { ignores: ['node_modules/**', 'dist/**', 'playwright-report/**', 'test-results/**'] },

  // Rules for TS/TSX (applied to code in general)
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
    },
    linterOptions: { reportUnusedDisableDirectives: true },
    plugins: { '@typescript-eslint': tsPlugin, import: importPlugin },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'import/order': [
        'warn',
        {
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
    // settings for eslint-plugin-import (typescript resolver)
    settings: {
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.eslint.json'],
        },
      },
    },
  },

  // Specific overrides for tests: relax rules that hinder flow
  {
    files: ['tests/**/*.ts', 'tests/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // allow any in tests
      'no-console': 'off', // allow console in tests
    },
  },

  // Plain JS (if needed)
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2021, sourceType: 'module' },
    rules: {},
  },
];
