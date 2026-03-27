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

/** Named type for a group of parameters (query or header) emitted as a single typed parameter. */
export type ParamGroupType = {
  /** TypeScript type string, e.g. `'FindPetsQueryParams'`. */
  type: string
  /** Whether the parameter group is optional. */
  optional: boolean
}

/**
 * Resolver interface for {@link createOperationParams}.
 *
 * `ResolverTs` from `@kubb/plugin-ts` satisfies this interface and can be passed directly.
 *
 * @example
 * resolver.resolveParamName(node, param) // → 'DeletePetPathPetId'
 * resolver.resolvePathParamsName(node, param) // → 'DeletePetPathParams' (legacy) or 'DeletePetPathPetId' (default)
 */
export type OperationParamsResolver = {
  /**
   * Resolves the TypeScript type name for an individual parameter.
   * @example
   * resolver.resolveParamName(node, param) // → 'DeletePetPathPetId'
   */
  resolveParamName(node: OperationNode, param: ParameterNode): string
  /**
   * Resolves the request body type name.
   * @example
   * resolver.resolveDataName(node) // → 'CreatePetData'
   */
  resolveDataName(node: OperationNode): string
  /**
   * Resolves the grouped path parameters type name.
   * When equal to `resolveParamName`, no indexed access is emitted.
   * @example
   * resolver.resolvePathParamsName(node, param) // → 'DeletePetPathParams'
   */
  resolvePathParamsName(node: OperationNode, param: ParameterNode): string
  /**
   * Resolves the grouped query parameters type name.
   * When equal to `resolveParamName`, falls back to inline object type.
   * @example
   * resolver.resolveQueryParamsName(node, param) // → 'FindPetsByStatusQueryParams'
   */
  resolveQueryParamsName(node: OperationNode, param: ParameterNode): string
  /**
   * Resolves the grouped header parameters type name.
   * When equal to `resolveParamName`, falls back to inline object type.
   * @example
   * resolver.resolveHeaderParamsName(node, param) // → 'DeletePetHeaderParams'
   */
  resolveHeaderParamsName(node: OperationNode, param: ParameterNode): string
}

/**
 * Options for {@link createOperationParams}.
 */
export type CreateOperationParamsOptions = {
  /**
   * How all operation parameters are grouped in the function signature.
   * - `'object'` wraps all params into a single destructured object `{ petId, data, params }`
   * - `'inline'` emits each param category as a separate top-level parameter
   */
  paramsType: 'object' | 'inline'
  /**
   * How path parameters are emitted when `paramsType` is `'inline'`.
   * - `'object'` groups them as `{ petId, storeId }: PathParams`
   * - `'inline'` spreads them as individual parameters `petId: string, storeId: string`
   */
  pathParamsType: 'object' | 'inline'
  /**
   * Converts parameter names to camelCase before output.
   * @default undefined
   */
  paramsCasing?: 'camelcase'
  /**
   * Resolver for parameter and request body type names.
   * Pass `ResolverTs` from `@kubb/plugin-ts` directly.
   * When omitted, falls back to the schema primitive or `'unknown'`.
   * @example
   * resolver: tsResolver
   */
  resolver?: OperationParamsResolver
  /**
   * Default value for the path parameters binding when `pathParamsType` is `'object'`.
   * Falls back to `'{}'` when all path params are optional.
   * @example
   * pathParamsDefault: '{}'
   */
  pathParamsDefault?: string
  /**
   * Extra parameters appended after the standard operation parameters.
   * @example
   * extraParams: [createFunctionParameter({ name: 'options', type: 'Partial<RequestOptions>', default: '{}' })]
   */
  extraParams?: Array<FunctionParameterNode | ObjectBindingParameterNode>
}

/** Builds a {@link FunctionParameterNode} from `required` (maps to `!optional`). */
function toFunctionParam({ name, type, required }: { name: string; type: string; required: boolean }): FunctionParameterNode {
  return createFunctionParameter({ name, type, optional: !required })
}

function resolveType({ node, param, resolver }: { node: OperationNode; param: ParameterNode; resolver: OperationParamsResolver | undefined }): string {
  if (!resolver) {
    return param.schema.primitive ?? 'unknown'
  }

  const individualName = resolver.resolveParamName(node, param)

  const groupName =
    param.in === 'path'
      ? resolver.resolvePathParamsName(node, param)
      : param.in === 'query'
        ? resolver.resolveQueryParamsName(node, param)
        : param.in === 'header'
          ? resolver.resolveHeaderParamsName(node, param)
          : undefined

  if (groupName && groupName !== individualName) {
    return `${groupName}['${param.name}']`
  }

  return individualName
}

