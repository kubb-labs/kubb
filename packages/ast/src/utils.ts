import { camelCase, isValidVarName } from '@internals/utils'

import { createFunctionParameter, createFunctionParameters, createObjectBindingParameter, createProperty, createSchema } from './factory.ts'
import { narrowSchema } from './guards.ts'
import type { FunctionParameterNode, FunctionParametersNode, ObjectBindingParameterNode, OperationNode, ParameterNode, SchemaNode } from './nodes/index.ts'
import type { SchemaType } from './nodes/schema.ts'

const plainStringTypes = new Set<SchemaType>(['string', 'uuid', 'email', 'url', 'datetime'] as const)

/**
 * Returns `true` when a schema is emitted as a plain TypeScript `string`.
 *
 * - `string`, `uuid`, `email`, `url`, `datetime` are always plain strings.
 * - `date` and `time` are plain strings when their `representation` is `'string'` rather than `'date'`.
 *
 * @example
 * ```ts
 * isStringType(createSchema({ type: 'uuid' })) // true
 * isStringType(createSchema({ type: 'date', representation: 'date' })) // false
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

function resolveType({ node, param, resolver }: { node: OperationNode; param: ParameterNode; resolver: OperationParamsResolver | undefined }): string {
  if (!resolver) {
    return param.schema.primitive ?? 'unknown'
  }

  const individualName = resolver.resolveParamName(node, param)

  const groupResolvers = {
    path: resolver.resolvePathParamsName,
    query: resolver.resolveQueryParamsName,
    header: resolver.resolveHeaderParamsName,
  } as const

  const groupName = groupResolvers[param.in as keyof typeof groupResolvers]?.call(resolver, node, param)

  if (groupName && groupName !== individualName) {
    return `${groupName}['${param.name}']`
  }

  return individualName
}

/**
 * Converts an {@link OperationNode} into a {@link FunctionParametersNode}.
 *
 * Centralizes the per-plugin `getParams()` pattern. Provide a `resolver` for
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

  const queryGroupType = resolver ? resolveGroupType({ node, params: queryParams, groupMethod: resolver.resolveQueryParamsName, resolver }) : undefined
  const headerGroupType = resolver ? resolveGroupType({ node, params: headerParams, groupMethod: resolver.resolveHeaderParamsName, resolver }) : undefined

  const params: Array<FunctionParameterNode | ObjectBindingParameterNode> = []

  if (paramsType === 'object') {
    const children: Array<FunctionParameterNode> = [
      ...pathParams.map((p) => createFunctionParameter({ name: p.name, type: resolveType({ node, param: p, resolver }), optional: !p.required })),
      ...(bodyType ? [createFunctionParameter({ name: 'data', type: bodyType, optional: !bodyRequired })] : []),
    ]

    if (queryGroupType) {
      children.push(createFunctionParameter({ name: 'params', type: queryGroupType.type, optional: queryGroupType.optional }))
    } else if (queryParams.length) {
      children.push(
        createFunctionParameter({
          name: 'params',
          type: toInlineObjectType({ node, params: queryParams, resolver }),
          optional: queryParams.every((p) => !p.required),
        }),
      )
    }

    if (headerGroupType) {
      children.push(createFunctionParameter({ name: 'headers', type: headerGroupType.type, optional: headerGroupType.optional }))
    } else if (headerParams.length) {
      children.push(
        createFunctionParameter({
          name: 'headers',
          type: toInlineObjectType({ node, params: headerParams, resolver }),
          optional: headerParams.every((p) => !p.required),
        }),
      )
    }

    if (children.length) {
      params.push(createObjectBindingParameter({ properties: children, default: children.every((c) => c.optional) ? '{}' : undefined }))
    }
  } else {
    if (pathParams.length) {
      const pathChildren = pathParams.map((p) =>
        createFunctionParameter({ name: p.name, type: resolveType({ node, param: p, resolver }), optional: !p.required }),
      )
      params.push(
        createObjectBindingParameter({
          properties: pathChildren,
          inline: pathParamsType === 'inline',
          default: pathParamsDefault ?? (pathChildren.every((c) => c.optional) ? '{}' : undefined),
        }),
      )
    }

    if (bodyType) {
      params.push(createFunctionParameter({ name: 'data', type: bodyType, optional: !bodyRequired }))
    }

    if (queryGroupType) {
      params.push(createFunctionParameter({ name: 'params', type: queryGroupType.type, optional: queryGroupType.optional }))
    } else if (queryParams.length) {
      params.push(
        createFunctionParameter({
          name: 'params',
          type: toInlineObjectType({ node, params: queryParams, resolver }),
          optional: queryParams.every((p) => !p.required),
        }),
      )
    }

    if (headerGroupType) {
      params.push(createFunctionParameter({ name: 'headers', type: headerGroupType.type, optional: headerGroupType.optional }))
    } else if (headerParams.length) {
      params.push(
        createFunctionParameter({
          name: 'headers',
          type: toInlineObjectType({ node, params: headerParams, resolver }),
          optional: headerParams.every((p) => !p.required),
        }),
      )
    }
  }

  params.push(...extraParams)

  return createFunctionParameters({ params })
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
  return { type: groupName, optional: allOptional }
}

/**
 * Builds an inline object type string.
 * @example toInlineObjectType(...) // → '{ petId: string; name?: string }'
 */
function toInlineObjectType({
  node,
  params,
  resolver,
}: {
  node: OperationNode
  params: Array<ParameterNode>
  resolver: OperationParamsResolver | undefined
}): string {
  const parts = params.map((p) => `${p.name}${!p.required ? '?' : ''}: ${resolveType({ node, param: p, resolver })}`)
  return `{ ${parts.join('; ')} }`
}
