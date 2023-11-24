/**
 * Used for the `flatConfig` (new)
 * @link https://eslint.org/docs/latest/use/configure/configuration-files-new
 * @example `ESLINT_USE_FLAT_CONFIG=true eslint`
 */

import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import tsPlugin from '@typescript-eslint/eslint-plugin'

// configs
import config from '@kubb/eslint-config/flat'

import { ignores } from '@kubb/eslint-config'

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  config.configs.recommended,
  config.configs.tests,
  config.configs.build,
  {
    files: ['examples/**', 'e2e/**'],
    ignores: ignores.all,
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'import/extensions': 'off',
      'simple-import-sort/imports': 'off',
      '@typescript-eslint/no-duplicate-type-constituents': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'unused-imports/no-unused-vars': 'off',
    },
  },
  {
    files: ['packages/**', 'examples/**'],
    ignores: ['e2e/**', 'docs/**', 'vitest.config.ts', 'vite.config.ts'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        tsconfigRootDir: dirname(fileURLToPath(import.meta.url)),
        project: ['./examples/*/tsconfig.json', './packages/*/tsconfig.json', './packages/config/*/tsconfig.json'],
      },
    },
  },
]
