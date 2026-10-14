/**
 * `kind` values used by AST nodes.
 *
 * @example
 * ```ts
 * const kind: NodeKind = 'Schema'
 * ```
 */
export type NodeKind =
  | 'Input'
  | 'Operation'
  | 'Schema'
  | 'Property'
  | 'Parameter'
  | 'Response'
  | 'RequestBody'
  | 'Content'
  | 'Type'
  | 'File'
  | 'Import'
  | 'Export'
  | 'Source'
  | 'Const'
  | 'Function'
  | 'ArrowFunction'
  | 'Text'
  | 'Break'
  | 'Jsx'

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
