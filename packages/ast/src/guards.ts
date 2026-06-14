import type { HttpOperationNode, OperationNode, SchemaNode, SchemaNodeByType } from './nodes/index.ts'

/**
 * Narrows a `SchemaNode` to the variant that matches `type`.
 *
 * @example
 * ```ts
 * const schema = createSchema({ type: 'string' })
 * const stringNode = narrowSchema(schema, 'string') // StringSchemaNode | null
 * ```
 */
export function narrowSchema<T extends SchemaNode['type']>(node: SchemaNode | undefined, type: T): SchemaNodeByType[T] | null {
  return node?.type === type ? (node as SchemaNodeByType[T]) : null
}

/**
 * Narrows an `OperationNode` to an `HttpOperationNode` so `method` and `path` are present.
 *
 * @example
 * ```ts
 * if (isHttpOperationNode(node)) {
 *   console.log(node.method, node.path)
 * }
 * ```
 */
export function isHttpOperationNode(node: OperationNode): node is HttpOperationNode {
  return node.protocol === 'http' || (node.method !== undefined && node.path !== undefined)
}
