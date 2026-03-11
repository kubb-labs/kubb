import type { Node, NodeKind } from './nodes/base.ts'
import type { OperationNode } from './nodes/operation.ts'
import type { ParameterNode } from './nodes/parameter.ts'
import type { PropertyNode } from './nodes/property.ts'
import type { ResponseNode } from './nodes/response.ts'
import type { RootNode } from './nodes/root.ts'
import type { SchemaNode } from './nodes/schema.ts'

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
