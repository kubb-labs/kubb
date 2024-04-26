import type { PossiblePromise } from '@kubb/types'
import type { CLIOptions, Config, InputPath, UserConfig } from './types.ts'

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
        cliOptions: CLIOptions,
      ) => PossiblePromise<UserConfig | Array<UserConfig>>),
): typeof options {
  return options
}

export function isInputPath(result: Config | undefined): result is Config<InputPath> {
  return !!result && 'path' in (result as any)
}
