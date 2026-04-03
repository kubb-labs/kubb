import type { PossiblePromise } from '@internals/utils'
import type { UserConfig } from '@kubb/core'

/**
 * CLI options derived from command-line flags.
 */
export type CLIOptions = {
  /**
   * Path to `kubb.config.js`.
   */
  config?: string
  /**
   * Enable watch mode for input files.
   */
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
}

/**
 * All accepted forms of a Kubb configuration.
 */
export type ConfigInput = PossiblePromise<UserConfig | UserConfig[]> | ((cli: CLIOptions) => PossiblePromise<UserConfig | UserConfig[]>)

/**
 * Helper for defining a Kubb configuration.
 *
 * Accepts either:
 * - A config object or array of configs
 * - A function returning the config(s), optionally async,
 *   receiving the CLI options as argument
 *
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
