import { caseParams } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { ResolverTs } from '@kubb/plugin-ts'

/**
 * Pre-computed type name strings for an operation, derived from the
 * TypeScript resolver. Passed from the generator to components so that
 * components never depend on the resolver directly.
 */
export type TypeNames = {
  pathParams: Array<{ name: string; originalName: string; typedName: string; required: boolean }>
  queryParams: Array<{ name: string; originalName: string; typedName: string; required: boolean }>
  headerParams: Array<{ name: string; originalName: string; typedName: string; required: boolean }>
  requestBody?: { typedName: string; required: boolean }
  response: { typedName: string }
}

/**
 * Builds a `TypeNames` object for the given operation node using the `plugin-ts` resolver.
 * Names are resolved through the TS resolver so they respect the user's `compatibilityPreset`.
 */
export function buildTypeNames({
  node,
  paramsCasing,
  resolver,
}: {
  node: OperationNode
  paramsCasing: 'camelcase' | undefined
  resolver: ResolverTs
}): TypeNames {
  const casedParams = caseParams(node.parameters, paramsCasing)

  const pathParams = casedParams
    .filter((p) => p.in === 'path')
    .map((p) => ({
      name: p.name,
      originalName:
        node.parameters.find((op) => op.in === 'path' && (op.name === p.name || resolver.resolveParamName(node, op) === resolver.resolveParamName(node, p)))
          ?.name ?? p.name,
      typedName: resolver.resolveParamName(node, p),
      required: p.required ?? false,
    }))

  const queryParams = casedParams
    .filter((p) => p.in === 'query')
    .map((p) => ({
      name: p.name,
      originalName:
        node.parameters.find((op) => op.in === 'query' && (op.name === p.name || resolver.resolveParamName(node, op) === resolver.resolveParamName(node, p)))
          ?.name ?? p.name,
      typedName: resolver.resolveParamName(node, p),
      required: p.required ?? false,
    }))

  const headerParams = casedParams
    .filter((p) => p.in === 'header')
    .map((p) => ({
      name: p.name,
      originalName:
        node.parameters.find((op) => op.in === 'header' && (op.name === p.name || resolver.resolveParamName(node, op) === resolver.resolveParamName(node, p)))
          ?.name ?? p.name,
      typedName: resolver.resolveParamName(node, p),
      required: p.required ?? false,
    }))

  const requestBody = node.requestBody?.schema
    ? {
        typedName: resolver.resolveDataName(node),
        required: node.requestBody.required ?? false,
      }
    : undefined

  const response = {
    typedName: resolver.resolveResponseName(node),
  }

  return { pathParams, queryParams, headerParams, requestBody, response }
}
