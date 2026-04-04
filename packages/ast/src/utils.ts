import { camelCase, isValidVarName } from '@internals/utils'
import { sortBy, uniqueBy } from 'remeda'

import { createFunctionParameter, createFunctionParameters, createParameterGroup, createProperty, createSchema, createTypeNode } from './factory.ts'
import { narrowSchema } from './guards.ts'
import type { ExportNode, FunctionParameterNode, FunctionParametersNode, ImportNode, OperationNode, ParameterGroupNode, ParameterNode, SchemaNode, SourceNode, TypeNode } from './nodes/index.ts'
import type { SchemaType } from './nodes/schema.ts'

const plainStringTypes = new Set<SchemaType>(['string', 'uuid', 'email', 'url', 'datetime'] as const)

/**
 * Returns a merged schema view for a ref node, combining the resolved `node.schema`
 * (base from the referenced definition) with any usage-site sibling fields set directly
 * on the ref node (description, readOnly, nullable, deprecated, etc.).
 *
 * Usage-site fields take precedence over the resolved schema's own fields when both are defined.
 *
 * For non-ref nodes the node itself is returned unchanged.
 */
export function syncSchemaRef(node: SchemaNode): SchemaNode {
  const ref = narrowSchema(node, 'ref')

  if (!ref) return node
  if (!ref.schema) return node

  const { kind: _kind, type: _type, name: _name, ref: _ref, schema: _schema, ...overrides } = ref

  // Filter out undefined override values so they don't shadow the resolved schema's fields.
  const definedOverrides = Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== undefined))

  return createSchema({ ...ref.schema, ...definedOverrides })
}

/**
 * Returns `true` when a schema is emitted as a plain `string` type.
 *
 * - `string`, `uuid`, `email`, `url`, `datetime` are always plain strings.
 * - `date` and `time` are plain strings when their `representation` is `'string'` rather than `'date'`.
 *
 * @example
 * ```ts
 * isStringType(createSchema({ type: 'uuid' }))                          // true
 * isStringType(createSchema({ type: 'date', representation: 'date' }))  // false
 * ```
 */
export function isStringType(node: SchemaNode): boolean {
  if (plainStringTypes.has(node.type)) {
    return true
  }

  const temporal = narrowSchema(node, 'date') ?? narrowSchema(node, 'time')
  if (temporal) {
    return temporal.representation !== 'date'
  }

  return false
}

/**
 * Applies casing rules to parameter names and returns a new parameter array.
 *
 * The input array is not mutated.
 * If `casing` is not set, the original array is returned unchanged.
 *
 * Use this before passing parameters to schema builders so that property keys
 * in generated output match the desired casing while preserving
 * `OperationNode.parameters` for other consumers.
 *
 * @example
 * ```ts
 * const params = [createParameter({ name: 'pet_id', in: 'query', schema: createSchema({ type: 'string' }) })]
 * const cased = caseParams(params, 'camelcase')
 * // cased[0].name === 'petId'
 * ```
 */
