import { camelCase, isValidVarName } from '@internals/utils'

import { createFunctionParameter, createFunctionParameters, createParameterGroup, createParamsType, createProperty, createSchema } from './factory.ts'
import { narrowSchema } from './guards.ts'
import type {
  CodeNode,
  ExportNode,
  FunctionParameterNode,
  FunctionParametersNode,
  ImportNode,
  OperationNode,
  ParameterGroupNode,
  ParameterNode,
  ParamsTypeNode,
  SchemaNode,
  SourceNode,
} from './nodes/index.ts'
import type { SchemaType } from './nodes/schema.ts'
import { extractRefName } from './refs.ts'
import { collect } from './visitor.ts'

const plainStringTypes = new Set<SchemaType>(['string', 'uuid', 'email', 'url', 'datetime'] as const)

/**
 * Merges a ref node with its resolved schema, giving usage-site fields precedence.
 *
 * Usage-site fields (`description`, `readOnly`, `nullable`, `deprecated`) on the ref node
 * override the same fields in the resolved `node.schema`. Non-ref nodes are returned unchanged.
 *
 * @example
 * ```ts
 * // Ref with description override
 * const ref = createSchema({ type: 'ref', ref: '#/components/schemas/Pet', description: 'A cute pet' })
 * const merged = syncSchemaRef(ref)  // merges with resolved Pet schema
 * ```
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
 * Type guard that returns `true` when a schema emits as a plain `string` type.
 *
 * Covers `string`, `uuid`, `email`, `url`, and `datetime` types. For `date` and `time`
 * types, returns `true` only when `representation` is `'string'` rather than `'date'`.
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
 * Use this before passing parameters to schema builders so output property keys match
 * the desired casing while preserving `OperationNode.parameters` for other consumers.
 * The input array is not mutated. When `casing` is not set, the original array is returned unchanged.
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
  type: ParamsTypeNode
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

function resolveParamsType({
  node,
  param,
  resolver,
}: {
  node: OperationNode
  param: ParameterNode
  resolver: OperationParamsResolver | undefined
}): ParamsTypeNode {
  if (!resolver) {
    return createParamsType({
      variant: 'reference',
      name: param.schema.primitive ?? 'unknown',
    })
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
    return createParamsType({
      variant: 'member',
      base: groupName,
      key: param.name,
    })
  }

  return createParamsType({ variant: 'reference', name: individualName })
}

/**
 * Converts an `OperationNode` into function parameters for code generation.
 *
 * Centralizes parameter grouping logic for all plugins. Provide a `resolver` for type name resolution
 * and `extraParams` for plugin-specific trailing parameters (e.g., `options` objects).
 * Supports three grouping modes: `object` (single destructured param), `inline` (separate params),
 * and `inlineSpread` (rest parameter). Use `CreateOperationParamsOptions` to fine-tune output.
 */
