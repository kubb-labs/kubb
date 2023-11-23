import globals from 'globals'

import { ignores } from './ignores.ts'
import { rules } from './rules.ts'

import type { Linter } from 'eslint'

const config: Linter.Config = {
  root: true,
  ignorePatterns: ignores.all,
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
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:react/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'vitest', 'vitest-globals', 'unused-imports', 'import', 'simple-import-sort', 'turbo'],
  rules,
  overrides: [
    {
      files: ['examples/**', 'e2e/**'],
      rules: {
        'import/extensions': [
          'off',
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
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest',
    tsconfigRootDir: __dirname,
    /**
     * Removes 'WARNING: You are currently running a version of TypeScript which is not officially supported by @typescript-eslint/typescript-estree.'
     */
    warnOnUnsupportedTypeScriptVersion: false,
    project: true,
  },
  reportUnusedDisableDirectives: true,
  settings: {
    ecmaFeatures: {
      jsx: true,
    },
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
  },
}

export default config
