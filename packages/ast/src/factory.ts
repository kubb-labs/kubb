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
import { caseParams, syncOptionality } from './utils.ts'

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
    schema: syncOptionality(props.schema, required),
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
    schema: syncOptionality(props.schema, required),
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
 * Creates a single-property object schema used as a discriminator literal.
 *
 * @example
 * ```ts
 * createDiscriminantNode({ propertyName: 'type', value: 'dog' })
 * // -> { type: 'object', properties: [{ name: 'type', required: true, schema: enum('dog') }] }
 * ```
 */
export function createDiscriminantNode({ propertyName, value }: { propertyName: string; value: string }): SchemaNode {
  return createSchema({
    type: 'object',
    primitive: 'object',
    properties: [
      createProperty({
        name: propertyName,
        schema: createSchema({
          type: 'enum',
          primitive: 'string',
          enumValues: [value],
        }),
        required: true,
      }),
    ],
  })
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

/**
 * A named type for a group of parameters (query or header).
 *
 * When provided, the group is emitted as a single typed parameter
 * instead of individual per-param inline types.
 */
export type ParamGroupType = {
  /**
   * The TypeScript type string, e.g. `'FindPetsQueryParams'`.
   */
  type: string
  /**
   * Whether the parameter is optional.
   */
  optional: boolean
}

/**
 * Minimal resolver interface for {@link createOperationParams}.
 *
 * `ResolverTs` from `@kubb/plugin-ts` satisfies this interface,
 * so it can be passed directly as `resolver`.
 */
export type OperationParamsResolver = {
  /** Resolves the TypeScript type for an individual parameter (e.g. `'DeletePetPathPetId'`). */
  resolveParamName(node: OperationNode, param: ParameterNode): string
  /** Resolves the request body type name (e.g. `'CreatePetData'`). */
  resolveDataName(node: OperationNode): string
  /** Resolves the grouped path parameters type name (e.g. `'DeletePetPathParams'`). */
  resolvePathParamsName(node: OperationNode, param: ParameterNode): string
  /** Resolves the grouped query parameters type name (e.g. `'FindPetsQueryParams'`). */
  resolveQueryParamsName(node: OperationNode, param: ParameterNode): string
  /** Resolves the grouped header parameters type name (e.g. `'DeletePetHeaderParams'`). */
  resolveHeaderParamsName(node: OperationNode, param: ParameterNode): string
}

/**
 * Options for {@link createOperationParams}.
 */
export type CreateOperationParamsOptions = {
  /**
   * How to group all parameters:
   * - `'object'` — wrap into a single destructured object `{ petId, data, params }: { … }`
   * - `'inline'` — emit each category as a separate top-level parameter
   */
  paramsType: 'object' | 'inline'
  /**
   * How to emit path parameters when `paramsType` is `'inline'`:
   * - `'object'` — group into `{ petId, storeId }: { petId: string; storeId: string }`
   * - `'inline'` — emit as individual top-level parameters `petId: string, storeId: string`
   */
  pathParamsType: 'object' | 'inline'
  /**
   * When `'camelcase'`, parameter names are converted to camelCase.
   */
  paramsCasing?: 'camelcase'
  /**
   * Resolver for parameter and request body types.
   *
   * `ResolverTs` from `@kubb/plugin-ts` can be passed directly.
   * When omitted, falls back to the parameter's schema primitive or `'unknown'`.
   *
   * @example
   * ```ts
   * resolver: tsResolver
   * ```
   */
  resolver?: OperationParamsResolver
  /**
   * Default value expression for the path parameters group.
   *
   * Only used when `pathParamsType` is `'object'`.
   * When omitted, defaults to `'{}'` if all path params are optional.
   */
  pathParamsDefault?: string
  /**
   * Additional parameters appended after the standard operation parameters.
   *
   * @example
   * ```ts
   * [createFunctionParameter({ name: 'options', type: 'Partial<RequestOptions>', default: '{}' })]
   * ```
   */
  extraParams?: Array<FunctionParameterNode | ObjectBindingParameterNode>
}

/**
 * Creates a {@link FunctionParameterNode} without type casts
 * by branching on the `required` discriminant.
 */
function toFunctionParam(name: string, type: string, required: boolean): FunctionParameterNode {
  if (required) {
    return { kind: 'FunctionParameter', name, type, optional: false }
  }
  return { kind: 'FunctionParameter', name, type, optional: true }
}

function resolveType(node: OperationNode, param: ParameterNode, resolver: OperationParamsResolver | undefined): string {
  if (!resolver) {
    return param.schema.primitive ?? 'unknown'
  }

  const groupResolver =
    param.in === 'path'
      ? resolver.resolvePathParamsName
      : param.in === 'query'
        ? resolver.resolveQueryParamsName
        : param.in === 'header'
          ? resolver.resolveHeaderParamsName
          : undefined

  if (groupResolver) {
    const groupName = groupResolver.call(resolver, node, param)
    return `${groupName}['${param.name}']`
  }

  return resolver.resolveParamName(node, param)
}

/**
 * Converts an {@link OperationNode} into a {@link FunctionParametersNode}.
 *
 * Centralises the per-plugin `getParams()` pattern into a single AST-level
 * converter. Callers supply a `resolver` for type resolution and
 * `extraParams` for plugin-specific trailing parameters.
 *
 * @example
 * ```ts
 * const params = createOperationParams(operationNode, {
 *   paramsType: 'inline',
 *   pathParamsType: 'inline',
 *   resolver: tsResolver,
 *   extraParams: [
 *     createFunctionParameter({ name: 'options', type: 'Partial<RequestOptions>', default: '{}' }),
 *   ],
 * })
 * ```
 */
export function createOperationParams(node: OperationNode, options: CreateOperationParamsOptions): FunctionParametersNode {
  const { paramsType, pathParamsType, paramsCasing, resolver, pathParamsDefault, extraParams = [] } = options

  const casedParams = caseParams(node.parameters, paramsCasing)

  const pathParams = casedParams.filter((p) => p.in === 'path')
  const queryParams = casedParams.filter((p) => p.in === 'query')
  const headerParams = casedParams.filter((p) => p.in === 'header')

  const bodyType = node.requestBody?.schema ? (resolver?.resolveDataName?.(node) ?? 'unknown') : undefined
  const bodyRequired = node.requestBody?.required ?? false

  // Derive group types from resolver when available
  const queryGroupType = resolveGroupType(node, queryParams, resolver?.resolveQueryParamsName, resolver)
  const headerGroupType = resolveGroupType(node, headerParams, resolver?.resolveHeaderParamsName, resolver)

  if (paramsType === 'object') {
    return collectObjectParams({
      node,
      pathParams,
      queryParams,
      headerParams,
      bodyType,
      bodyRequired,
      resolver,
      queryGroupType,
      headerGroupType,
      extraParams,
    })
  }

  return collectInlineParams({
    node,
    pathParams,
    queryParams,
    headerParams,
    pathParamsType,
    bodyType,
    bodyRequired,
    resolver,
    pathParamsDefault,
    queryGroupType,
    headerGroupType,
    extraParams,
  })
}

/**
 * Derives a {@link ParamGroupType} from the resolver's group method when available.
 */
function resolveGroupType(
  node: OperationNode,
  params: Array<ParameterNode>,
  groupMethod: ((node: OperationNode, param: ParameterNode) => string) | undefined,
  resolver: OperationParamsResolver | undefined,
): ParamGroupType | undefined {
  if (!groupMethod || !params.length || !resolver) {
    return undefined
  }
  const allOptional = params.every((p) => !p.required)
  return { type: groupMethod.call(resolver, node, params[0]!), optional: allOptional }
}

type CollectParamsContext = {
  node: OperationNode
  pathParams: Array<ParameterNode>
  queryParams: Array<ParameterNode>
  headerParams: Array<ParameterNode>
  bodyType: string | undefined
  bodyRequired: boolean
  resolver: OperationParamsResolver | undefined
  queryGroupType: ParamGroupType | undefined
  headerGroupType: ParamGroupType | undefined
  extraParams: Array<FunctionParameterNode | ObjectBindingParameterNode>
}

/**
 * `paramsType: 'object'` — wraps all operation params into a single destructured object.
 */
function collectObjectParams({
  node,
  pathParams,
  queryParams,
  headerParams,
  bodyType,
  bodyRequired,
  resolver,
  queryGroupType,
  headerGroupType,
  extraParams,
}: CollectParamsContext): FunctionParametersNode {
  const children: Array<FunctionParameterNode> = []

  for (const p of pathParams) {
    children.push(toFunctionParam(p.name, resolveType(node, p, resolver), p.required))
  }

  if (bodyType) {
    children.push(toFunctionParam('data', bodyType, bodyRequired))
  }

  appendGroupOrInline(children, 'params', node, queryParams, queryGroupType, resolver)
  appendGroupOrInline(children, 'headers', node, headerParams, headerGroupType, resolver)

  const allOptional = children.every((c) => c.optional)

  const params: Array<FunctionParameterNode | ObjectBindingParameterNode> = []

  if (children.length) {
    params.push(
      createObjectBindingParameter({
        properties: children,
        default: allOptional ? '{}' : undefined,
      }),
    )
  }

  params.push(...extraParams)

  return createFunctionParameters({ params })
}

type CollectInlineParamsContext = CollectParamsContext & {
  pathParamsType: 'object' | 'inline'
  pathParamsDefault: string | undefined
}

/**
 * `paramsType: 'inline'` — each param category is a separate top-level parameter.
 */
function collectInlineParams({
  node,
  pathParams,
  queryParams,
  headerParams,
  pathParamsType,
  bodyType,
  bodyRequired,
  resolver,
  pathParamsDefault,
  queryGroupType,
  headerGroupType,
  extraParams,
}: CollectInlineParamsContext): FunctionParametersNode {
  const params: Array<FunctionParameterNode | ObjectBindingParameterNode> = []

  if (pathParams.length) {
    const pathChildren = pathParams.map((p) => toFunctionParam(p.name, resolveType(node, p, resolver), p.required))
    const allPathOptional = pathChildren.every((c) => c.optional)
    const defaultValue = pathParamsDefault ?? (allPathOptional ? '{}' : undefined)

    params.push(
      createObjectBindingParameter({
        properties: pathChildren,
        inline: pathParamsType === 'inline',
        default: defaultValue,
      }),
    )
  }

  if (bodyType) {
    params.push(toFunctionParam('data', bodyType, bodyRequired))
  }

  if (queryGroupType) {
    params.push(toFunctionParam('params', queryGroupType.type, !queryGroupType.optional))
  } else if (queryParams.length) {
    params.push(toFunctionParam('params', toInlineObjectType(node, queryParams, resolver), !queryParams.every((p) => !p.required)))
  }

  if (headerGroupType) {
    params.push(toFunctionParam('headers', headerGroupType.type, !headerGroupType.optional))
  } else if (headerParams.length) {
    params.push(toFunctionParam('headers', toInlineObjectType(node, headerParams, resolver), !headerParams.every((p) => !p.required)))
  }

  params.push(...extraParams)

  return createFunctionParameters({ params })
}

/**
 * Appends a grouped param (named type) or individual inline params to `target`.
 */
function appendGroupOrInline(
  target: Array<FunctionParameterNode>,
  name: string,
  node: OperationNode,
  params: Array<ParameterNode>,
  groupType: ParamGroupType | undefined,
  resolver: OperationParamsResolver | undefined,
): void {
  if (groupType) {
    target.push(toFunctionParam(name, groupType.type, !groupType.optional))
  } else if (params.length) {
    target.push(toFunctionParam(name, toInlineObjectType(node, params, resolver), !params.every((p) => !p.required)))
  }
}

/**
 * Builds an inline object type string: `{ petId: string; name?: string }`.
 */
function toInlineObjectType(node: OperationNode, params: Array<ParameterNode>, resolver: OperationParamsResolver | undefined): string {
  const parts = params.map((p) => `${p.name}${!p.required ? '?' : ''}: ${resolveType(node, p, resolver)}`)
  return `{ ${parts.join('; ')} }`
}
