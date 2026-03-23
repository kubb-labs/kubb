import { pascalCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginTs } from './types.ts'

function resolveName(name: string, type?: 'file' | 'function' | 'type' | 'const'): string {
  return pascalCase(name, { isFile: type === 'file' })
}

/**
 * Resolver for `@kubb/plugin-ts` that provides the default naming and path-resolution
 * helpers used by the plugin. Import this in other plugins to resolve the exact names and
 * paths that `plugin-ts` generates without hardcoding the conventions.
 *
 * The `default` method is automatically injected by `defineResolver` — it uses `camelCase`
 * for identifiers/files and `pascalCase` for type names.
 *
 * @example
 * ```ts
 * import { resolver } from '@kubb/plugin-ts'
 *
 * resolver.default('list pets', 'type')              // → 'ListPets'
 * resolver.resolveName('list pets status 200')        // → 'listPetsStatus200'
 * resolver.resolveTypedName('list pets status 200')   // → 'ListPetsStatus200'
 * resolver.resolvePathName('list pets', 'file')       // → 'listPets'
 * ```
 */
export const resolverTs = defineResolver<PluginTs>(() => {
  return {
    default(name, type) {
      return resolveName(name, type)
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
      return this.resolveName(`${node.operationId} Status ${statusCode}`)
    },
    resolveResponseStatusTypedName(node, statusCode) {
      return this.resolveTypedName(`${node.operationId} Status ${statusCode}`)
    },
    resolveDataName(node) {
      return this.resolveName(`${node.operationId} Data`)
    },
    resolveDataTypedName(node) {
      return this.resolveTypedName(`${node.operationId} Data`)
    },
    resolveRequestConfigName(node) {
      return this.resolveName(`${node.operationId} RequestConfig`)
    },
    resolveRequestConfigTypedName(node) {
      return this.resolveTypedName(`${node.operationId} RequestConfig`)
    },
    resolveResponsesName(node) {
      return this.resolveName(`${node.operationId} Responses`)
    },
    resolveResponsesTypedName(node) {
      return this.resolveTypedName(`${node.operationId} Responses`)
    },
    resolveResponseName(node) {
      return this.resolveName(`${node.operationId} Response`)
    },
    resolveResponseTypedName(node) {
      return this.resolveTypedName(`${node.operationId} Response`)
    },
    resolveEnumKeyTypedName(node) {
      return `${this.resolveTypedName(node.name ?? '')}Key`
    },
    resolvePathParamsName(_node) {
      throw new Error('resolvePathParamsName is only available in legacy mode (legacy: true). Use resolveParamName per individual parameter instead.')
    },
    resolvePathParamsTypedName(_node) {
      throw new Error('resolvePathParamsTypedName is only available in legacy mode (legacy: true). Use resolveParamTypedName per individual parameter instead.')
    },
    resolveQueryParamsName(node) {
      return this.resolveName(`${node.operationId} QueryParams`)
    },
    resolveQueryParamsTypedName(node) {
      return this.resolveTypedName(`${node.operationId} QueryParams`)
    },
    resolveHeaderParamsName(_node) {
      throw new Error('resolveHeaderParamsName is only available in legacy mode (legacy: true). Use resolveParamName per individual parameter instead.')
    },
    resolveHeaderParamsTypedName(_node) {
      throw new Error(
        'resolveHeaderParamsTypedName is only available in legacy mode (legacy: true). Use resolveParamTypedName per individual parameter instead.',
      )
    },
  }
})

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
  }
})
