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

export function defineConfig<T extends UserConfig | UserConfig[]>(config: T & (T extends any[] ? UserConfig[] : UserConfig)): T
export function defineConfig<T extends (cli: CLIOptions) => PossiblePromise<UserConfig | UserConfig[]>>(config: T): T
export function defineConfig(config: any) {
  return config
}

/**
 * Type guard to check if a given config has an `input.path`.
 */
export function isInputPath(config: UserConfig | undefined): config is UserConfig<InputPath> {
  return typeof config?.input === 'object' && config.input !== null && 'path' in config.input
}
