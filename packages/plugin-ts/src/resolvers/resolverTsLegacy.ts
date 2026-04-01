import { defineResolver } from '@kubb/core'
import type { PluginTs } from '../types.ts'
import { resolverTs } from './resolverTs.ts'

/**
 * Legacy resolver for `@kubb/plugin-ts` that reproduces the naming conventions
 * used before the v2 resolver refactor. Enable via `compatibilityPreset: 'kubbV4'`
 * (or by composing this resolver manually).
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
    pluginName: 'plugin-ts',
    resolveResponseStatusName(node, statusCode) {
      if (statusCode === 'default') {
        return this.resolveTypeName(`${node.operationId} Error`)
      }
      return this.resolveTypeName(`${node.operationId} ${statusCode}`)
    },
    resolveDataName(node) {
      const suffix = node.method === 'GET' ? 'QueryRequest' : 'MutationRequest'
      return this.resolveTypeName(`${node.operationId} ${suffix}`)
    },
    resolveResponsesName(node) {
      const suffix = node.method === 'GET' ? 'Query' : 'Mutation'
      return this.resolveTypeName(`${node.operationId} ${suffix}`)
    },
    resolveResponseName(node) {
      const suffix = node.method === 'GET' ? 'QueryResponse' : 'MutationResponse'
      return this.resolveTypeName(`${node.operationId} ${suffix}`)
    },
    resolvePathParamsName(node, _param) {
      return this.resolveTypeName(`${node.operationId} PathParams`)
    },
    resolveQueryParamsName(node, _param) {
      return this.resolveTypeName(`${node.operationId} QueryParams`)
    },
    resolveHeaderParamsName(node, _param) {
      return this.resolveTypeName(`${node.operationId} HeaderParams`)
    },
  }
})
