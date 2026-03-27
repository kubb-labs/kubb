import { pascalCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginTs } from '../types.ts'

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
 * resolver.resolveName('list pets status 200')        // → 'ListPetsStatus200'
 * resolver.resolvePathName('list pets', 'file')       // → 'listPets'
 * ```
 */
export const resolverTs = defineResolver<PluginTs>(() => {
  return {
    name: 'default',
    pluginName: 'plugin-ts',
    default(name, type) {
      return resolveName(name, type)
    },
    resolveName(name) {
      return this.default(name, 'function')
    },
    resolvePathName(name, type) {
      return this.default(name, type)
    },
    resolveParamName(node, param) {
      return this.resolveName(`${node.operationId} ${param.in} ${param.name}`)
    },
    resolveResponseStatusName(node, statusCode) {
      return this.resolveName(`${node.operationId} Status ${statusCode}`)
    },
    resolveDataName(node) {
      return this.resolveName(`${node.operationId} Data`)
    },
    resolveRequestConfigName(node) {
      return this.resolveName(`${node.operationId} RequestConfig`)
    },
    resolveResponsesName(node) {
      return this.resolveName(`${node.operationId} Responses`)
    },
    resolveResponseName(node) {
      return this.resolveName(`${node.operationId} Response`)
    },
    resolveEnumKeyName(node, enumTypeSuffix = 'key') {
      return `${this.resolveName(node.name ?? '')}${enumTypeSuffix}`
    },
    resolvePathParamsName(node, param) {
      return this.resolveParamName(node, param)
    },
    resolveQueryParamsName(node, param) {
      return this.resolveParamName(node, param)
    },
    resolveHeaderParamsName(node, param) {
      return this.resolveParamName(node, param)
    },
  }
})
