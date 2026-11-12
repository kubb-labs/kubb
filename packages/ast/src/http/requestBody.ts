import type { OperationNode } from '../nodes/operation.ts'
import type { SchemaNode } from '../nodes/schema.ts'

/** The schema of the first request body entry, else `undefined` when the operation takes no body. */
export function getSchema(node: Pick<OperationNode, 'requestBody'>): SchemaNode | undefined {
  return node.requestBody?.content?.[0]?.schema
}
