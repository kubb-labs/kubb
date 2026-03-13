import type { Node, NodeKind, OperationNode, ParameterNode, PropertyNode, ResponseNode, RootNode, SchemaNode, SchemaNodeByType } from './nodes/index.ts'

/**
 * Narrows a `SchemaNode` to the specific variant matching `type`.
 */
export function narrowSchema<T extends SchemaNode['type']>(node: SchemaNode | undefined, type: T): SchemaNodeByType[T] | undefined {
  return node?.type === type ? (node as SchemaNodeByType[T]) : undefined
}

function isKind<T extends Node>(kind: NodeKind) {
  return (node: Node): node is T => node.kind === kind
}

/**
 * Type guard for `RootNode`.
 */
export const isRootNode = isKind<RootNode>('Root')

/**
 * Type guard for `OperationNode`.
 */
export const isOperationNode = isKind<OperationNode>('Operation')

/**
 * Type guard for `SchemaNode`.
 */
export const isSchemaNode = isKind<SchemaNode>('Schema')

/**
 * Type guard for `PropertyNode`.
 */
export const isPropertyNode = isKind<PropertyNode>('Property')

/**
 * Type guard for `ParameterNode`.
 */
export const isParameterNode = isKind<ParameterNode>('Parameter')

/**
 * Type guard for `ResponseNode`.
 */
export const isResponseNode = isKind<ResponseNode>('Response')
