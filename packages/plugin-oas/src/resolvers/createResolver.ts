import type { Resolution, Resolver, ResolverContext } from './types.ts'

/**
 * Creates a typed resolver
 * @typeParam TOutputKeys - String literal union of output keys
 */
export function createResolver<TOutputKeys extends string>(resolver: Resolver<TOutputKeys>): Resolver<TOutputKeys> {
  return resolver
}

/**
 * Merges custom resolvers with defaults
 * Custom resolvers have higher priority (come first in array)
 * @typeParam TOutputKeys - String literal union of output keys
 */
export function mergeResolvers<TOutputKeys extends string>(
  customResolvers: Array<Resolver<TOutputKeys>> | undefined,
  defaultResolvers: Array<Resolver<TOutputKeys>>,
): Array<Resolver<TOutputKeys>> {
  return [...(customResolvers ?? []), ...defaultResolvers]
}

/**
 * Executes resolvers and returns first matching resolution
 * Resolvers are executed in order until one matches (or all are tried)
 * @typeParam TOutputKeys - String literal union of output keys
 */
export function executeResolvers<TOutputKeys extends string>(resolvers: Array<Resolver<TOutputKeys>>, ctx: ResolverContext): Resolution<TOutputKeys> | null {
  for (const resolver of resolvers) {
    // Skip if matcher exists and returns false
    if (resolver.match && !resolver.match(ctx)) {
      continue
    }
    return resolver.resolve(ctx)
  }
  return null
}
