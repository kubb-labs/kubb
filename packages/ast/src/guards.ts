import type {
  FunctionParameterNode,
  FunctionParametersNode,
  Node,
  NodeKind,
  ParameterGroupNode,
  OperationNode,
  ParameterNode,
  PropertyNode,
  ResponseNode,
  RootNode,
  SchemaNode,
  SchemaNodeByType,
} from './nodes/index.ts'

/**
 * Narrows a `SchemaNode` to the variant that matches `type`.
 *
 * @example
 * ```ts
 * const schema = createSchema({ type: 'string' })
 * const stringNode = narrowSchema(schema, 'string') // StringSchemaNode | undefined
 * ```
 */
export function narrowSchema<T extends SchemaNode['type']>(node: SchemaNode | undefined, type: T): SchemaNodeByType[T] | undefined {
  return node?.type === type ? (node as SchemaNodeByType[T]) : undefined
}

function isKind<T extends Node>(kind: NodeKind) {
  return (node: unknown): node is T => (node as Node).kind === kind
}

/**
 * Returns `true` when the input is a `RootNode`.
 *
 * @example
 * ```ts
 * if (isRootNode(node)) {
 *   console.log(node.schemas.length)
 * }
 * ```
 */
export const isRootNode = isKind<RootNode>('Root')

/**
 * Returns `true` when the input is an `OperationNode`.
 *
 * @example
 * ```ts
 * if (isOperationNode(node)) {
 *   console.log(node.operationId)
 * }
 * ```
 */
export const isOperationNode = isKind<OperationNode>('Operation')

/**
 * Returns `true` when the input is a `SchemaNode`.
 *
 * @example
 * ```ts
 * if (isSchemaNode(node)) {
 *   console.log(node.type)
 * }
 * ```
 */
export const isSchemaNode = isKind<SchemaNode>('Schema')

/**
 * Returns `true` when the input is a `PropertyNode`.
 */
export const isPropertyNode = isKind<PropertyNode>('Property')

/**
 * Returns `true` when the input is a `ParameterNode`.
 */
export const isParameterNode = isKind<ParameterNode>('Parameter')

/**
 * Returns `true` when the input is a `ResponseNode`.
 */
export const isResponseNode = isKind<ResponseNode>('Response')

/**
 * Returns `true` when the input is a `FunctionParameterNode`.
 */
export const isFunctionParameterNode = isKind<FunctionParameterNode>('FunctionParameter')

/**
 * Returns `true` when the input is a `ParameterGroupNode`.
 */
export const isParameterGroupNode = isKind<ParameterGroupNode>('ParameterGroup')

/**
 * Returns `true` when the input is a `FunctionParametersNode`.
 */
export const isFunctionParametersNode = isKind<FunctionParametersNode>('FunctionParameters')
