import type { Plugin, PluginFactoryOptions } from '@kubb/core'
import { usePlugin, usePluginManager } from '@kubb/core/hooks'
import { executeOperationResolvers, executeSchemaResolvers } from '../resolvers/createResolver.ts'
import type { FileDescriptor, OperationResolverContext, Resolution, Resolver, SchemaResolverContext } from '../resolvers/types.ts'

/**
 * Hook to resolve names/files for operations in current or other plugins
 * @typeParam TOptions - PluginFactoryOptions containing outputKeys
 */
export function useOperationResolve<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(
  ctx: Omit<OperationResolverContext, 'config'>,
  pluginKey?: Plugin['key'],
): Resolution<TOptions> | null {
  const pluginManager = usePluginManager()
  const currentPlugin = usePlugin()
  const config = pluginManager.config

  const targetPluginKey = pluginKey ?? currentPlugin.key
  const targetPlugin = pluginManager.getPluginByKey(targetPluginKey)

  if (!targetPlugin) {
    // Plugin not found, return null to allow fallback to legacy resolution
    return null
  }

  // Get resolvers from plugin (top-level property defined in @kubb/core)
  const resolvers = (targetPlugin.resolvers ?? []) as Array<Resolver<TOptions>>

  // If no resolvers available, return null (caller should use fallback)
  if (resolvers.length === 0) {
    return null
  }

  return executeOperationResolvers(resolvers, { ...ctx, config })
}

/**
 * Hook to resolve names/files for schemas in current or other plugins
 * @typeParam TOptions - PluginFactoryOptions containing outputKeys
 */
export function useSchemaResolve<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(
  ctx: Omit<SchemaResolverContext, 'config'>,
  pluginKey?: Plugin['key'],
): Resolution<TOptions> | null {
  const pluginManager = usePluginManager()
  const currentPlugin = usePlugin()
  const config = pluginManager.config

  const targetPluginKey = pluginKey ?? currentPlugin.key
  const targetPlugin = pluginManager.getPluginByKey(targetPluginKey)

  if (!targetPlugin) {
    // Plugin not found, return null to allow fallback to legacy resolution
    return null
  }

  // Get resolvers from plugin (top-level property defined in @kubb/core)
  const resolvers = (targetPlugin.resolvers ?? []) as Array<Resolver<TOptions>>

  // If no resolvers available, return null (caller should use fallback)
  if (resolvers.length === 0) {
    return null
  }

  return executeSchemaResolvers(resolvers, { ...ctx, config })
}

/**
 * Get the file for a specific output (uses output file if set, else resolution default)
 */
export function getOutputFile<TOptions extends PluginFactoryOptions>(resolution: Resolution<TOptions>, outputKey: TOptions['outputKeys']): FileDescriptor {
  const output = resolution.outputs[outputKey]
  return output?.file ?? resolution.file
}
