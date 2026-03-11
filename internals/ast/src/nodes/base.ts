/**
 * The kind discriminant for every AST node.
 * Using a string union (not an enum) keeps the values tree-shakeable
 * and serialization-friendly.
 */
export type NodeKind = 'Root' | 'Operation' | 'Schema' | 'Property' | 'Parameter' | 'Response'

/**
 * Every AST node carries a `kind` discriminant so callers can narrow the
 * type without instanceof checks.
 */
export interface BaseNode {
  /** Discriminant used by visitors and type guards. */
  kind: NodeKind
}

/** Convenience alias for "any AST node". */
export type Node = BaseNode
