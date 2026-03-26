import { caseParams } from '@kubb/ast'
import { defineBuilder } from '@kubb/core'
import type { OperationNode } from '@kubb/ast/types'
import { resolverTs } from '@kubb/plugin-ts/resolvers'
import type { TypeNames } from '../components/Request.tsx'
import type { PluginCypress } from '../types.ts'

/**
 * Default builder for `@kubb/plugin-cypress`.
 *
 * Provides schema-building helpers used by the Cypress generator to pre-compute
 * type name information for each API operation (path params, query params, header params,
 * request body, and response), delegating naming conventions to the plugin-ts resolver.
 *
 * @example
 * ```ts
 * import { builderCypress } from '@kubb/plugin-cypress/builders'
 *
 * const typeNames = builderCypress.buildTypeNames({ node, paramsCasing: 'camelcase' })
 * ```
 */
export const builderCypress = defineBuilder<PluginCypress>(() => ({
  name: 'default',
  buildTypeNames({
    node,
    paramsCasing,
  }: {
    node: OperationNode
    paramsCasing: PluginCypress['resolvedOptions']['paramsCasing']
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
      typedName: resolverTs.resolveParamTypedName(node, originalPathParams[i]!),
      required: casedParam.required,
    }))

    const queryParams = casedQueryParams.map((casedParam, i) => ({
      name: casedParam.name,
      originalName: originalQueryParams[i]!.name,
      typedName: resolverTs.resolveParamTypedName(node, originalQueryParams[i]!),
      required: casedParam.required,
    }))

    const headerParams = casedHeaderParams.map((casedParam, i) => ({
      name: casedParam.name,
      originalName: originalHeaderParams[i]!.name,
      typedName: resolverTs.resolveParamTypedName(node, originalHeaderParams[i]!),
      required: casedParam.required,
    }))

    const requestBody = node.requestBody?.schema
      ? {
          typedName: resolverTs.resolveDataTypedName(node),
        }
      : undefined

    const response = {
      typedName: resolverTs.resolveResponseTypedName(node),
    }

    return { pathParams, queryParams, headerParams, requestBody, response }
  },
}))
