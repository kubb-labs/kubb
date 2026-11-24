import type { Generator, PluginType } from './types.ts'

/**
 * Types a generator for a plugin. Register it in `setup` with `addGenerator`.
 * @deprecated Use `defineTemplate`. Removed in Kubb v6.
 */
export function defineGenerator<TOptions extends PluginType = PluginType, TElement = unknown>(
  generator: Generator<TOptions, TElement>,
): Generator<TOptions, TElement> {
  return generator
}
