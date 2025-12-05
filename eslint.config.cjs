// eslint.config.cjs
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  // Ignorar pastas pesadas
  { ignores: ['node_modules/**', 'dist/**', 'playwright-report/**', 'test-results/**'] },

  // Regras para TS/TSX (aplicadas ao código em geral)
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
    // settings para eslint-plugin-import (resolver typescript)
    settings: {
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.eslint.json'],
        },
      },
    },
  },

  // Overrides específicos para tests: relaxar regras que atrapalham fluxo
  {
    files: ['tests/**/*.ts', 'tests/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // permite any em testes
      'no-console': 'off', // permite console em testes
    },
  },

  // JS simples (se precisar)
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2021, sourceType: 'module' },
    rules: {},
  },
];
