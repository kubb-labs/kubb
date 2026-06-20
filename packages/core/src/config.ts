import type { PossiblePromise } from '@internals/utils'
import type { InputPath, UserConfig } from './types.ts'

/**
 * CLI options derived from command-line flags.
 */
export type CLIOptions = {
  /** Path to `kubb.config.js` */
  config?: string

  /** Enable watch mode for input files */
  watch?: boolean

  /**
   * Logging verbosity for CLI usage.
   *
   * - `silent`: hide non-essential logs
   * - `info`: show general logs (non-plugin-related)
   * - `debug`: include detailed plugin lifecycle logs
   * @default 'silent'
   */
  logLevel?: 'silent' | 'info' | 'debug'

  /** Run Kubb with Bun */
  bun?: boolean
}

/** All accepted forms of a Kubb configuration. */
export type ConfigInput = PossiblePromise<UserConfig | UserConfig[]> | ((cli: CLIOptions) => PossiblePromise<UserConfig | UserConfig[]>)

/**
 * Helper for defining a Kubb configuration.
 *
 * Accepts either:
 * - A config object or array of configs
 * - A function returning the config(s), optionally async,
 *   receiving the CLI options as argument
 *
 * @deprecated Import `defineConfig` from `kubb` instead of `@kubb/core`. The `kubb`
 * package wires up the OpenAPI adapter, the TypeScript parsers, and the barrel plugin
 * for you. See the v5 migration guide: https://kubb.dev/docs/5.x/migration-guide
 *
 * ```ts
 * import { defineConfig } from '@kubb/core' // [!code --]
 * import { defineConfig } from 'kubb' // [!code ++]
 * ```
 * @example
 * export default defineConfig(({ logLevel }) => ({
 *   root: 'src',
 *   plugins: [myPlugin()],
 * }))
 */
export function defineConfig(config: (cli: CLIOptions) => PossiblePromise<UserConfig | UserConfig[]>): typeof config
export function defineConfig(config: PossiblePromise<UserConfig | UserConfig[]>): typeof config
export function defineConfig(config: ConfigInput): ConfigInput {
  return config
}

/**
 * Type guard to check if a given config has an `input.path`.
 */
export function isInputPath(config: UserConfig | undefined): config is UserConfig<InputPath> {
  return typeof config?.input === 'object' && config.input !== null && 'path' in config.input
}
