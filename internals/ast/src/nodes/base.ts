/**
 * Kind discriminant for every AST node.
 */
export type NodeKind = 'Root' | 'Operation' | 'Schema' | 'Property' | 'Parameter' | 'Response'

/**
 * Common base for all AST nodes.
 */
export interface BaseNode {
  kind: NodeKind
}

/**
 * Any AST node.
 */
export type Node = BaseNode
