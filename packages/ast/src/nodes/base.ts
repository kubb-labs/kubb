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
  | 'RequestBody'
  | 'Content'
  | 'FunctionParameter'
  | 'FunctionParameters'
  | 'TypeLiteral'
  | 'IndexedAccessType'
  | 'ObjectBindingPattern'
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
  | 'Identifier'
  | 'Literal'
  | 'Member'
  | 'Call'
  | 'ObjectExpression'
  | 'ArrayExpression'
  | 'Arrow'
  | 'Spread'
  | 'As'
  | 'RawExpression'
  | 'TypeKeyword'
  | 'TypeReference'
  | 'TypeLiteralType'
  | 'TypeArray'
  | 'TypeUnion'
  | 'TypeIntersection'
  | 'TypeTuple'
  | 'TypeObject'
  | 'TypeUrlTemplate'
  | 'TypeOmit'

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
