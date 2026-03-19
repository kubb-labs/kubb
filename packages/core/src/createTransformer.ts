/**
 * Base constraint for all plugin transformer objects.
 *
 * `default` is the one resolver every transformer must implement so consumers
 * always have a typed, autocomplete-friendly entry point. Plugins extend this
 * intersection with their own concrete helper methods via `Record<string, unknown>`.
 */
export type Transformer = {
  default(name: string, type?: 'file' | 'function' | 'type' | 'const'): string
} & Record<string, unknown>

type TransformerBuilder<TPlugin extends { transformer: Transformer }> = () => TPlugin['transformer']

/**
 * Wraps a transformer builder to create a lazy transformer factory, following the same
 * factory pattern as `createAdapter` and `createStorage`.
 *
 * Pass the plugin's factory type (`PluginTs`, `PluginClient`, …) as the generic
 * to tie the transformer to the correct plugin at the type level.
 * Call the returned function to obtain the concrete transformer instance.
 *
 * @example
 * ```ts
 * import { createTransformer } from '@kubb/core'
 * import type { PluginTs } from '@kubb/plugin-ts'
 *
 * export const transformer = createTransformer<PluginTs>(() => {
 *   return {
 *     default(name: string) { return pascalCase(name) },
 *     resolvePathName(name: string) { return pascalCase(name) },
 *   }
 * })()
 * ```
 */
export function createTransformer<TPlugin extends { transformer: Transformer }>(build: TransformerBuilder<TPlugin>): () => TPlugin['transformer'] {
  return () => build()
}
