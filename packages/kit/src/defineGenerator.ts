import type { Generator, PluginType } from '@kubb/core'

/**
 * Types a generator for a plugin. Register it in `setup` with `addGenerator`.
 */
export function defineGenerator<TOptions extends PluginType = PluginType, TElement = unknown>(
  generator: Generator<TOptions, TElement>,
): Generator<TOptions, TElement> {
  return generator
}
