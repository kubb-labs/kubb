import type { Plugin } from '@kubb/core'
import { usePlugin, usePluginManager } from '@kubb/core/hooks'
import { executeResolvers } from '../resolvers/createResolver.ts'
import type { FileDescriptor, Resolution, Resolver, ResolverContext } from '../resolvers/types.ts'

/**
 * Hook to resolve names/files for current or other plugins
 * @typeParam TOutputKeys - Output keys type (inferred or explicit)
 */
export function useResolve<TOutputKeys extends string = string>(ctx: ResolverContext, pluginKey?: Plugin['key']): Resolution<TOutputKeys> | null {
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
  const resolvers = (targetPlugin.resolvers ?? []) as Array<Resolver<TOutputKeys>>

  // If no resolvers available, return null (caller should use fallback)
  if (resolvers.length === 0) {
    return null
  }

  return executeResolvers(resolvers, ctx, config)
}

/**
 * Get the file for a specific output (uses output file if set, else resolution default)
 */
export function getOutputFile<TOutputKeys extends string>(resolution: Resolution<TOutputKeys>, outputKey: TOutputKeys): FileDescriptor {
  const output = resolution.outputs[outputKey]
  return output?.file ?? resolution.file
}
