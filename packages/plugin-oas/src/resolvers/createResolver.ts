import type { Resolver, ResolverContext, Resolution } from './types.ts'

/**
 * Creates a typed resolver
 * This is a simple factory that provides type inference for the resolver
 *
 * @typeParam TOutputKeys - String literal union of output keys
 *
 * @example
 * ```ts
 * type MyOutputKeys = 'hook' | 'queryKey'
 *
 * const myResolver = createResolver<MyOutputKeys>({
 *   name: 'my-resolver',
 *   resolve: (ctx) => ({
 *     file: { baseName: `${ctx.operationId}.ts`, path: `hooks/${ctx.operationId}.ts` },
 *     outputs: {
 *       hook: { name: `use${ctx.operationId}` },
 *       queryKey: { name: `get${ctx.operationId}QueryKey` }
 *     }
 *   })
 * })
 * ```
 */
export function createResolver<TOutputKeys extends string>(
  resolver: Resolver<TOutputKeys>
): Resolver<TOutputKeys> {
  return resolver
}

/**
 * Merges custom resolvers with defaults
 * Custom resolvers have higher priority (run first)
 *
 * @typeParam TOutputKeys - String literal union of output keys
 */
export function mergeResolvers<TOutputKeys extends string>(
  customResolvers: Array<Resolver<TOutputKeys>> | undefined,
  defaultResolvers: Array<Resolver<TOutputKeys>>
): Array<Resolver<TOutputKeys>> {
  return [...(customResolvers ?? []), ...defaultResolvers]
}

/**
 * Executes resolvers and returns first matching resolution
 * Resolvers are tried in order; first one where match() returns true (or has no match) wins
 *
 * @typeParam TOutputKeys - String literal union of output keys
 * @returns Resolution from the first matching resolver, or null if none match
 */
export function executeResolvers<TOutputKeys extends string>(
  resolvers: Array<Resolver<TOutputKeys>>,
  ctx: ResolverContext
): Resolution<TOutputKeys> | null {
  for (const resolver of resolvers) {
    // If resolver has a match function and it returns false, skip this resolver
    if (resolver.match && !resolver.match(ctx)) {
      continue
    }
    // Resolver matches, return its resolution
    return resolver.resolve(ctx)
  }
  // No resolver matched
  return null
}

/**
 * Builds a ResolverContext from an operation
 * Extracts common fields for convenience
 */
export function buildResolverContext(
  oas: import('@kubb/oas').Oas,
  operation?: import('@kubb/oas').Operation,
  schema?: { name: string; value: import('@kubb/oas').SchemaObject }
): ResolverContext {
  if (operation) {
    return {
      operation,
      oas,
      operationId: operation.getOperationId(),
      tags: operation.getTags().map((t) => t.name),
      path: operation.path,
      method: operation.method,
    }
  }

  if (schema) {
    return {
      schema,
      oas,
    }
  }

  return { oas }
}
