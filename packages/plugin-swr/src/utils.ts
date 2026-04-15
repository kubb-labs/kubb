import { caseParams, createFunctionParameter, createFunctionParameters, createParamsType } from '@kubb/ast'
import type { FunctionParameterNode, FunctionParametersNode, OperationNode, ParameterGroupNode, ParameterNode, ParamsTypeNode } from '@kubb/ast/types'
import type { PluginTs } from '@kubb/plugin-ts'

/**
 * Build JSDoc comment lines from an OperationNode.
 */
export function getComments(node: OperationNode): Array<string> {
  return [
    node.description && `@description ${node.description}`,
    node.summary && `@summary ${node.summary}`,
    node.deprecated && '@deprecated',
    `{@link ${node.path.replaceAll('{', ':').replaceAll('}', '')}}`,
  ].filter((x): x is string => Boolean(x))
}

/**
 * Resolve error type names from operation responses.
 */
export function resolveErrorNames(node: OperationNode, tsResolver: PluginTs['resolver']): string[] {
  return node.responses
    .filter((r) => {
      const code = Number.parseInt(r.statusCode, 10)
      return code >= 400 || r.statusCode === 'default'
    })
    .map((r) => tsResolver.resolveResponseStatusName(node, r.statusCode))
}

/**
 * Resolve all status code type names from operation responses (for imports).
 */
export function resolveStatusCodeNames(node: OperationNode, tsResolver: PluginTs['resolver']): string[] {
  return node.responses.map((r) => tsResolver.resolveResponseStatusName(node, r.statusCode))
}

/**
 * Resolve the type for a single path parameter.
 *
 * - When the resolver's group name differs from the individual param name
 *   (e.g. kubbV4) → `GroupName['paramName']` (member access).
 * - When they match (v5 default) → `TypeName` (direct reference).
 */
export function resolvePathParamType(node: OperationNode, param: ParameterNode, resolver: PluginTs['resolver']): ParamsTypeNode {
  const individualName = resolver.resolveParamName(node, param)
  const groupName = resolver.resolvePathParamsName(node, param)

  if (groupName !== individualName) {
    return createParamsType({ variant: 'member', base: groupName, key: param.name })
  }
  return createParamsType({ variant: 'reference', name: individualName })
}

type QueryGroupResult = { type: ParamsTypeNode; optional: boolean } | undefined

/**
 * Derive a query-params group type from the resolver.
 * Returns `undefined` when no query params exist or when the group name
 * equals the individual param name (no real group).
 */
export function resolveQueryGroupType(node: OperationNode, params: ParameterNode[], resolver: PluginTs['resolver']): QueryGroupResult {
  if (!params.length) return undefined
  const firstParam = params[0]!
  const groupName = resolver.resolveQueryParamsName(node, firstParam)
  if (groupName === resolver.resolveParamName(node, firstParam)) return undefined
  return { type: createParamsType({ variant: 'reference', name: groupName }), optional: params.every((p) => !p.required) }
}

/**
 * Derive a header-params group type from the resolver.
 */
export function resolveHeaderGroupType(node: OperationNode, params: ParameterNode[], resolver: PluginTs['resolver']): QueryGroupResult {
  if (!params.length) return undefined
  const firstParam = params[0]!
  const groupName = resolver.resolveHeaderParamsName(node, firstParam)
  if (groupName === resolver.resolveParamName(node, firstParam)) return undefined
  return { type: createParamsType({ variant: 'reference', name: groupName }), optional: params.every((p) => !p.required) }
}

/**
 * Build a single `FunctionParameterNode` for a query or header group.
 */
export function buildGroupParam(
  name: string,
  node: OperationNode,
  params: ParameterNode[],
  groupType: QueryGroupResult,
  resolver: PluginTs['resolver'],
): FunctionParameterNode[] {
  if (groupType) {
    return [createFunctionParameter({ name, type: groupType.type, optional: groupType.optional })]
  }
  if (params.length) {
    const structProps = params.map((p) => ({
      name: p.name,
      type: createParamsType({ variant: 'reference', name: resolver.resolveParamName(node, p) }),
      optional: !p.required,
    }))
    return [
      createFunctionParameter({
        name,
        type: createParamsType({ variant: 'struct', properties: structProps }),
        optional: params.every((p) => !p.required),
      }),
    ]
  }
  return []
}

/**
 * Build QueryKey params: pathParams + data + queryParams (NO headers, NO config).
 */
export function buildQueryKeyParams(
  node: OperationNode,
  options: {
    pathParamsType: 'object' | 'inline'
    paramsCasing: 'camelcase' | undefined
    resolver: PluginTs['resolver']
  },
): FunctionParametersNode {
  const { pathParamsType, paramsCasing, resolver } = options

  const casedParams = caseParams(node.parameters, paramsCasing)
  const pathParams = casedParams.filter((p) => p.in === 'path')
  const queryParams = casedParams.filter((p) => p.in === 'query')

  const queryGroupType = resolveQueryGroupType(node, queryParams, resolver)

  const bodyType = node.requestBody?.schema ? createParamsType({ variant: 'reference', name: resolver.resolveDataName(node) }) : undefined
  const bodyRequired = node.requestBody?.required ?? false

  const params: Array<FunctionParameterNode | ParameterGroupNode> = []

  // Path params
  if (pathParams.length) {
    const pathChildren = pathParams.map((p) => createFunctionParameter({ name: p.name, type: resolvePathParamType(node, p, resolver), optional: !p.required }))
    params.push({
      kind: 'ParameterGroup',
      properties: pathChildren,
      inline: pathParamsType === 'inline',
      default: pathChildren.every((c) => c.optional) ? '{}' : undefined,
    })
  }

  // Request body
  if (bodyType) {
    params.push(createFunctionParameter({ name: 'data', type: bodyType, optional: !bodyRequired }))
  }

  // Query params
  params.push(...buildGroupParam('params', node, queryParams, queryGroupType, resolver))

  return createFunctionParameters({ params })
}

/**
 * Build mutation arg params for paramsToTrigger mode.
 * Contains pathParams + data + queryParams + headers (all flattened, for type alias).
 */
export function buildMutationArgParams(
  node: OperationNode,
  options: {
    paramsCasing: 'camelcase' | undefined
    resolver: PluginTs['resolver']
  },
): FunctionParametersNode {
  const { paramsCasing, resolver } = options

  const casedParams = caseParams(node.parameters, paramsCasing)
  const pathParams = casedParams.filter((p) => p.in === 'path')
  const queryParams = casedParams.filter((p) => p.in === 'query')
  const headerParams = casedParams.filter((p) => p.in === 'header')

  const queryGroupType = resolveQueryGroupType(node, queryParams, resolver)
  const headerGroupType = resolveHeaderGroupType(node, headerParams, resolver)

  const bodyType = node.requestBody?.schema ? createParamsType({ variant: 'reference', name: resolver.resolveDataName(node) }) : undefined
  const bodyRequired = node.requestBody?.required ?? false

  const params: Array<FunctionParameterNode | ParameterGroupNode> = []

  // Path params (individual entries)
  for (const p of pathParams) {
    params.push(createFunctionParameter({ name: p.name, type: resolvePathParamType(node, p, resolver), optional: !p.required }))
  }

  // Request body
  if (bodyType) {
    params.push(createFunctionParameter({ name: 'data', type: bodyType, optional: !bodyRequired }))
  }

  // Query params
  params.push(...buildGroupParam('params', node, queryParams, queryGroupType, resolver))

  // Header params
  params.push(...buildGroupParam('headers', node, headerParams, headerGroupType, resolver))

  return createFunctionParameters({ params })
}
