import type { InferSchemaNode } from './infer.ts'
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
 * Distributive `Omit` that preserves each member of a union.
 *
 * @example
 * ```ts
 * type A = { kind: 'a'; keep: string; drop: number }
 * type B = { kind: 'b'; keep: boolean; drop: number }
 * type Result = DistributiveOmit<A | B, 'drop'>
 * // -> { kind: 'a'; keep: string } | { kind: 'b'; keep: boolean }
 * ```
 */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

type CreateSchemaObjectInput = Omit<ObjectSchemaNode, 'kind' | 'properties'> & { properties?: Array<PropertyNode> }
type CreateSchemaInput = CreateSchemaObjectInput | DistributiveOmit<Exclude<SchemaNode, ObjectSchemaNode>, 'kind'>
type CreateSchemaOutput<T extends CreateSchemaInput> = InferSchemaNode<T> & { kind: 'Schema' }

/**
 * Creates a `RootNode` with stable defaults for `schemas` and `operations`.
 *
 * @example
 * ```ts
 * const root = createRoot()
 * // { kind: 'Root', schemas: [], operations: [] }
 * ```
 *
 * @example
 * ```ts
 * const root = createRoot({ schemas: [petSchema] })
 * // keeps default operations: []
 * ```
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
 * Creates an `OperationNode` with default empty arrays for `tags`, `parameters`, and `responses`.
 *
 * @example
 * ```ts
 * const operation = createOperation({
 *   operationId: 'getPetById',
 *   method: 'GET',
 *   path: '/pet/{petId}',
 * })
 * // tags, parameters, and responses are []
 * ```
 *
 * @example
 * ```ts
 * const operation = createOperation({
 *   operationId: 'findPets',
 *   method: 'GET',
 *   path: '/pet/findByStatus',
 *   tags: ['pet'],
 * })
 * ```
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
 * For object schemas, `properties` defaults to an empty array.
 *
 * @example
 * ```ts
 * const scalar = createSchema({ type: 'string' })
 * // { kind: 'Schema', type: 'string' }
 * ```
 *
 * @example
 * ```ts
 * const object = createSchema({ type: 'object' })
 * // { kind: 'Schema', type: 'object', properties: [] }
 * ```
 *
 * @example
 * ```ts
 * const enumSchema = createSchema({
 *   type: 'enum',
 *   primitive: 'string',
 *   enumValues: ['available', 'pending'],
 * })
 * ```
 */
export function createSchema<T extends CreateSchemaInput>(props: T): CreateSchemaOutput<T>
export function createSchema(props: CreateSchemaInput): SchemaNode
export function createSchema(props: CreateSchemaInput): SchemaNode {
  if (props['type'] === 'object') {
    return { properties: [], ...props, kind: 'Schema' } as CreateSchemaOutput<typeof props>
  }

  return { ...props, kind: 'Schema' } as CreateSchemaOutput<typeof props>
}

/**
 * Syncs property optionality flags from `required` and `schema.nullable`.
 *
 * This keeps `PropertyNode.required` as the main source and sets:
 * - `optional` for non-required, non-nullable properties
 * - `nullish` for non-required, nullable properties
 *
 * @example
 * ```ts
 * syncPropertySchema(false, createSchema({ type: 'string' }))
 * // -> optional: true
 * ```
 *
 * @example
 * ```ts
 * syncPropertySchema(false, createSchema({ type: 'string', nullable: true }))
 * // -> nullish: true
 * ```
 */
export function syncPropertySchema(required: boolean, schema: SchemaNode): SchemaNode {
  const nullable = schema.nullable ?? false

  return {
    ...schema,
    optional: !required && !nullable ? true : undefined,
    nullish: !required && nullable ? true : undefined,
  }
}

/**
 * Creates a `PropertyNode`.
 *
 * `required` defaults to `false`.
 * `schema.optional` and `schema.nullish` are derived from `required` and `schema.nullable`.
 *
 * @example
 * ```ts
 * const property = createProperty({
 *   name: 'status',
 *   schema: createSchema({ type: 'string' }),
 * })
 * // required=false, schema.optional=true
 * ```
 *
 * @example
 * ```ts
 * const property = createProperty({
 *   name: 'status',
 *   required: true,
 *   schema: createSchema({ type: 'string', nullable: true }),
 * })
 * // required=true, no optional/nullish
 * ```
 */
export function createProperty(props: Pick<PropertyNode, 'name' | 'schema'> & Partial<Omit<PropertyNode, 'kind' | 'name' | 'schema'>>): PropertyNode {
  const required = props.required ?? false

  return {
    ...props,
    kind: 'Property',
    required,
    schema: syncPropertySchema(required, props.schema),
  }
}

/**
 * Creates a `ParameterNode`.
 *
 * `required` defaults to `false`.
 * Nested schema flags are set from `required` and `schema.nullable`.
 *
 * @example
 * ```ts
 * const param = createParameter({
 *   name: 'petId',
 *   in: 'path',
 *   required: true,
 *   schema: createSchema({ type: 'string' }),
 * })
 * ```
 *
 * @example
 * ```ts
 * const param = createParameter({
 *   name: 'status',
 *   in: 'query',
 *   schema: createSchema({ type: 'string', nullable: true }),
 * })
 * // required=false, schema.nullish=true
 * ```
 */
export function createParameter(
  props: Pick<ParameterNode, 'name' | 'in' | 'schema'> & Partial<Omit<ParameterNode, 'kind' | 'name' | 'in' | 'schema'>>,
): ParameterNode {
  const required = props.required ?? false
  return {
    ...props,
    kind: 'Parameter',
    required,
    schema: syncPropertySchema(required, props.schema),
  }
}

/**
 * Creates a `ResponseNode`.
 *
 * @example
 * ```ts
 * const response = createResponse({
 *   statusCode: '200',
 *   description: 'Success',
 *   schema: createSchema({ type: 'object', properties: [] }),
 * })
 * ```
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
 * Creates a `FunctionParameterNode`.
 *
 * `optional` defaults to `false`.
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
 * @example Param with default (implicitly optional; cannot combine with `optional: true`)
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
 * Creates an `ObjectBindingParameterNode` for object-destructured parameter groups.
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
 * @example Inline mode — children emitted as individual top-level parameters
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
 * Creates a `FunctionParametersNode` from an ordered list of parameters.
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
 *
 * @example
 * ```ts
 * const empty = createFunctionParameters()
 * // { kind: 'FunctionParameters', params: [] }
 * ```
 */
export function createFunctionParameters(props: Partial<Omit<FunctionParametersNode, 'kind'>> = {}): FunctionParametersNode {
  return {
    params: [],
    ...props,
    kind: 'FunctionParameters',
  }
}
