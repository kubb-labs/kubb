import type { Plugin, PluginFactoryOptions } from '@kubb/core'
import { usePlugin, usePluginManager } from '@kubb/core/hooks'
import type {
  OperationResolverContext,
  OperationResolution,
  Resolver,
  SchemaResolverContext,
  SchemaResolution,
} from '../resolvers/types.ts'

/**
 * Hook to resolve names/files for operations
 */
export function useResolve<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(
  ctx: Omit<OperationResolverContext, 'config'>,
  pluginName?: Plugin['name'],
): OperationResolution<TOptions> | null

/**
 * Hook to resolve names/files for schemas
 */
export function useResolve<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(
  ctx: Omit<SchemaResolverContext, 'config'>,
  pluginName?: Plugin['name'],
): SchemaResolution<TOptions> | null

/**
 * Hook to resolve names/files for schemas/operations in current or other plugins
 */
export function useResolve<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(
  ctx: Omit<SchemaResolverContext, 'config'> | Omit<OperationResolverContext, 'config'>,
  pluginName?: Plugin['name'],
): OperationResolution<TOptions> | SchemaResolution<TOptions> | null {
  const pluginManager = usePluginManager()
  const currentPlugin = usePlugin()
  const config = pluginManager.config

  // When pluginName is not provided, use the current plugin directly
  // to ensure multi-instance plugins resolve to the correct instance
  const plugin = pluginName ? pluginManager.getPlugin(pluginName) : currentPlugin

  if (!plugin) {
    // Plugin not found, return null to allow fallback to legacy resolution
    return null
  }

  // Get resolvers from plugin (top-level property defined in @kubb/core)
  const resolvers = (plugin.resolvers ?? []) as Array<Resolver<TOptions>>

  // If no resolvers available, return null (caller should use fallback)
  if (resolvers.length === 0) {
    return null
  }

  if ('schema' in ctx) {
    for (const resolver of resolvers) {
      const result = resolver.schema({ ...ctx, config })
      if (result) {
        return result
      }
    }
  }

  if ('operation' in ctx) {
    for (const resolver of resolvers) {
      const result = resolver.operation({ ...ctx, config })
      if (result) {
        return result
      }
    }
  }

  return null
}
