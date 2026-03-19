import { pascalCase } from '@internals/utils'
import { createResolver } from '@kubb/core'
import type { PluginTs, PluginTsResolver } from './types.ts'
export type { PluginTsResolver } from './types.ts'

function resolveName(name: string, type?: 'file' | 'function' | 'type' | 'const'): string {
  return pascalCase(name, { isFile: type === 'file' })
}

/**
 * Resolver for `@kubb/plugin-ts` that provides the default naming and path-resolution
 * helpers used by the plugin. Import this in other plugins to resolve the exact names and
 * paths that `plugin-ts` generates without hardcoding the conventions.
 *
 * @example
 * ```ts
 * import { resolver } from '@kubb/plugin-ts'
 *
 * resolver.default('list pets', 'type')              // → 'ListPets'
 * resolver.resolveName('list pets status 200')        // → 'ListPetsStatus200'
 * resolver.resolveTypedName('list pets status 200')   // → 'ListPetsStatus200'
 * resolver.resolvePathName('list pets', 'file')       // → 'ListPets'
 * ```
 */
export const resolver: PluginTsResolver = createResolver<PluginTs>(() => {
  return {
    default: resolveName,
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
  }
})