export function createOperationParams(node: OperationNode, options: CreateOperationParamsOptions): FunctionParametersNode {
  const { paramsType, pathParamsType, paramsCasing, resolver, pathParamsDefault, extraParams = [], paramNames, typeWrapper } = options

  const dataName = paramNames?.data ?? 'data'
  const paramsName = paramNames?.params ?? 'params'
  const headersName = paramNames?.headers ?? 'headers'
  const pathName = paramNames?.path ?? 'pathParams'

  const wrapType = (type: string): ParamsTypeNode =>
    createParamsType({
      variant: 'reference',
      name: typeWrapper ? typeWrapper(type) : type,
    })
  // Only reference-variant TypeNodes are wrapped — they hold a plain type name string that needs casing applied.
  // Member and struct TypeNodes are pre-resolved structured expressions and are passed through unchanged.
  const wrapTypeNode = (type: ParamsTypeNode): ParamsTypeNode => (type.kind === 'ParamsType' && type.variant === 'reference' ? wrapType(type.name) : type)

  const casedParams = caseParams(node.parameters, paramsCasing)
  const pathParams = casedParams.filter((p) => p.in === 'path')
  const queryParams = casedParams.filter((p) => p.in === 'query')
  const headerParams = casedParams.filter((p) => p.in === 'header')

  const bodyType = node.requestBody?.content?.[0]?.schema ? wrapType(resolver?.resolveDataName(node) ?? 'unknown') : undefined
  const bodyRequired = node.requestBody?.required ?? false

  const queryGroupType = resolver
    ? resolveGroupType({
        node,
        params: queryParams,
        groupMethod: resolver.resolveQueryParamsName,
        resolver,
      })
    : undefined
  const headerGroupType = resolver
    ? resolveGroupType({
        node,
        params: headerParams,
        groupMethod: resolver.resolveHeaderParamsName,
        resolver,
      })
    : undefined

  const params: Array<FunctionParameterNode | ParameterGroupNode> = []

  if (paramsType === 'object') {
    const children: Array<FunctionParameterNode> = [
      ...pathParams.map((p) => {
        const type = resolveParamsType({ node, param: p, resolver })
        return createFunctionParameter({
          name: p.name,
          type: wrapTypeNode(type),
          optional: !p.required,
        })
      }),
      ...(bodyType
        ? [
            createFunctionParameter({
              name: dataName,
              type: bodyType,
              optional: !bodyRequired,
            }),
          ]
        : []),
      ...buildGroupParam({
        name: paramsName,
        node,
        params: queryParams,
        groupType: queryGroupType,
        resolver,
        wrapType,
      }),
      ...buildGroupParam({
        name: headersName,
        node,
        params: headerParams,
        groupType: headerGroupType,
        resolver,
        wrapType,
      }),
    ]

    if (children.length) {
      params.push(
        createParameterGroup({
          properties: children,
          default: children.every((c) => c.optional) ? '{}' : undefined,
        }),
      )
    }
  } else {
    if (pathParams.length) {
      if (pathParamsType === 'inlineSpread') {
        const spreadType = resolver?.resolvePathParamsName(node, pathParams[0]!) ?? undefined
        params.push(
          createFunctionParameter({
            name: pathName,
            type: spreadType ? wrapType(spreadType) : undefined,
            rest: true,
          }),
        )
      } else {
        const pathChildren = pathParams.map((p) => {
          const type = resolveParamsType({ node, param: p, resolver })
          return createFunctionParameter({
            name: p.name,
            type: wrapTypeNode(type),
            optional: !p.required,
          })
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
      params.push(
        createFunctionParameter({
          name: dataName,
          type: bodyType,
          optional: !bodyRequired,
        }),
      )
    }

    params.push(
      ...buildGroupParam({
        name: paramsName,
        node,
        params: queryParams,
        groupType: queryGroupType,
        resolver,
        wrapType,
      }),
    )
    params.push(
      ...buildGroupParam({
        name: headersName,
        node,
        params: headerParams,
        groupType: headerGroupType,
        resolver,
        wrapType,
      }),
    )
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
  wrapType: (type: string) => ParamsTypeNode
}): Array<FunctionParameterNode> {
  if (groupType) {
    const type = groupType.type.kind === 'ParamsType' && groupType.type.variant === 'reference' ? wrapType(groupType.type.name) : groupType.type
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
  return {
    type: createParamsType({ variant: 'reference', name: groupName }),
    optional: allOptional,
  }
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
}): ParamsTypeNode {
  return createParamsType({
    variant: 'struct',
    properties: params.map((p) => ({
      name: p.name,
      optional: !p.required,
      type: resolveParamsType({ node, param: p, resolver }),
    })),
  })
}

function sourceKey(source: SourceNode): string {
  const nameKey = source.name ?? extractStringsFromNodes(source.nodes)
  return `${nameKey}:${source.isExportable ?? false}:${source.isTypeOnly ?? false}`
}

function pathTypeKey(path: string, isTypeOnly: boolean | undefined): string {
  return `${path}:${isTypeOnly ?? false}`
}

function exportKey(path: string, name: string | undefined, isTypeOnly: boolean | undefined, asAlias: boolean | undefined): string {
  return `${path}:${name ?? ''}:${isTypeOnly ?? false}:${asAlias ?? ''}`
}

function importKey(path: string, name: string | undefined, isTypeOnly: boolean | undefined): string {
  return `${path}:${name ?? ''}:${isTypeOnly ?? false}`
}

/**
 * Computes a multi-level sort key for exports and imports:
 * non-array names first (wildcards/namespace aliases); type-only before value; alphabetical path; unnamed before named.
 */
function sortKey(node: { name?: string | Array<unknown>; isTypeOnly?: boolean; path: string }): string {
  const isArray = Array.isArray(node.name) ? '1' : '0'
  const typeOnly = node.isTypeOnly ? '0' : '1'
  const hasName = node.name != null ? '1' : '0'
  const name = Array.isArray(node.name) ? [...node.name].sort().join('\0') : (node.name ?? '')
  return `${isArray}:${typeOnly}:${node.path}:${hasName}:${name}`
}

/**
 * Deduplicates and merges `SourceNode` objects by `name + isExportable + isTypeOnly`.
 *
 * Unnamed sources are deduplicated by object reference. Returns a deduplicated array in original order.
 */
export function combineSources(sources: Array<SourceNode>): Array<SourceNode> {
  const seen = new Map<string, SourceNode>()
  for (const source of sources) {
    const key = sourceKey(source)
    if (!seen.has(key)) seen.set(key, source)
  }
  return [...seen.values()]
}

/**
 * Deduplicates and merges `ExportNode` objects by path and type.
 *
 * Named exports with the same path and `isTypeOnly` flag have their names merged into a single export.
 * Non-array exports are deduplicated by exact identity. Returns a sorted, deduplicated array.
 */
export function combineExports(exports: Array<ExportNode>): Array<ExportNode> {
  const result: Array<ExportNode> = []
  // Accumulates array-named exports keyed by `path:isTypeOnly` for name-merging
  const namedByPath = new Map<string, ExportNode>()
  // Deduplicates non-array exports by their exact identity
  const seen = new Set<string>()

  // Precompute sort keys once — avoids recomputing per comparison.
  const keyed = exports.map((node) => ({ node, key: sortKey(node) }))
  keyed.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))

  for (const { node: curr } of keyed) {
    const { name, path, isTypeOnly, asAlias } = curr

    if (Array.isArray(name)) {
      if (!name.length) continue

      const key = pathTypeKey(path, isTypeOnly)
      const existing = namedByPath.get(key)

      if (existing && Array.isArray(existing.name)) {
        const merged = new Set(existing.name)
        for (const n of name) merged.add(n)
        existing.name = [...merged]
      } else {
        const newItem: ExportNode = { ...curr, name: [...new Set(name)] }
        result.push(newItem)
        namedByPath.set(key, newItem)
      }
    } else {
      const key = exportKey(path, name, isTypeOnly, asAlias)
      if (!seen.has(key)) {
        result.push(curr)
        seen.add(key)
      }
    }
  }

  return result
}

/**
 * Deduplicates and merges `ImportNode` objects, filtering out unused imports.
 *
 * Retains imports that are referenced in `source` or re-exported. Imports with the same path and
 * `isTypeOnly` flag have their names merged. Returns a sorted, deduplicated, filtered array.
 *
 * @note Use this when combining imports from multiple files to avoid duplicate declarations.
 */
export function combineImports(imports: Array<ImportNode>, exports: Array<ExportNode>, source?: string): Array<ImportNode> {
  // Build a lookup of all exported names to retain imports that are re-exported
  const exportedNames = new Set(exports.flatMap((e) => (Array.isArray(e.name) ? e.name : e.name ? [e.name] : [])))
  const isUsed = (importName: string): boolean => !source || source.includes(importName) || exportedNames.has(importName)

  const result: Array<ImportNode> = []
  // Accumulates array-named imports keyed by `path:isTypeOnly` for name-merging
  const namedByPath = new Map<string, ImportNode>()
  // Deduplicates non-array imports by their exact identity
  const seen = new Set<string>()

  // Precompute sort keys once — avoids recomputing per comparison.
  const keyed = imports.map((node) => ({ node, key: sortKey(node) }))
  keyed.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))

  for (const { node: curr } of keyed) {
    if (curr.path === curr.root) continue

    const { path, isTypeOnly } = curr
    let { name } = curr

    if (Array.isArray(name)) {
      name = [...new Set(name)].filter((item) => (typeof item === 'string' ? isUsed(item) : isUsed(item.name ?? item.propertyName)))
      if (!name.length) continue

      const key = pathTypeKey(path, isTypeOnly)
      const existing = namedByPath.get(key)

      if (existing && Array.isArray(existing.name)) {
        const merged = new Set(existing.name)
        for (const n of name) merged.add(n)
        existing.name = [...merged]
      } else {
        const newItem: ImportNode = { ...curr, name }
        result.push(newItem)
        namedByPath.set(key, newItem)
      }
    } else {
      if (name && !isUsed(name)) continue

      const key = importKey(path, name, isTypeOnly)
      if (!seen.has(key)) {
        result.push(curr)
        seen.add(key)
      }
    }
  }

  return result
}

