import { pascalCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginTs } from './types.ts'

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
    default(name, type) {
      return pascalCase(name, { isFile: type === 'file' })
    },
    resolveName(name) {
      return this.default(name, 'function')
    },
    resolveTypedName(name) {
      return this.default(name, 'type')
    },
    resolvePathName(name, type) {
      return this.default(name, type)
    },
    resolveParamName(node, param) {
      return this.resolveName(`${node.operationId} ${this.default(param.in)} ${param.name}`)
    },
    resolveParamTypedName(node, param) {
      return this.resolveTypedName(`${node.operationId} ${this.default(param.in)} ${param.name}`)
    },
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
      const isGet = node.method.toLowerCase() === 'get'
      return this.resolveName(`${node.operationId} ${isGet ? 'Query' : 'Mutation'} Request`)
    },
    resolveDataTypedName(node) {
      const isGet = node.method.toLowerCase() === 'get'
      return this.resolveTypedName(`${node.operationId} ${isGet ? 'Query' : 'Mutation'} Request`)
    },
    resolveRequestConfigName(node) {
      return this.resolveName(`${node.operationId} RequestConfig`)
    },
    resolveRequestConfigTypedName(node) {
      return this.resolveTypedName(`${node.operationId} RequestConfig`)
    },
    resolveResponsesName(node) {
      const isGet = node.method.toLowerCase() === 'get'
      return this.resolveName(`${node.operationId} ${isGet ? 'Query' : 'Mutation'}`)
    },
    resolveResponsesTypedName(node) {
      const isGet = node.method.toLowerCase() === 'get'
      return this.resolveTypedName(`${node.operationId} ${isGet ? 'Query' : 'Mutation'}`)
    },
    resolveResponseName(node) {
      const isGet = node.method.toLowerCase() === 'get'
      return this.resolveName(`${node.operationId} ${isGet ? 'Query' : 'Mutation'} Response`)
    },
    resolveResponseTypedName(node) {
      const isGet = node.method.toLowerCase() === 'get'
      return this.resolveTypedName(`${node.operationId} ${isGet ? 'Query' : 'Mutation'} Response`)
    },
    resolveEnumKeyTypedName(node) {
      return `${this.resolveTypedName(node.name ?? '')}Key`
    },
  }
})
