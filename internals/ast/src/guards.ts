import type { Node, NodeKind } from './nodes/base.ts'
import type { OperationNode } from './nodes/operation.ts'
import type { ParameterNode } from './nodes/parameter.ts'
import type { PropertyNode } from './nodes/property.ts'
import type { ResponseNode } from './nodes/response.ts'
import type { RootNode } from './nodes/root.ts'
import type { SchemaNode, SchemaNodeByType } from './nodes/schema.ts'

/**
 * Narrows a `SchemaNode` (or `undefined`) to a specific variant by matching its `type`.
 * Returns the narrowed node when it matches, or `undefined` otherwise.
 *
 * @example
 * const obj = narrowSchema(node, 'object')  // ObjectSchemaNode | undefined
 * const union = narrowSchema(node, 'union') // UnionSchemaNode | undefined
 */
export function narrowSchema<T extends SchemaNode['type']>(node: SchemaNode | undefined, type: T): SchemaNodeByType[T] | undefined {
  return node?.type === type ? (node as SchemaNodeByType[T]) : undefined
}

function isKind<T extends Node>(kind: NodeKind) {
  return (node: Node): node is T => node.kind === kind
}

/** Returns `true` when `node` is a `RootNode`. */
export const isRootNode = isKind<RootNode>('Root')

/** Returns `true` when `node` is an `OperationNode`. */
export const isOperationNode = isKind<OperationNode>('Operation')

/** Returns `true` when `node` is a `SchemaNode`. */
export const isSchemaNode = isKind<SchemaNode>('Schema')

/** Returns `true` when `node` is a `PropertyNode`. */
export const isPropertyNode = isKind<PropertyNode>('Property')

/** Returns `true` when `node` is a `ParameterNode`. */
export const isParameterNode = isKind<ParameterNode>('Parameter')

/** Returns `true` when `node` is a `ResponseNode`. */
export const isResponseNode = isKind<ResponseNode>('Response')
