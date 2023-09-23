import type { PossiblePromise } from './utils/types.ts'
import type { CLIOptions, KubbUserConfig } from './types.ts'

/**
 * Type helper to make it easier to use kubb.config.js
 * accepts a direct {@link KubbConfig} object, or a function that returns it.
 * The function receives a {@link ConfigEnv} object that exposes two properties:
 */
export function defineConfig(
  options:
    | PossiblePromise<KubbUserConfig>
    | ((
        /** The options derived from the CLI flags */
        cliOptions: CLIOptions,
      ) => PossiblePromise<KubbUserConfig>),
): typeof options {
  return options
}
