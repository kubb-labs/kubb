import type { nodeKinds } from '../constants.ts'

/**
 * `kind` values used by AST nodes.
 *
 * @example
 * ```ts
 * const kind: NodeKind = 'Schema'
 * ```
 */
export type NodeKind = (typeof nodeKinds)[keyof typeof nodeKinds]

/**
 * Base shape shared by all AST nodes.
 *
 * @example
 * ```ts
 * const base: BaseNode = { kind: 'Input' }
 * ```
 */
export type BaseNode = {
  /**
   * Node discriminator.
   */
  kind: NodeKind
  /**
   * Where the node comes from in the input, in the form the adapter's `locate` reads. Document
   * adapters such as OpenAPI and AsyncAPI use an RFC 6901 JSON pointer, for example
   * `#/components/schemas/Pet`. Plugins can copy it to the code nodes they emit.
   */
  pointer?: string
}

/** `Omit` applied to each member of a union, so the union survives. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/** Builds a `createX` factory for a node whose only computed field is `kind`. */
export function nodeFactory<T extends BaseNode>(kind: T['kind']): (input: Omit<T, 'kind'>) => T {
  return (input) => {
    const node = { ...input, kind }
    return node as T
  }
}
