import type { InputPath, UserConfig } from './types.ts'
import type { PossiblePromise } from './utils/types.ts'

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
export function defineConfig(
  config: PossiblePromise<UserConfig | UserConfig[]> | ((cli: CLIOptions) => PossiblePromise<UserConfig | UserConfig[]>),
): typeof config {
  return config
}

/**
 * Type guard to check if a given config has an `input.path`.
 */
export function isInputPath(config: UserConfig | undefined): config is UserConfig<InputPath> {
  return typeof config?.input === 'object' && config.input !== null && 'path' in config.input
}
