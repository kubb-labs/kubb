/**
 * Kind discriminant for every AST node.
 */
export type NodeKind = 'Root' | 'Operation' | 'Schema' | 'Property' | 'Parameter' | 'Response' | 'FunctionParameter' | 'ObjectBindingParameter' | 'FunctionParameters'

/**
 * Common base for all AST nodes.
 */
export type BaseNode = {
  kind: NodeKind
}

/**
 * Any AST node.
 */
export type Node = BaseNode
