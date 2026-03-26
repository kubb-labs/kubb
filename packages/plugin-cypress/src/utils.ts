import { caseParams } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { ResolverTs } from '@kubb/plugin-ts'
import type { TypeNames } from './components/Request.tsx'
import type { ResolvedOptions } from './types.ts'

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

  const pathParams = casedPathParams.map((casedParam, i) => ({
    name: casedParam.name,
    originalName: originalPathParams[i]!.name,
    typedName: resolver.resolveParamTypedName(node, originalPathParams[i]!),
    required: casedParam.required,
  }))

  const queryParams = casedQueryParams.map((casedParam, i) => ({
    name: casedParam.name,
    originalName: originalQueryParams[i]!.name,
    typedName: resolver.resolveParamTypedName(node, originalQueryParams[i]!),
    required: casedParam.required,
  }))

  const headerParams = casedHeaderParams.map((casedParam, i) => ({
    name: casedParam.name,
    originalName: originalHeaderParams[i]!.name,
    typedName: resolver.resolveParamTypedName(node, originalHeaderParams[i]!),
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

  return { pathParams, queryParams, headerParams, requestBody, response }
}
