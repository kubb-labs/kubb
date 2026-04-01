import { pascalCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginTs } from '../types.ts'

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
      return pascalCase(name, { isFile: type === 'file' })
    },
    resolveTypeName(name) {
      return pascalCase(name)
    },
    resolvePathName(name, type) {
      return pascalCase(name, { isFile: type === 'file' })
    },
    resolveParamName(node, param) {
      return this.resolveTypeName(`${node.operationId} ${param.in} ${param.name}`)
    },
    resolveResponseStatusName(node, statusCode) {
      return this.resolveTypeName(`${node.operationId} Status ${statusCode}`)
    },
    resolveDataName(node) {
      return this.resolveTypeName(`${node.operationId} Data`)
    },
    resolveRequestConfigName(node) {
      return this.resolveTypeName(`${node.operationId} RequestConfig`)
    },
    resolveResponsesName(node) {
      return this.resolveTypeName(`${node.operationId} Responses`)
    },
    resolveResponseName(node) {
      return this.resolveTypeName(`${node.operationId} Response`)
    },
    resolveEnumKeyName(node, enumTypeSuffix = 'key') {
      return `${this.resolveTypeName(node.name ?? '')}${enumTypeSuffix}`
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
