import type {
  FunctionParameterNode,
  FunctionParametersNode,
  ObjectBindingParameterNode,
  ObjectSchemaNode,
  OperationNode,
  ParameterNode,
  PropertyNode,
  ResponseNode,
  RootNode,
  SchemaNode,
} from './nodes/index.ts'

/**
 * Distributive variant of `Omit` that preserves union members.
 */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/**
 * Creates a `RootNode`.
 */
export function createRoot(overrides: Partial<Omit<RootNode, 'kind'>> = {}): RootNode {
  return {
    schemas: [],
    operations: [],
    ...overrides,
    kind: 'Root',
  }
}

/**
 * Creates an `OperationNode`.
 */
export function createOperation(
  props: Pick<OperationNode, 'operationId' | 'method' | 'path'> & Partial<Omit<OperationNode, 'kind' | 'operationId' | 'method' | 'path'>>,
): OperationNode {
  return {
    tags: [],
    parameters: [],
    responses: [],
    ...props,
    kind: 'Operation',
  }
}

/**
 * Creates a `SchemaNode`, narrowed to the variant of `props.type`.
 * For object schemas, `properties` defaults to `[]` when not provided.
 */
export function createSchema<T extends Omit<ObjectSchemaNode, 'kind' | 'properties'> & { properties?: Array<PropertyNode> }>(
  props: T,
): Omit<T, 'properties'> & { properties: Array<PropertyNode>; kind: 'Schema' }
export function createSchema<T extends DistributiveOmit<Exclude<SchemaNode, ObjectSchemaNode>, 'kind'>>(props: T): T & { kind: 'Schema' }
export function createSchema(props: DistributiveOmit<SchemaNode, 'kind'>): SchemaNode
export function createSchema(props: Record<string, unknown>): Record<string, unknown> {
  if (props['type'] === 'object') {
    return { properties: [], ...props, kind: 'Schema' }
  }

  return { ...props, kind: 'Schema' }
}

/**
 * Creates a `PropertyNode`. `required` defaults to `false`.
 */
export function createProperty(props: Pick<PropertyNode, 'name' | 'schema'> & Partial<Omit<PropertyNode, 'kind' | 'name' | 'schema'>>): PropertyNode {
  return {
    required: false,
    ...props,
    kind: 'Property',
  }
}

/**
 * Creates a `ParameterNode`. `required` defaults to `false`.
 */
export function createParameter(
  props: Pick<ParameterNode, 'name' | 'in' | 'schema'> & Partial<Omit<ParameterNode, 'kind' | 'name' | 'in' | 'schema'>>,
): ParameterNode {
  return {
    required: false,
    ...props,
    kind: 'Parameter',
  }
}

/**
 * Creates a `ResponseNode`.
 */
export function createResponse(
  props: Pick<ResponseNode, 'statusCode' | 'schema'> & Partial<Omit<ResponseNode, 'kind' | 'statusCode' | 'schema'>>,
): ResponseNode {
  return {
    ...props,
    kind: 'Response',
  }
}

/**
 * Creates a `FunctionParameterNode`. `optional` defaults to `false`.
 *
 * @example Required typed param
 * ```ts
 * createFunctionParameter({ name: 'petId', type: 'string' })
 * // → petId: string
 * ```
 *
 * @example Optional param
 * ```ts
 * createFunctionParameter({ name: 'params', type: 'QueryParams', optional: true })
 * // → params?: QueryParams
 * ```
 *
 * @example Param with default (implicitly optional — cannot combine with `optional: true`)
 * ```ts
 * createFunctionParameter({ name: 'config', type: 'RequestConfig', default: '{}' })
 * // → config: RequestConfig = {}
 * ```
 */
export function createFunctionParameter(
  props: { name: string; type?: string; rest?: boolean } & ({ optional: true; default?: never } | { optional?: false; default?: string }),
): FunctionParameterNode {
  return {
    optional: false,
    ...props,
    kind: 'FunctionParameter',
  } as FunctionParameterNode
}

/**
 * Creates an `ObjectBindingParameterNode` — an object-destructured parameter group.
 *
 * @example Destructured object param
 * ```ts
 * createObjectBindingParameter({
 *   properties: [
 *     createFunctionParameter({ name: 'id', type: 'string', optional: false }),
 *     createFunctionParameter({ name: 'name', type: 'string', optional: true }),
 *   ],
 *   default: '{}',
 * })
 * // declaration → { id, name? }: { id: string; name?: string } = {}
 * // call        → { id, name }
 * ```
 *
 * @example Inline — children emitted as individual top-level params
 * ```ts
 * createObjectBindingParameter({
 *   properties: [createFunctionParameter({ name: 'petId', type: 'string', optional: false })],
 *   inline: true,
 * })
 * // declaration → petId: string
 * // call        → petId
 * ```
 */
export function createObjectBindingParameter(
  props: Pick<ObjectBindingParameterNode, 'properties'> & Partial<Omit<ObjectBindingParameterNode, 'kind' | 'properties'>>,
): ObjectBindingParameterNode {
  return {
    ...props,
    kind: 'ObjectBindingParameter',
  }
}

/**
 * Creates a `FunctionParametersNode` from an ordered list of params.
 *
 * @example
 * ```ts
 * createFunctionParameters({
 *   params: [
 *     createFunctionParameter({ name: 'petId', type: 'string', optional: false }),
 *     createFunctionParameter({ name: 'config', type: 'RequestConfig', optional: false, default: '{}' }),
 *   ],
 * })
 * ```
 */
export function createFunctionParameters(props: Partial<Omit<FunctionParametersNode, 'kind'>> = {}): FunctionParametersNode {
  return {
    params: [],
    ...props,
    kind: 'FunctionParameters',
  }
}
