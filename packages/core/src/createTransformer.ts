/**
 * Object with transformer helpers returned by a plugin, allowing other plugins to
 * reference the exact naming and path-resolution logic of the originating plugin.
 */
export type Transformer = {
  /**
   * The default name transformer.
   * Converts a raw name into the identifier form used by the plugin.
   *
   * @example
   * transformer.default('list pets', 'type') // → 'ListPets'
   */
  default(name: string, type?: 'file' | 'function' | 'type' | 'const'): string
  /**
   * Resolves the file/path name for a given identifier.
   *
   * @example
   * transformer.resolvePathName('list pets', 'file') // → 'ListPets'
   */
  resolvePathName(name: string, type?: 'file' | 'function' | 'type' | 'const'): string
}

/**
 * Creates a typed transformer object for a plugin, following the same factory pattern
 * as `definePlugin`, `defineLogger`, and `defineAdapter`.
 *
 * Pass the plugin's factory type (`PluginTs`, `PluginClient`, …) as the `TPlugin` generic
 * to tie the transformer to the correct plugin at the type level.
 *
 * @example
 * ```ts
 * import { createTransformer } from '@kubb/core'
 * import type { PluginTs } from '@kubb/plugin-ts'
 *
 * export const transformer = createTransformer<PluginTs>(() => {
 *   return {
 *     default(name, type) { return pascalCase(name) },
 *     resolvePathName(name, type) { return pascalCase(name, { isFile: type === 'file' }) },
 *   }
 * })
 * ```
 */
export function createTransformer<_TPlugin extends object = object>(factory: () => Transformer): Transformer {
  return factory()
}
