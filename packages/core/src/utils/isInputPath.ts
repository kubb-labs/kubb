import type { Config, InputPath } from '../types'

/**
 * Type guard to check if a given config has an `input.path`.
 */
export function isInputPath(config: Config | undefined): config is Config<InputPath> {
  return typeof config?.input === 'object' && config.input !== null && 'path' in config.input
}
