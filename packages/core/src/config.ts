import type { PossiblePromise } from '@kubb/types'
import type { CLIOptions, InputPath, KubbConfig, KubbUserConfig } from './types.ts'

/**
 * Type helper to make it easier to use kubb.config.js
 * accepts a direct {@link KubbConfig} object, or a function that returns it.
 * The function receives a {@link ConfigEnv} object that exposes two properties:
 */
export function defineConfig(
  options:
    | PossiblePromise<KubbUserConfig | Array<KubbUserConfig>>
    | ((
      /** The options derived from the CLI flags */
      cliOptions: CLIOptions,
    ) => PossiblePromise<KubbUserConfig | Array<KubbUserConfig>>),
): typeof options {
  return options
}

export function isInputPath(result: KubbConfig | undefined): result is KubbConfig<InputPath> {
  return !!result && 'path' in (result as any)
}
