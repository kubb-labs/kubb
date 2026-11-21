import type { PluginType } from '@kubb/core'
import type { DefaultPluginType, Generator } from './types.ts'

/**
 * Types a generator for a plugin. Register it in `setup` with `addGenerator`.
 */
export function defineGenerator<TOptions extends PluginType = DefaultPluginType, TElement = unknown>(
  generator: Generator<TOptions, TElement>,
): Generator<TOptions, TElement> {
  return generator
}