/**
 * Extracts all string content from a `CodeNode` tree recursively.
 *
 * Collects text node values, identifier references in string fields (`params`, `generics`, `returnType`, `type`),
 * and nested node content. Used internally to build the full source string for import filtering.
 */
export function extractStringsFromNodes(nodes: Array<CodeNode> | undefined): string {
  if (!nodes?.length) return ''
  return nodes
    .map((node) => {
      // Backward-compat: compiled plugins may still pass bare strings at runtime
      if (typeof node === 'string') return node as string
      if (node.kind === 'Text') return node.value
      if (node.kind === 'Break') return ''
      if (node.kind === 'Jsx') return node.value
      const parts: string[] = []
      if ('params' in node && node.params) parts.push(node.params)
      if ('generics' in node && node.generics) parts.push(Array.isArray(node.generics) ? node.generics.join(', ') : node.generics)
      if ('returnType' in node && node.returnType) parts.push(node.returnType)
      if ('type' in node && typeof node.type === 'string') parts.push(node.type)
      const nested = extractStringsFromNodes(node.nodes)
      if (nested) parts.push(nested)
      return parts.join('\n')
    })
    .filter(Boolean)
    .join('\n')
}

/**
 * Resolves the schema name of a ref node, falling back through `ref` → `name` → nested `schema.name`.
 *
 * Returns `undefined` for non-ref nodes or when no name can be resolved. Use this to get a schema's
 * identifier for type definitions or error messages.
 *
 * @example
 * ```ts
 * resolveRefName({ kind: 'Schema', type: 'ref', ref: '#/components/schemas/Pet' })
 * // => 'Pet'
 * ```
 */
