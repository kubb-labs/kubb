import type {
  FunctionParameterNode,
  FunctionParametersNode,
  Node,
  NodeKind,
  ObjectBindingParameterNode,
  OperationNode,
  ParameterNode,
  PropertyNode,
  ResponseNode,
  RootNode,
  SchemaNode,
  SchemaNodeByType,
} from './nodes/index.ts'

/**
 * Narrows a `SchemaNode` to the specific variant matching `type`.
 */
export function narrowSchema<T extends SchemaNode['type']>(node: SchemaNode | undefined, type: T): SchemaNodeByType[T] | undefined {
  return node?.type === type ? (node as SchemaNodeByType[T]) : undefined
}

function isKind<T extends Node>(kind: NodeKind) {
  return (node: unknown): node is T => (node as Node).kind === kind
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

/**
 * Type guard for `FunctionParameterNode`.
 */
export const isFunctionParameterNode = isKind<FunctionParameterNode>('FunctionParameter')

/**
 * Type guard for `ObjectBindingParameterNode`.
 */
export const isObjectBindingParameterNode = isKind<ObjectBindingParameterNode>('ObjectBindingParameter')

/**
 * Type guard for `FunctionParametersNode`.
 */
export const isFunctionParametersNode = isKind<FunctionParametersNode>('FunctionParameters')
