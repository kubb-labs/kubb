/**
 * Base constraint for all plugin resolver objects.
 *
 * `default` is the one method every resolver must implement so consumers
 * always have a typed, autocomplete-friendly entry point. Plugins extend this
 * intersection with their own concrete helper methods via `Record<string, unknown>`.
 */
export type Resolver = {
  default(name: string, type?: 'file' | 'function' | 'type' | 'const'): string
} & Record<string, unknown>

type ResolverBuilder<TPlugin extends { resolver: Resolver }> = () => TPlugin['resolver']

/**
 * Wraps a resolver builder to create a lazy resolver factory, following the same
 * factory pattern as `createAdapter` and `createStorage`.
 *
 * Pass the plugin's factory type (`PluginTs`, `PluginClient`, …) as the generic
 * to tie the resolver to the correct plugin at the type level.
 * Call the returned function to obtain the concrete resolver instance.
 *
 * @example
 * ```ts
 * import { createResolver } from '@kubb/core'
 * import type { PluginTs } from '@kubb/plugin-ts'
 *
 * export const resolver = createResolver<PluginTs>(() => {
 *   return {
 *     default(name: string) { return pascalCase(name) },
 *     resolvePathName(name: string) { return pascalCase(name) },
 *   }
 * })()
 * ```
 */
export function createResolver<TPlugin extends { resolver: Resolver }>(build: ResolverBuilder<TPlugin>): () => TPlugin['resolver'] {
  return () => build()
}
