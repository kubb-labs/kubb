import type { PossiblePromise } from '@kubb/types'
import type { Config, InputPath, UserConfig } from './types.ts'

type Args = {
  /**
   * Path to `kubb.config.js`
   */
  config?: string
  /**
   * Watch changes on input
   */
  watch?: boolean

  /**
   * Log level to report when using the CLI
   *
   * `silent` will hide all information that is not relevant
   *
   * `info` will show all information possible(not related to the PluginManager)
   *
   * `debug` will show all information possible(related to the PluginManager), handy for seeing logs
   * @default `silent`
   */
  logLevel?: string
  /**
   * Run Kubb with Bun
   */
  bun?: boolean
}

/**
 * Type helper to make it easier to use kubb.config.js
 * accepts a direct {@link Config} object, or a function that returns it.
 * The function receives a {@link ConfigEnv} object that exposes two properties:
 */
export function defineConfig(
  options:
    | PossiblePromise<UserConfig | Array<UserConfig>>
    | ((
        /** The options derived from the CLI flags */
        args: Args,
      ) => PossiblePromise<UserConfig | Array<UserConfig>>),
): typeof options {
  return options
}

export function isInputPath(result: Config | undefined): result is Config<InputPath> {
  return !!result && 'path' in (result as any)
}
