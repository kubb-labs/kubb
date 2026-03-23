import type { Resolver } from '../types.ts'

/**
 * Merges an array of resolvers into a single resolver. Later entries override earlier ones (last wins).
 */
export function mergeResolvers<T extends Resolver>(...resolvers: Array<T>): T {
  return resolvers.reduce<T>((acc, curr) => ({ ...acc, ...curr }), resolvers[0]!)
}
