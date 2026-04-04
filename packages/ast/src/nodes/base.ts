/**
 * `kind` values used by AST nodes.
 *
 * @example
 * ```ts
 * const kind: NodeKind = 'Schema'
 * ```
 */
export type NodeKind =
  | 'Root'
  | 'Operation'
  | 'Schema'
  | 'Property'
  | 'Parameter'
  | 'Response'
  | 'FunctionParameter'
  | 'ParameterGroup'
  | 'FunctionParameters'
  | 'Type'
  | 'File'
  | 'Import'
  | 'Export'
  | 'Source'

/**
 * Base shape shared by all AST nodes.
 *
 * @example
 * ```ts
 * const base: BaseNode = { kind: 'Root' }
 * ```
 */
export type BaseNode = {
  /**
   * Node discriminator.
   */
  kind: NodeKind
}

/**
 * Minimal node type when only `kind` is needed.
 *
 * @example
 * ```ts
 * const node: Node = { kind: 'Operation' }
 * ```
 */
export type Node = BaseNode
