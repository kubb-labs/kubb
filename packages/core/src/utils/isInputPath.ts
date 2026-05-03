import type { Config, InputPath, UserConfig } from '../types'

/**
 * Type guard to check if a given config has an `input.path`.
 */
export function isInputPath(config: UserConfig | undefined): config is UserConfig<InputPath> & { input: InputPath }
export function isInputPath(config: Config | undefined): config is Config<InputPath> & { input: InputPath }
export function isInputPath(config: Config | UserConfig | undefined): config is (Config<InputPath> | UserConfig<InputPath>) & { input: InputPath } {
  return typeof config?.input === 'object' && config.input !== null && 'path' in config.input
}
