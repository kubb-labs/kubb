import type { BaseNode } from './base.ts'
import type { OperationNode } from './operation.ts'
import type { SchemaNode } from './schema.ts'

/**
 * The root of the Kubb AST tree.
 *
 * A `RootNode` is the top-level container produced by a parser (e.g.
 * `plugin-oas`) from a single API specification document. It holds all
 * reusable named schemas and all operations discovered in that document.
 */
export interface RootNode extends BaseNode {
  kind: 'Root'
  /** Named / reusable schemas (e.g. `#/components/schemas/*`). */
  schemas: Array<SchemaNode>
  /** All API operations discovered in the specification. */
  operations: Array<OperationNode>
}
