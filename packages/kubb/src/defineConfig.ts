import { isPromise, type PossiblePromise } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import type { UserConfig } from '@kubb/core'
import { parserTs, parserTsx } from '@kubb/parser-ts'

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
 * Applies default adapter and parsers to a single user config when not set.
 *
 * - `adapter` defaults to `adapterOas()`
 * - `parsers` defaults to `[parserTs, parserTsx]`
 */
function applyDefaults(config: UserConfig): UserConfig {
  return {
    ...config,
    adapter: config.adapter ?? adapterOas(),
    parsers: config.parsers?.length ? config.parsers : [parserTs, parserTsx],
  }
}

/**
 * Helper for defining a Kubb configuration with built-in defaults.
 *
 * When no `adapter` is provided, `adapterOas()` is used automatically.
 * When no `parsers` are provided, `[parserTsx]` is used automatically.
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
export function defineConfig(config: (cli: CLIOptions) => PossiblePromise<UserConfig | UserConfig[]>): (cli: CLIOptions) => Promise<UserConfig | UserConfig[]>
export function defineConfig(config: Promise<UserConfig | UserConfig[]>): Promise<UserConfig | UserConfig[]>
export function defineConfig(config: UserConfig | UserConfig[]): UserConfig | UserConfig[]
export function defineConfig(config: ConfigInput): ConfigInput {
  if (typeof config === 'function') {
    return async (cli: CLIOptions) => {
      const resolved = await config(cli)
      const configs = Array.isArray(resolved) ? resolved : [resolved]
      const result = configs.map(applyDefaults)

      return result.length === 1 ? result[0]! : result
    }
  }

  if (isPromise(config)) {
    return config.then((resolved) => {
      const configs = Array.isArray(resolved) ? resolved : [resolved]
      const result = configs.map(applyDefaults)

      return result.length === 1 ? result[0]! : result
    })
  }

  const configs = Array.isArray(config) ? config : [config]
  const result = configs.map(applyDefaults)

  return result.length === 1 ? result[0]! : result
}
