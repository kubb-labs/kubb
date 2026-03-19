import { camelCase, pascalCase } from '@internals/utils'
import type { PluginFactoryOptions, ResolveNameParams } from './types.ts'

type ResolverBuilder<T extends PluginFactoryOptions> = () => Omit<T['resolver'], 'default'> & ThisType<T['resolver']>

function defaultResolver(name: ResolveNameParams['name'], type: ResolveNameParams['type']): string {
  let resolvedName = camelCase(name)

  if (type === 'file' || type === 'function') {
    resolvedName = camelCase(name, {
      isFile: type === 'file',
    })
  }

  if (type === 'type') {
    resolvedName = pascalCase(name)
  }

  return resolvedName
}

/**
 * Creates a resolver for a plugin by eagerly invoking the builder and merging in the standard
 * `default` naming implementation. Plugin authors only need to supply the helper methods
 * (i.e. a `UserResolver`) — `createResolver` injects `default` automatically.
 *
 * The injected `default` uses `camelCase` for identifiers and file names, and `pascalCase`
 * for type names.
 *
 * Pass the plugin's factory type (`PluginTs`, `PluginClient`, …) as the generic to tie the
 * resolver to the correct plugin at the type level.
 *
 * @example
 * ```ts
 * import { createResolver } from '@kubb/core'
 * import type { PluginTs } from '@kubb/plugin-ts'
 *
 * export const resolver = createResolver<PluginTs>(() => ({
 *   resolveName(name) { return this.default(name, 'function') },
 *   resolvePathName(name, type) { return this.default(name, type) },
 * }))
 * ```
 */
export function createResolver<T extends PluginFactoryOptions>(build: ResolverBuilder<T>): T['resolver'] {
  return {
    default: defaultResolver,
    ...build(),
  } as T['resolver']
}