/**
 * Converts an {@link OperationNode} into a {@link FunctionParametersNode}.
 *
 * Centralises the per-plugin `getParams()` pattern. Provide a `resolver` for
 * type resolution and `extraParams` for plugin-specific trailing parameters.
 *
 * @example
 * const params = createOperationParams(node, {
 *   paramsType: 'inline',
 *   pathParamsType: 'inline',
 *   resolver: tsResolver,
 *   extraParams: [createFunctionParameter({ name: 'options', type: 'Partial<RequestOptions>', default: '{}' })],
 * })
 */
export function createOperationParams(node: OperationNode, options: CreateOperationParamsOptions): FunctionParametersNode {
  const { paramsType, pathParamsType, paramsCasing, resolver, pathParamsDefault, extraParams = [] } = options

  const casedParams = caseParams(node.parameters, paramsCasing)

  const pathParams = casedParams.filter((p) => p.in === 'path')
  const queryParams = casedParams.filter((p) => p.in === 'query')
  const headerParams = casedParams.filter((p) => p.in === 'header')

  const bodyType = node.requestBody?.schema ? (resolver?.resolveDataName(node) ?? 'unknown') : undefined
  const bodyRequired = node.requestBody?.required ?? false

  // Derive group types from resolver when available
  const queryGroupType = resolver ? resolveGroupType({ node, params: queryParams, groupMethod: resolver.resolveQueryParamsName, resolver }) : undefined
  const headerGroupType = resolver ? resolveGroupType({ node, params: headerParams, groupMethod: resolver.resolveHeaderParamsName, resolver }) : undefined

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
 * Derives a {@link ParamGroupType} from the resolver's group method.
 * Returns `undefined` when the group name equals the individual param name (no real group).
 */
function resolveGroupType({ node, params, groupMethod, resolver }: {
  node: OperationNode
  params: Array<ParameterNode>
  groupMethod: (node: OperationNode, param: ParameterNode) => string
  resolver: OperationParamsResolver
}): ParamGroupType | undefined {
  if (!params.length) {
    return undefined
  }
  const firstParam = params[0]!
  const groupName = groupMethod.call(resolver, node, firstParam)
  if (groupName === resolver.resolveParamName(node, firstParam)) {
    return undefined
  }
  const allOptional = params.every((p) => !p.required)
  return { type: groupName, optional: allOptional }
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

/** `paramsType: 'object'` — wraps all operation params into a single destructured object. */
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
    children.push(toFunctionParam({ name: p.name, type: resolveType({ node, param: p, resolver }), required: p.required }))
  }

  if (bodyType) {
    children.push(toFunctionParam({ name: 'data', type: bodyType, required: bodyRequired }))
  }

  appendGroupOrInline({ target: children, name: 'params', node, params: queryParams, groupType: queryGroupType, resolver })
  appendGroupOrInline({ target: children, name: 'headers', node, params: headerParams, groupType: headerGroupType, resolver })

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

/** `paramsType: 'inline'` — each param category is a separate top-level parameter. */
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
    const pathChildren = pathParams.map((p) => toFunctionParam({ name: p.name, type: resolveType({ node, param: p, resolver }), required: p.required }))
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
    params.push(toFunctionParam({ name: 'data', type: bodyType, required: bodyRequired }))
  }

  if (queryGroupType) {
    params.push(toFunctionParam({ name: 'params', type: queryGroupType.type, required: !queryGroupType.optional }))
  } else if (queryParams.length) {
    params.push(toFunctionParam({ name: 'params', type: toInlineObjectType({ node, params: queryParams, resolver }), required: !queryParams.every((p) => !p.required) }))
  }

  if (headerGroupType) {
    params.push(toFunctionParam({ name: 'headers', type: headerGroupType.type, required: !headerGroupType.optional }))
  } else if (headerParams.length) {
    params.push(toFunctionParam({ name: 'headers', type: toInlineObjectType({ node, params: headerParams, resolver }), required: !headerParams.every((p) => !p.required) }))
  }

  params.push(...extraParams)

  return createFunctionParameters({ params })
}

/** Appends a group param (named type) or individual inline params to `target`. */
function appendGroupOrInline({ target, name, node, params, groupType, resolver }: {
  target: Array<FunctionParameterNode>
  name: string
  node: OperationNode
  params: Array<ParameterNode>
  groupType: ParamGroupType | undefined
  resolver: OperationParamsResolver | undefined
}): void {
  if (groupType) {
    target.push(toFunctionParam({ name, type: groupType.type, required: !groupType.optional }))
  } else if (params.length) {
    target.push(toFunctionParam({ name, type: toInlineObjectType({ node, params, resolver }), required: !params.every((p) => !p.required) }))
  }
}

/**
 * Builds an inline object type string.
 * @example toInlineObjectType(...) // → '{ petId: string; name?: string }'
 */
function toInlineObjectType({ node, params, resolver }: { node: OperationNode; params: Array<ParameterNode>; resolver: OperationParamsResolver | undefined }): string {
  const parts = params.map((p) => `${p.name}${!p.required ? '?' : ''}: ${resolveType({ node, param: p, resolver })}`)
  return `{ ${parts.join('; ')} }`
}
