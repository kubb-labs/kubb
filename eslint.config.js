/**
 * Used for the `flatConfig` (new)
 * @link https://eslint.org/docs/latest/use/configure/configuration-files-new
 * @example `ESLINT_USE_FLAT_CONFIG=true eslint`
 */

//configs
import { configs as kubbConfigs } from '@kubb/eslint-config/flat'

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  ...kubbConfigs,
  {
    ignores: ['e2e/**', 'docs/**', 'vitest.config.ts'],
  },
]
