import { caseParams } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { TypeNames } from './components/Request.tsx'
import type { ResolvedOptions } from './types.ts'

/**
 * Returns true when the resolver is using the kubbV4 compatibility preset (legacy mode).
 * In legacy mode the resolver provides grouped param types (`DeletePetPathParams`) rather
 * than per-parameter types (`DeletePetPathPetId`).
 */
function isLegacyResolver(resolver: ResolverTs, node: OperationNode): boolean {
  try {
    resolver.resolvePathParamsTypedName?.(node)
    return typeof resolver.resolvePathParamsTypedName === 'function'
  } catch {
    return false
  }
}

export function buildTypeNames({
  node,
  paramsCasing,
  resolver,
}: {
  node: OperationNode
  paramsCasing: ResolvedOptions['paramsCasing']
  resolver: ResolverTs
}): TypeNames {
  const originalPathParams = node.parameters.filter((p) => p.in === 'path')
  const originalQueryParams = node.parameters.filter((p) => p.in === 'query')
  const originalHeaderParams = node.parameters.filter((p) => p.in === 'header')

  const casedPathParams = caseParams(originalPathParams, paramsCasing)
  const casedQueryParams = caseParams(originalQueryParams, paramsCasing)
  const casedHeaderParams = caseParams(originalHeaderParams, paramsCasing)

  const legacy = isLegacyResolver(resolver, node)

  const pathParams = casedPathParams.map((casedParam, i) => ({
    name: casedParam.name,
    originalName: originalPathParams[i]!.name,
    typedName: legacy ? resolver.resolvePathParamsTypedName!(node) : resolver.resolveParamTypedName(node, originalPathParams[i]!),
    required: casedParam.required,
  }))

  const queryParams = casedQueryParams.map((casedParam, i) => ({
    name: casedParam.name,
    originalName: originalQueryParams[i]!.name,
    typedName: legacy ? resolver.resolveQueryParamsTypedName!(node) : resolver.resolveParamTypedName(node, originalQueryParams[i]!),
    required: casedParam.required,
  }))

  const headerParams = casedHeaderParams.map((casedParam, i) => ({
    name: casedParam.name,
    originalName: originalHeaderParams[i]!.name,
    typedName: legacy ? resolver.resolveHeaderParamsTypedName!(node) : resolver.resolveParamTypedName(node, originalHeaderParams[i]!),
    required: casedParam.required,
  }))

  const requestBody = node.requestBody?.schema
    ? {
        typedName: resolver.resolveDataTypedName(node),
      }
    : undefined

  const response = {
    typedName: resolver.resolveResponseTypedName(node),
  }

  const grouped: TypeNames['grouped'] = legacy
    ? {
        pathParams: originalPathParams.length > 0 ? resolver.resolvePathParamsTypedName!(node) : undefined,
        queryParams: originalQueryParams.length > 0 ? resolver.resolveQueryParamsTypedName!(node) : undefined,
        headerParams: originalHeaderParams.length > 0 ? resolver.resolveHeaderParamsTypedName!(node) : undefined,
      }
    : undefined

  return { pathParams, queryParams, headerParams, requestBody, response, grouped }
}
