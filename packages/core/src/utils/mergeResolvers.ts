import type { Resolver } from '../types.ts'

/**
 * Merges an ordered list of resolvers into a single resolver by shallow-merging each entry left to right.
 *
 * Later entries win when keys conflict, so the last resolver in the list takes highest precedence.
 *
 * @example
 * ```ts
 * const resolver = mergeResolvers(resolverTs, resolverTsLegacy)
 * // resolverTsLegacy methods override resolverTs where they overlap
 * ```
 */
export function mergeResolvers<T extends Resolver>(...resolvers: Array<T>): T {
  return resolvers.reduce<T>((acc, curr) => ({ ...acc, ...curr }), resolvers[0]!)
}
