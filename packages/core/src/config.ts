import type { MaybePromise, KubbUserConfig, CLIOptions } from './types.js'

/**
 * Type helper to make it easier to use kubb.config.ts
 * accepts a direct {@link KubbConfig} object, or a function that returns it.
 * The function receives a {@link ConfigEnv} object that exposes two properties:
 */
export const defineConfig = (
  options:
    | MaybePromise<KubbUserConfig>
    | ((
        /** The options derived from the CLI flags */
        cliOptions: CLIOptions
      ) => MaybePromise<KubbUserConfig>)
) => options
