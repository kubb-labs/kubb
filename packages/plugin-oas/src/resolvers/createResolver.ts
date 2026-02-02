import type { Config, PluginFactoryOptions } from '@kubb/core'
import type { Resolution, Resolver, ResolverContext } from './types.ts'

/**
 * Creates a typed resolver
 * @typeParam TOutputKeys - String literal union of output keys
 */
export function createResolver<TOutputKeys extends string>(resolver: Resolver<TOutputKeys>): Resolver<TOutputKeys> {
  return resolver
}

/**
 * Merges custom resolvers with defaults (string-based output keys)
 * Custom resolvers have higher priority (come first in array)
 * @typeParam TOutputKeys - String literal union of output keys
 */
export function mergeResolvers<TOutputKeys extends string>(
  customResolvers: Array<Resolver<TOutputKeys>> | undefined,
  defaultResolvers: Array<Resolver<TOutputKeys>>,
): Array<Resolver<TOutputKeys>>
/**
 * Merges custom resolvers with defaults (PluginFactoryOptions-based)
 * Custom resolvers have higher priority (come first in array)
 */
export function mergeResolvers<TOptions extends PluginFactoryOptions>(
  customResolvers: Array<Resolver<TOptions['outputKeys']>> | undefined,
  defaultResolvers: Array<Resolver<TOptions['outputKeys']>>,
): Array<Resolver<TOptions['outputKeys']>>
export function mergeResolvers(customResolvers: Array<Resolver<any>> | undefined, defaultResolvers: Array<Resolver<any>>): Array<Resolver<any>> {
  return [...(customResolvers ?? []), ...defaultResolvers]
}

/**
 * Executes resolvers and returns first matching resolution (string-based output keys)
 * Resolvers are executed in order until one matches (or all are tried)
 */
export function executeResolvers<TOutputKeys extends string>(
  resolvers: Array<Resolver<TOutputKeys>>,
  ctx: ResolverContext,
  config: Config,
): Resolution<TOutputKeys> | null
/**
 * Executes resolvers and returns first matching resolution (PluginFactoryOptions-based)
 * Resolvers are executed in order until one matches (or all are tried)
 */
export function executeResolvers<TOptions extends PluginFactoryOptions>(
  resolvers: Array<Resolver<TOptions['outputKeys']>>,
  ctx: ResolverContext,
  config: Config,
): Resolution<TOptions['outputKeys']> | null
export function executeResolvers(resolvers: Array<Resolver<any>>, ctx: ResolverContext, config: Config): Resolution<any> | null {
  for (const resolver of resolvers) {
    // Skip if matcher exists and returns false
    if (resolver.match && !resolver.match(ctx)) {
      continue
    }
    return resolver.resolve(ctx, config)
  }
  return null
}
