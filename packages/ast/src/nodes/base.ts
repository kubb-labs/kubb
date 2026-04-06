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
  | 'Output'
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
  | 'Const'
  | 'TypeDeclaration'
  | 'FunctionDeclaration'
  | 'ArrowFunctionDeclaration'

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

/**
 * Minimal node type when only `kind` is needed.
 *
 * @example
 * ```ts
 * const node: Node = { kind: 'Operation' }
 * ```
 */
export type Node = BaseNode
