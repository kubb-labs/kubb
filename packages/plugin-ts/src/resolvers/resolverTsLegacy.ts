import { defineResolver } from '@kubb/core'
import { buildLegacyResponsesSchemaNode, buildLegacyResponseUnionSchemaNode } from '../generators/utils.ts'
import type { PluginTs } from '../types.ts'
import { resolverTs } from './resolverTs.ts'

/**
 * Legacy resolver for `@kubb/plugin-ts` that reproduces the naming conventions
 * used before the v2 resolver refactor. Enable via `legacy: true` in plugin options.
 *
 * Key differences from the default resolver:
 * - Response status types: `<OperationId><StatusCode>` (e.g. `CreatePets201`) instead of `<OperationId>Status201`
 * - Default/error responses: `<OperationId>Error` instead of `<OperationId>StatusDefault`
 * - Request body: `<OperationId>MutationRequest` (non-GET) / `<OperationId>QueryRequest` (GET)
 * - Combined responses type: `<OperationId>Mutation` / `<OperationId>Query`
 * - Response union: `<OperationId>MutationResponse` / `<OperationId>QueryResponse`
 *
 * @example
 * ```ts
 * import { resolverTsLegacy } from '@kubb/plugin-ts'
 *
 * resolverTsLegacy.resolveResponseStatusTypedName(node, 201)  // → 'CreatePets201'
 * resolverTsLegacy.resolveResponseStatusTypedName(node, 'default')  // → 'CreatePetsError'
 * resolverTsLegacy.resolveDataTypedName(node)  // → 'CreatePetsMutationRequest' (POST)
 * resolverTsLegacy.resolveResponsesTypedName(node)  // → 'CreatePetsMutation' (POST)
 * resolverTsLegacy.resolveResponseTypedName(node)  // → 'CreatePetsMutationResponse' (POST)
 * ```
 */
export const resolverTsLegacy = defineResolver<PluginTs>(() => {
  return {
    ...resolverTs,
    name: 'legacy',
    resolveResponseStatusName(node, statusCode) {
      if (statusCode === 'default') {
        return this.resolveName(`${node.operationId} Error`)
      }
      return this.resolveName(`${node.operationId} ${statusCode}`)
    },
    resolveResponseStatusTypedName(node, statusCode) {
      if (statusCode === 'default') {
        return this.resolveTypedName(`${node.operationId} Error`)
      }
      return this.resolveTypedName(`${node.operationId} ${statusCode}`)
    },
    resolveDataName(node) {
      const suffix = node.method === 'GET' ? 'QueryRequest' : 'MutationRequest'
      return this.resolveName(`${node.operationId} ${suffix}`)
    },
    resolveDataTypedName(node) {
      const suffix = node.method === 'GET' ? 'QueryRequest' : 'MutationRequest'
      return this.resolveTypedName(`${node.operationId} ${suffix}`)
    },
    resolveResponsesName(node) {
      const suffix = node.method === 'GET' ? 'Query' : 'Mutation'
      return `${this.default(node.operationId, 'function')}${suffix}`
    },
    resolveResponsesTypedName(node) {
      const suffix = node.method === 'GET' ? 'Query' : 'Mutation'
      return `${this.default(node.operationId, 'type')}${suffix}`
    },
    resolveResponseName(node) {
      const suffix = node.method === 'GET' ? 'QueryResponse' : 'MutationResponse'
      return this.resolveName(`${node.operationId} ${suffix}`)
    },
    resolveResponseTypedName(node) {
      const suffix = node.method === 'GET' ? 'QueryResponse' : 'MutationResponse'
      return this.resolveTypedName(`${node.operationId} ${suffix}`)
    },
    resolvePathParamsName(node) {
      return this.resolveName(`${node.operationId} PathParams`)
    },
    resolvePathParamsTypedName(node) {
      return this.resolveTypedName(`${node.operationId} PathParams`)
    },
    resolveQueryParamsName(node) {
      return this.resolveName(`${node.operationId} QueryParams`)
    },
    resolveQueryParamsTypedName(node) {
      return this.resolveTypedName(`${node.operationId} QueryParams`)
    },
    resolveHeaderParamsName(node) {
      return this.resolveName(`${node.operationId} HeaderParams`)
    },
    resolveHeaderParamsTypedName(node) {
      return this.resolveTypedName(`${node.operationId} HeaderParams`)
    },
    /**
     * Overrides `resolveParamName` to handle synthetic grouped `ParameterNode`s
     * created by `createLegacyOperationTransformer` (those with `name === 'Params'`).
     *
     * Using the dedicated `resolvePathParamsName` / `resolveQueryParamsName` /
     * `resolveHeaderParamsName` methods avoids the `this.default(param.in)` intermediate
     * step that would cause double-wrapping when the resolver's `default()` function is
     * overridden (e.g. in tests that append a naming suffix).
     */
    resolveParamName(node, param) {
      if (param.name === 'Params') {
        switch (param.in) {
          case 'path':
            return this.resolvePathParamsName!(node)
          case 'query':
            return this.resolveQueryParamsName!(node)
          case 'header':
            return this.resolveHeaderParamsName!(node)
        }
      }

      return resolverTs.resolveParamName.call(this, node, param)
    },
    /**
     * Overrides `resolveParamTypedName` to handle synthetic grouped `ParameterNode`s.
     *
     * See {@link resolveParamName} for details on why this override is necessary.
     */
    resolveParamTypedName(node, param) {
      if (param.name === 'Params') {
        switch (param.in) {
          case 'path':
            return this.resolvePathParamsTypedName!(node)
          case 'query':
            return this.resolveQueryParamsTypedName!(node)
          case 'header':
            return this.resolveHeaderParamsTypedName!(node)
        }
      }

      return resolverTs.resolveParamTypedName.call(this, node, param)
    },
    buildDataSchema(_node) {
      return null
    },
    buildResponsesSchema(node) {
      return buildLegacyResponsesSchemaNode({ node, resolver: this })
    },
    buildResponseSchema(node) {
      return buildLegacyResponseUnionSchemaNode({ node, resolver: this })
    },
  }
})