export function caseParams(params: Array<ParameterNode>, casing: 'camelcase' | undefined): Array<ParameterNode> {
  if (!casing) {
    return params
  }

  return params.map((param) => {
    const transformed = casing === 'camelcase' || !isValidVarName(param.name) ? camelCase(param.name) : param.name

    return { ...param, name: transformed }
  })
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
 * Named type for a group of parameters (query or header) emitted as a single typed parameter.
 */
export type ParamGroupType = {
  /**
   * TypeNode for the group type.
   */
  type: TypeNode
  /**
   * Whether the parameter group is optional.
   */
  optional: boolean
}

/**
 * Resolver interface for {@link createOperationParams}.
 *
 * `ResolverTs` from `@kubb/plugin-ts` satisfies this interface and can be passed directly.
 */
export type OperationParamsResolver = {
  /**
   * Resolves the type name for an individual parameter.
   *
   * @example Individual path parameter name
   * `resolver.resolveParamName(node, param) // → 'DeletePetPathPetId'`
   */
  resolveParamName(node: OperationNode, param: ParameterNode): string
  /**
   * Resolves the request body type name.
   *
   * @example Request body type name
   * `resolver.resolveDataName(node) // → 'CreatePetData'`
   */
  resolveDataName(node: OperationNode): string
  /**
   * Resolves the grouped path parameters type name.
   * When the return value equals `resolveParamName`, no indexed access is emitted.
   *
   * @example Grouped path params type name
   * `resolver.resolvePathParamsName(node, param) // → 'DeletePetPathParams'`
   */
  resolvePathParamsName(node: OperationNode, param: ParameterNode): string
  /**
   * Resolves the grouped query parameters type name.
   * When the return value equals `resolveParamName`, an inline struct type is emitted instead.
   *
   * @example Grouped query params type name
   * `resolver.resolveQueryParamsName(node, param) // → 'FindPetsByStatusQueryParams'`
   */
  resolveQueryParamsName(node: OperationNode, param: ParameterNode): string
  /**
   * Resolves the grouped header parameters type name.
   * When the return value equals `resolveParamName`, an inline struct type is emitted instead.
   *
   * @example Grouped header params type name
   * `resolver.resolveHeaderParamsName(node, param) // → 'DeletePetHeaderParams'`
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
   * - `'inlineSpread'` emits a single rest parameter `...pathParams: PathParams`
   */
  pathParamsType: 'object' | 'inline' | 'inlineSpread'
  /**
   * Converts parameter names to camelCase before output.
   */
  paramsCasing?: 'camelcase'
  /**
   * Resolver for parameter and request body type names.
   * Pass `ResolverTs` from `@kubb/plugin-ts` directly.
   * When omitted, falls back to the schema primitive or `'unknown'`.
   */
  resolver?: OperationParamsResolver
  /**
   * Default value for the path parameters binding when `pathParamsType` is `'object'`.
   * Falls back to `'{}'` when all path params are optional.
   */
  pathParamsDefault?: string
  /**
   * Extra parameters appended after the standard operation parameters.
   *
   * @example Plugin-specific trailing parameter
   * ```ts
   * extraParams: [createFunctionParameter({ name: 'options', type: 'Partial<RequestOptions>', default: '{}' })]
   * ```
   */
  extraParams?: Array<FunctionParameterNode | ParameterGroupNode>
  /**
   * Override the default parameter names used for body, query, header, and rest-path groups.
   *
   * Useful when targeting languages or frameworks with different naming conventions.
   *
   * @default { data: 'data', params: 'params', headers: 'headers', path: 'pathParams' }
   */
  paramNames?: {
    /**
     * Name for the request body parameter.
     * @default 'data'
     */
    data?: string
    /**
     * Name for the query parameters group parameter.
     * @default 'params'
     */
    params?: string
    /**
     * Name for the header parameters group parameter.
     * @default 'headers'
     */
    headers?: string
    /**
     * Name for the rest path-parameters parameter when `pathParamsType` is `'inlineSpread'`.
     * @default 'pathParams'
     */
    path?: string
  }
  /**
   * Applies a uniform transformation to every resolved type name before it is used
   * in a parameter node. Use this for framework-level type wrappers.
   *
   * @example Vue Query — wrap every parameter type with `MaybeRefOrGetter`
   * `typeWrapper: (t) => \`MaybeRefOrGetter<${t}>\``
   */
  typeWrapper?: (type: string) => string
}

function resolveType({ node, param, resolver }: { node: OperationNode; param: ParameterNode; resolver: OperationParamsResolver | undefined }): TypeNode {
  if (!resolver) {
    return createTypeNode({ variant: 'reference', name: param.schema.primitive ?? 'unknown' })
  }

  const individualName = resolver.resolveParamName(node, param)

  const groupLocation = param.in === 'path' || param.in === 'query' || param.in === 'header' ? param.in : undefined

  const groupResolvers = {
    path: resolver.resolvePathParamsName,
    query: resolver.resolveQueryParamsName,
    header: resolver.resolveHeaderParamsName,
  } as const

  const groupName = groupLocation ? groupResolvers[groupLocation].call(resolver, node, param) : undefined

  if (groupName && groupName !== individualName) {
    return createTypeNode({ variant: 'member', base: groupName, key: param.name })
  }

  return createTypeNode({ variant: 'reference', name: individualName })
}

/**
 * Converts an {@link OperationNode} into a {@link FunctionParametersNode}.
 *
 * Centralizes the per-plugin `getParams()` pattern. Provide a `resolver` for
 * type resolution and `extraParams` for plugin-specific trailing parameters.
 *
 * @example
 * ```ts
 * const params = createOperationParams(node, {
 *   paramsType: 'inline',
 *   pathParamsType: 'inline',
 *   resolver: tsResolver,
 *   extraParams: [createFunctionParameter({ name: 'options', type: createTypeNode({ variant: 'reference', name: 'Partial<RequestOptions>' }), default: '{}' })],
 * })
 * ```
 */
export function createOperationParams(node: OperationNode, options: CreateOperationParamsOptions): FunctionParametersNode {
  const { paramsType, pathParamsType, paramsCasing, resolver, pathParamsDefault, extraParams = [], paramNames, typeWrapper } = options

  const dataName = paramNames?.data ?? 'data'
  const paramsName = paramNames?.params ?? 'params'
  const headersName = paramNames?.headers ?? 'headers'
  const pathName = paramNames?.path ?? 'pathParams'

  const wrapType = (type: string): TypeNode => createTypeNode({ variant: 'reference', name: typeWrapper ? typeWrapper(type) : type })
  // Only reference TypeNodes are wrapped (they hold a plain type name string).
  // Member and struct TypeNodes are pre-resolved structured expressions and are passed through unchanged.
  const wrapTypeNode = (type: TypeNode): TypeNode => (type.variant === 'reference' ? wrapType(type.name) : type)

  const casedParams = caseParams(node.parameters, paramsCasing)
  const pathParams = casedParams.filter((p) => p.in === 'path')
  const queryParams = casedParams.filter((p) => p.in === 'query')
  const headerParams = casedParams.filter((p) => p.in === 'header')

  const bodyType = node.requestBody?.schema ? wrapType(resolver?.resolveDataName(node) ?? 'unknown') : undefined
  const bodyRequired = node.requestBody?.required ?? false

  const queryGroupType = resolver ? resolveGroupType({ node, params: queryParams, groupMethod: resolver.resolveQueryParamsName, resolver }) : undefined
  const headerGroupType = resolver ? resolveGroupType({ node, params: headerParams, groupMethod: resolver.resolveHeaderParamsName, resolver }) : undefined

  const params: Array<FunctionParameterNode | ParameterGroupNode> = []

  if (paramsType === 'object') {
    const children: Array<FunctionParameterNode> = [
      ...pathParams.map((p) => {
        const type = resolveType({ node, param: p, resolver })
        return createFunctionParameter({ name: p.name, type: wrapTypeNode(type), optional: !p.required })
      }),
      ...(bodyType ? [createFunctionParameter({ name: dataName, type: bodyType, optional: !bodyRequired })] : []),
      ...buildGroupParam({ name: paramsName, node, params: queryParams, groupType: queryGroupType, resolver, wrapType }),
      ...buildGroupParam({ name: headersName, node, params: headerParams, groupType: headerGroupType, resolver, wrapType }),
    ]

    if (children.length) {
      params.push(createParameterGroup({ properties: children, default: children.every((c) => c.optional) ? '{}' : undefined }))
    }
  } else {
    if (pathParams.length) {
      if (pathParamsType === 'inlineSpread') {
        const spreadType = resolver?.resolvePathParamsName(node, pathParams[0]!) ?? undefined
        params.push(createFunctionParameter({ name: pathName, type: spreadType ? wrapType(spreadType) : undefined, rest: true }))
      } else {
        const pathChildren = pathParams.map((p) => {
          const type = resolveType({ node, param: p, resolver })
          return createFunctionParameter({ name: p.name, type: wrapTypeNode(type), optional: !p.required })
        })
        params.push(
          createParameterGroup({
            properties: pathChildren,
            inline: pathParamsType === 'inline',
            default: pathParamsDefault ?? (pathChildren.every((c) => c.optional) ? '{}' : undefined),
          }),
        )
      }
    }

    if (bodyType) {
      params.push(createFunctionParameter({ name: dataName, type: bodyType, optional: !bodyRequired }))
    }

    params.push(...buildGroupParam({ name: paramsName, node, params: queryParams, groupType: queryGroupType, resolver, wrapType }))
    params.push(...buildGroupParam({ name: headersName, node, params: headerParams, groupType: headerGroupType, resolver, wrapType }))
  }

  params.push(...extraParams)

  return createFunctionParameters({ params })
}

/**
 * Builds a single {@link FunctionParameterNode} for a query or header group.
 * Returns an empty array when there are no params to emit.
 *
 * If a pre-resolved `groupType` is provided it emits `name: GroupType`.
 * Otherwise, it builds an inline struct from the individual params.
 */
function buildGroupParam({
  name,
  node,
  params,
  groupType,
  resolver,
  wrapType,
}: {
  name: string
  node: OperationNode
  params: Array<ParameterNode>
  groupType: ParamGroupType | undefined
  resolver: OperationParamsResolver | undefined
  wrapType: (type: string) => TypeNode
}): Array<FunctionParameterNode> {
  if (groupType) {
    const type = groupType.type.variant === 'reference' ? wrapType(groupType.type.name) : groupType.type
    return [createFunctionParameter({ name, type, optional: groupType.optional })]
  }
  if (params.length) {
    return [
      createFunctionParameter({
        name,
        type: toStructType({ node, params, resolver }),
        optional: params.every((p) => !p.required),
      }),
    ]
  }
  return []
}

/**
 * Derives a {@link ParamGroupType} from the resolver's group method.
 * Returns `undefined` when the group name equals the individual param name (no real group).
 */
function resolveGroupType({
  node,
  params,
  groupMethod,
  resolver,
}: {
  node: OperationNode
  params: Array<ParameterNode>
  groupMethod: (_node: OperationNode, _param: ParameterNode) => string
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
  return { type: createTypeNode({ variant: 'reference', name: groupName }), optional: allOptional }
}

/**
 * Builds a {@link TypeNode} with `variant: 'struct'` for an inline anonymous type grouping named fields.
 *
 * Used when query or header parameters have no dedicated group type name.
 * Each language printer renders this appropriately (TypeScript: `{ petId: string; name?: string }`).
 */
function toStructType({
  node,
  params,
  resolver,
}: {
  node: OperationNode
  params: Array<ParameterNode>
  resolver: OperationParamsResolver | undefined
}): TypeNode {
  return createTypeNode({
    variant: 'struct',
    properties: params.map((p) => ({ name: p.name, optional: !p.required, type: resolveType({ node, param: p, resolver }) })),
  })
}

/**
 * Deduplicates an array of `SourceNode` objects.
 * Named sources are deduplicated by `name + isExportable + isTypeOnly`.
 * Unnamed sources are deduplicated by `value`.
 */
export function combineSources(sources: Array<SourceNode>): Array<SourceNode> {
  return uniqueBy(sources, (obj) => {
    const uniqueId = obj.name ?? obj.value ?? ''
    const isExportable = obj.isExportable ?? false
    const isTypeOnly = obj.isTypeOnly ?? false
    return `${uniqueId}:${isExportable}:${isTypeOnly}`
  })
}

/**
 * Deduplicates and merges an array of `ExportNode` objects.
 * Exports with the same path and `isTypeOnly` flag have their names merged.
 */
export function combineExports(exports: Array<ExportNode>): Array<ExportNode> {
  const sorted = sortBy(
    exports,
    (v) => !!Array.isArray(v.name),
    (v) => !v.isTypeOnly,
    (v) => v.path,
    (v) => !!v.name,
    (v) => (Array.isArray(v.name) ? [...v.name].sort().join('\0') : (v.name ?? '')),
  )

  const prev: Array<ExportNode> = []
  const pathMap = new Map<string, ExportNode>()
  const uniqueMap = new Map<string, ExportNode>()

  for (const curr of sorted) {
    const name = curr.name
    const pathKey = curr.path
    const prevByPath = pathMap.get(pathKey)

    const nameKey = Array.isArray(name) ? JSON.stringify(name) : name || ''
    const pathNameTypeKey = `${pathKey}:${nameKey}:${curr.isTypeOnly}`
    const uniqueKey = `${pathNameTypeKey}:${curr.asAlias || ''}`
    const uniquePrev = uniqueMap.get(uniqueKey)

    if (uniquePrev || (Array.isArray(name) && !name.length) || (prevByPath?.asAlias && !curr.asAlias)) {
      continue
    }

    if (!prevByPath) {
      const newItem: ExportNode = {
        ...curr,
        name: Array.isArray(name) ? [...new Set(name)] : name,
      }
      prev.push(newItem)
      pathMap.set(pathKey, newItem)
      uniqueMap.set(uniqueKey, newItem)
      continue
    }

    if (prevByPath && Array.isArray(prevByPath.name) && Array.isArray(curr.name) && prevByPath.isTypeOnly === curr.isTypeOnly) {
      prevByPath.name = [...new Set([...prevByPath.name, ...curr.name])]
      continue
    }

    prev.push(curr)
    uniqueMap.set(uniqueKey, curr)
  }

  return prev
}

/**
 * Deduplicates and merges an array of `ImportNode` objects.
 * Filters out unused imports (names not referenced in `source` or re-exported).
 * Imports with the same path and `isTypeOnly` flag have their names merged.
 */
export function combineImports(imports: Array<ImportNode>, exports: Array<ExportNode>, source?: string): Array<ImportNode> {
  const exportedNameLookup = new Set<string>()
  for (const item of exports) {
    const { name } = item
    if (!name) continue
    if (Array.isArray(name)) {
      for (const value of name) {
        if (value) exportedNameLookup.add(value)
      }
      continue
    }
    exportedNameLookup.add(name)
  }

  const usageCache = new Map<string, boolean>()
  const hasImportInSource = (importName: string): boolean => {
    if (!source) return true
    const cached = usageCache.get(importName)
    if (cached !== undefined) return cached
    const isUsed = source.includes(importName) || exportedNameLookup.has(importName)
    usageCache.set(importName, isUsed)
    return isUsed
  }

  const sorted = sortBy(
    imports,
    (v) => Array.isArray(v.name),
    (v) => !v.isTypeOnly,
    (v) => v.path,
    (v) => !!v.name,
    (v) => (Array.isArray(v.name) ? [...v.name].sort().join('\0') : (v.name ?? '')),
  )

  const prev: Array<ImportNode> = []
  const pathTypeMap = new Map<string, ImportNode>()
  const uniqueMap = new Map<string, ImportNode>()

  for (const curr of sorted) {
    let name = Array.isArray(curr.name) ? [...new Set(curr.name)] : curr.name

    if (curr.path === curr.root) continue

    if (Array.isArray(name)) {
      name = name.filter((item) => (typeof item === 'string' ? hasImportInSource(item) : hasImportInSource(item.propertyName)))
    }

    const pathTypeKey = `${curr.path}:${curr.isTypeOnly}`
    const prevByPath = pathTypeMap.get(pathTypeKey)
    const nameKey = Array.isArray(name) ? JSON.stringify(name) : name || ''
    const pathNameTypeKey = `${curr.path}:${nameKey}:${curr.isTypeOnly}`
    const uniquePrev = uniqueMap.get(pathNameTypeKey)

    if (uniquePrev || (Array.isArray(name) && !name.length)) continue

    if (!prevByPath) {
      const newItem: ImportNode = { ...curr, name }
      prev.push(newItem)
      pathTypeMap.set(pathTypeKey, newItem)
      uniqueMap.set(pathNameTypeKey, newItem)
      continue
    }

    if (prevByPath && Array.isArray(prevByPath.name) && Array.isArray(name) && prevByPath.isTypeOnly === curr.isTypeOnly) {
      prevByPath.name = [...new Set([...prevByPath.name, ...name])]
      continue
    }

    if (!Array.isArray(name) && name && !hasImportInSource(name)) continue

    prev.push(curr)
    uniqueMap.set(pathNameTypeKey, curr)
  }

  return prev
}
