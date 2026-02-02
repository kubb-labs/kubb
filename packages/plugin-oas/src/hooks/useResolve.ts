import type { Plugin } from '@kubb/core'
import { usePlugin, usePluginManager } from '@kubb/core/hooks'
import type { Oas, Operation, SchemaObject } from '@kubb/oas'
import type { FileDescriptor, Resolution, ResolverContext, Resolver } from '../resolvers/types.ts'
import { buildResolverContext, executeResolvers, mergeResolvers } from '../resolvers/createResolver.ts'

/**
 * Registry of default resolvers by plugin name
 * Plugins register their default resolvers here
 */
const defaultResolverRegistry = new Map<string, Array<Resolver<string>>>()

/**
 * Register default resolvers for a plugin
 * Called by plugins during initialization
 */
export function registerDefaultResolvers<TOutputKeys extends string>(
  pluginName: string,
  resolvers: Array<Resolver<TOutputKeys>>
): void {
  defaultResolverRegistry.set(pluginName, resolvers as Array<Resolver<string>>)
}

/**
 * Get default resolvers for a plugin
 */
export function getDefaultResolvers(pluginName: string): Array<Resolver<string>> {
  return defaultResolverRegistry.get(pluginName) ?? []
}

/**
 * Check if a plugin has default resolvers registered
 */
export function hasDefaultResolver(pluginName: string): boolean {
  return defaultResolverRegistry.has(pluginName)
}

/**
 * Hook to resolve names/files for current or other plugins
 * Returns a typesafe Resolution object with all outputs
 *
 * @typeParam TOutputKeys - Output keys type (inferred or explicit)
 *
 * @example
 * ```tsx
 * // Resolve for current plugin
 * const resolved = useResolve<ReactQueryOutputKeys>(ctx)
 *
 * // Resolve from another plugin
 * const ts = useResolve<TsOutputKeys>(ctx, [pluginTsName])
 *
 * // Access outputs (type-safe!)
 * const hookName = resolved.outputs.hook.name
 * const typeName = ts.outputs.response.name
 * ```
 */
export function useResolve<TOutputKeys extends string = string>(
  ctx: ResolverContext,
  pluginKey?: Plugin['key']
): Resolution<TOutputKeys> {
  const pluginManager = usePluginManager()
  const currentPlugin = usePlugin()

  const targetPluginKey = pluginKey ?? currentPlugin.key
  const targetPlugin = pluginManager.getPluginByKey(targetPluginKey)

  if (!targetPlugin) {
    throw new Error(`Plugin not found: ${JSON.stringify(targetPluginKey)}`)
  }

  // Get resolvers from plugin options (user-defined)
  const customResolvers = (targetPlugin.options as { resolvers?: Array<Resolver<string>> })?.resolvers ?? []

  // Get default resolvers for this plugin
  const defaultResolvers = getDefaultResolvers(targetPlugin.name)

  // Merge: custom resolvers run first (higher priority)
  const allResolvers = mergeResolvers(customResolvers, defaultResolvers)

  // If no resolvers are configured, throw a helpful error
  if (allResolvers.length === 0) {
    throw new Error(
      `No resolvers configured for plugin ${targetPlugin.name}. ` +
        `Either add resolvers to the plugin options or ensure the plugin registers default resolvers. ` +
        `Note: For plugins that haven't migrated to the resolver pattern yet, use useOperationManager instead.`
    )
  }

  // Execute resolvers
  const resolution = executeResolvers(allResolvers, ctx)

  if (!resolution) {
    // No resolver matched the context
    throw new Error(
      `No resolver matched for ${ctx.operationId ?? ctx.schema?.name ?? 'unknown'} in plugin ${targetPlugin.name}. ` +
        `Check that your resolvers have appropriate match conditions or a default resolver without a match function.`
    )
  }

  return resolution as Resolution<TOutputKeys>
}

/**
 * Convenience hook that builds ResolverContext from an operation and resolves
 */
export function useResolveOperation<TOutputKeys extends string = string>(
  oas: Oas,
  operation: Operation,
  pluginKey?: Plugin['key']
): Resolution<TOutputKeys> {
  const ctx = buildResolverContext(oas, operation)
  return useResolve<TOutputKeys>(ctx, pluginKey)
}

/**
 * Convenience hook that builds ResolverContext from a schema and resolves
 */
export function useResolveSchema<TOutputKeys extends string = string>(
  oas: Oas,
  schema: { name: string; value: SchemaObject },
  pluginKey?: Plugin['key']
): Resolution<TOutputKeys> {
  const ctx = buildResolverContext(oas, undefined, schema)
  return useResolve<TOutputKeys>(ctx, pluginKey)
}

/**
 * Get the file for a specific output
 * Uses output's file if set, otherwise falls back to resolution's default file
 *
 * @example
 * ```ts
 * const resolution = useResolve<TsOutputKeys>(ctx, [pluginTsName])
 * const responseFile = getOutputFile(resolution, 'response')
 * // responseFile.path contains the file path for the response type
 * ```
 */
export function getOutputFile<TOutputKeys extends string>(
  resolution: Resolution<TOutputKeys>,
  outputKey: TOutputKeys
): FileDescriptor {
  const output = resolution.outputs[outputKey]
  if (!output) {
    throw new Error(`Output key "${outputKey}" not found in resolution`)
  }
  return output.file ?? resolution.file
}