export function resolveRefName(node: SchemaNode | undefined): string | undefined {
  if (!node || node.type !== 'ref') return undefined
  if (node.ref) return extractRefName(node.ref) ?? node.name ?? node.schema?.name ?? undefined

  return node.name ?? node.schema?.name ?? undefined
}

/**
 * Collects every named schema referenced (transitively) from a node via ref edges.
 *
 * Refs are followed by name only — the resolved `node.schema` is not traversed inline.
 * Use this to determine schema dependencies, build reference graphs, or detect what schemas need to be emitted.
 *
 * @example Collect refs from a single schema
 * ```ts
 * const names = collectReferencedSchemaNames(petSchema)
 * // → Set { 'Category', 'Tag' }
 * ```
 *
 * @example Accumulate refs from multiple schemas into one set
 * ```ts
 * const out = new Set<string>()
 * for (const schema of schemas) {
 *   collectReferencedSchemaNames(schema, out)
 * }
 * ```
 */
export function collectReferencedSchemaNames(node: SchemaNode | undefined, out: Set<string> = new Set()): Set<string> {
  if (!node) return out
  collect<void>(node, {
    schema(child) {
      if (child.type === 'ref') {
        const name = resolveRefName(child)

        if (name) out.add(name)
      }
      return undefined
    },
  })
  return out
}

