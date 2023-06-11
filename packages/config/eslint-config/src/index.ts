import globals from 'globals'

import { rules } from './rules'

import type { Linter } from 'eslint'

const config: Linter.Config = {
  root: true,
  parser: '@typescript-eslint/parser',
  env: {
    ...globals['node'],
    'vitest-globals/env': true,
    __dirname: true,
    NodeJS: true,
  },
  extends: [
    'eslint:recommended',
    'turbo',
    'prettier',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
  ],
  plugins: ['@typescript-eslint', 'vitest', 'vitest-globals', 'unused-imports', 'import', 'turbo'],
  rules,
  overrides: [
    {
      files: ['examples/**'],
      rules: {
        'import/extensions': [
          'warn',
          'ignorePackages',
          {
            js: 'always',
            jsx: 'always',
            ts: 'always',
            tsx: 'always',
          },
        ],
      },
    },
  ],
  ignorePatterns: ['**/dist/**', '**/mocks/**'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest',
    tsconfigRootDir: __dirname,
    /**
     * Removes 'WARNING: You are currently running a version of TypeScript which is not officially supported by @typescript-eslint/typescript-estree.'
     */
    warnOnUnsupportedTypeScriptVersion: false,
  },
  reportUnusedDisableDirectives: true,
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      node: true,
      typescript: {
        project: 'packages/*/tsconfig.json',
      },
    },
    react: {
      version: 'detect',
    },
    next: {
      rootDir: ['docs/*/'],
    },
  },
}

export default config
