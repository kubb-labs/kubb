/**
 * Used for the `flatConfig` (new)
 * @link https://eslint.org/docs/latest/use/configure/configuration-files-new
 * @example `ESLINT_USE_FLAT_CONFIG=true eslint`
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'

//configs
import { configs as kubbConfigs } from '@kubb/eslint-config/flat'

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  ...kubbConfigs,
  {
    ignores: ['e2e/**', 'docs/**', 'vitest.config.ts', 'vite.config.ts'],
    files: ['packages/**', 'examples/**'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url)),
        project: ['./examples/*/tsconfig.json', './packages/*/tsconfig.json', './packages/config/*/tsconfig.json'],
      },
    },
  },
]
