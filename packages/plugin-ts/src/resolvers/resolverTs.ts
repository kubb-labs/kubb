import { pascalCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginTs } from '../types.ts'

function resolveName(name: string, type?: 'file' | 'function' | 'type' | 'const'): string {
  return pascalCase(name, { isFile: type === 'file' })
}

//TODO should be resolverTs({}).resolveName so we can pass options like output: tsPlugin.options.output, group: tsPlugin.options.group

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
    name: 'default',
    pluginName: 'plugin-ts',
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
    resolveEnumKeyTypedName(node, enumTypeSuffix = 'key') {
      return `${this.resolveTypedName(node.name ?? '')}${enumTypeSuffix}`
    },
    resolvePathParamsName(_node) {
      throw new Error("resolvePathParamsName is only available with compatibilityPreset: 'kubbV4'. Use resolveParamName per individual parameter instead.")
    },
    resolvePathParamsTypedName(_node) {
      throw new Error(
        "resolvePathParamsTypedName is only available with compatibilityPreset: 'kubbV4'. Use resolveParamTypedName per individual parameter instead.",
      )
    },
    resolveQueryParamsName(_node) {
      throw new Error("resolveQueryParamsName is only available with compatibilityPreset: 'kubbV4'. Use resolveParamName per individual parameter instead.")
    },
    resolveQueryParamsTypedName(_node) {
      throw new Error(
        "resolveQueryParamsTypedName is only available with compatibilityPreset: 'kubbV4'. Use resolveParamTypedName per individual parameter instead.",
      )
    },
    resolveHeaderParamsName(_node) {
      throw new Error("resolveHeaderParamsName is only available with compatibilityPreset: 'kubbV4'. Use resolveParamName per individual parameter instead.")
    },
    resolveHeaderParamsTypedName(_node) {
      throw new Error(
        "resolveHeaderParamsTypedName is only available with compatibilityPreset: 'kubbV4'. Use resolveParamTypedName per individual parameter instead.",
      )
    },
  }
})
