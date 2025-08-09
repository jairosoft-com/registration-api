const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const prettier = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        // Node.js globals
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier: prettierPlugin,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Let TypeScript handle undefined checks; avoid false positives on Node globals
      'no-undef': 'off',
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', 'src/common/test/**/*.ts', '__tests__/**/*.ts'],
    languageOptions: {
      globals: {
        // Jest globals
        afterAll: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        jest: 'readonly',
        test: 'readonly',
      },
    },
    rules: {
      // Allow require() in tests/spec utilities
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },
  {
    files: ['scripts/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['src/database/repositories/mock.user.repository.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', '*.js', 'e2e/**'],
  },
];