/**
 * Collects the names of all top-level schemas transitively used by a set of operations.
 *
 * An operation uses a schema when any of its parameters, request body content, or responses
 * reference it — directly or indirectly through other named schemas.
 * The walk is iterative and safe against reference cycles.
 *
 * Use this together with `include` filters to determine which schemas from `components/schemas`
 * are reachable from the allowed operations, so that schemas used only by excluded operations
 * are not generated.
 *
 * @example Only generate schemas referenced by included operations
 * ```ts
 * const includedOps = inputNode.operations.filter(op => resolver.resolveOptions(op, { options, include }) !== null)
 * const allowed = collectUsedSchemaNames(includedOps, inputNode.schemas)
 *
 * for (const schema of inputNode.schemas) {
 *   if (schema.name && !allowed.has(schema.name)) continue
 *   // … generate schema
 * }
 * ```
 *
 * @example Check whether a specific schema is needed
 * ```ts
 * const allowed = collectUsedSchemaNames(includedOps, inputNode.schemas)
 * allowed.has('OrderStatus') // false when no included operation references OrderStatus
 * ```
 */
export function collectUsedSchemaNames(operations: ReadonlyArray<OperationNode>, schemas: ReadonlyArray<SchemaNode>): Set<string> {
  const schemaMap = new Map<string, SchemaNode>()
  for (const schema of schemas) {
    if (schema.name) {
      schemaMap.set(schema.name, schema)
    }
  }

  const result = new Set<string>()

  function visitSchema(schema: SchemaNode): void {
    const directRefs = collectReferencedSchemaNames(schema)
    for (const name of directRefs) {
      if (!result.has(name)) {
        result.add(name)
        const namedSchema = schemaMap.get(name)
        if (namedSchema) {
          visitSchema(namedSchema)
        }
      }
    }
  }

  for (const op of operations) {
    for (const schema of collect<SchemaNode>(op, { depth: 'shallow', schema: (node) => node })) {
      visitSchema(schema)
    }
  }

  return result
}

/**
 * Identifies all schemas that participate in circular dependency chains, including direct self-loops.
 *
 * Returns a Set of schema names with circular dependencies. Use this to wrap recursive schema positions
 * in deferred constructs (lazy getter, `z.lazy(() => …)`) to prevent infinite recursion when generated code runs.
 * Refs are followed by name only, keeping the algorithm linear in the schema graph size.
 *
 * @note Call this once on the full schema graph, then use `containsCircularRef()` to check individual schemas.
 */
export function findCircularSchemas(schemas: ReadonlyArray<SchemaNode>): Set<string> {
  const graph = new Map<string, Set<string>>()

  for (const schema of schemas) {
    if (!schema.name) continue
    graph.set(schema.name, collectReferencedSchemaNames(schema))
  }

  const circular = new Set<string>()
  for (const start of graph.keys()) {
    const visited = new Set<string>()
    const stack: string[] = [...(graph.get(start) ?? [])]
    while (stack.length > 0) {
      const node = stack.pop()!
      if (node === start) {
        circular.add(start)
        break
      }
      if (visited.has(node)) continue
      visited.add(node)

      const next = graph.get(node)
      if (next) for (const r of next) stack.push(r)
    }
  }

  return circular
}

/**
 * Type guard returning `true` when a schema or anything nested within it contains a ref to a circular schema.
 *
 * Use `excludeName` to ignore refs to specific schemas (useful when self-references are handled separately).
 * Commonly used with `findCircularSchemas()` to detect where lazy wrappers are needed in code generation.
 *
 * @note Returns `true` for the first matching circular ref found; use for fast dependency checks.
 */
export function containsCircularRef(
  node: SchemaNode | undefined,
  { circularSchemas, excludeName }: { circularSchemas: ReadonlySet<string>; excludeName?: string },
): boolean {
  if (!node || circularSchemas.size === 0) return false

  const matches = collect<true>(node, {
    schema(child) {
      if (child.type !== 'ref') return undefined
      const name = resolveRefName(child)

      return name && name !== excludeName && circularSchemas.has(name) ? true : undefined
    },
  })

  return matches.length > 0
}
