import type { BaseNode } from './base.ts'
import type { OperationNode } from './operation.ts'
import type { SchemaNode } from './schema.ts'

/**
 * Top-level container for all schemas and operations in a single API document.
 */
export interface RootNode extends BaseNode {
  kind: 'Root'
  schemas: Array<SchemaNode>
  operations: Array<OperationNode>
}
