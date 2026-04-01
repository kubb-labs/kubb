import { camelCase, pascalCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginZod } from '../types.ts'

/**
 * Default resolver for `@kubb/plugin-zod`.
 *
 * Uses `camelCase` naming with a `Schema` suffix for function/type/const names.
 *
 * @example
 * ```ts
 * resolverZod.default('list pets', 'function') // → 'listPetsSchema'
 * resolverZod.default('Pet', 'file')           // → 'pet'
 * resolverZod.resolveName('list pets')          // → 'listPetsSchema'
 * ```
 */
export const resolverZod = defineResolver<PluginZod>(() => {
  return {
    name: 'default',
    pluginName: 'plugin-zod',
    default(name, type) {
      return camelCase(name, { isFile: type === 'file', suffix: type ? 'schema' : undefined })
    },
    resolveSchemaName(name) {
      return camelCase(name, { suffix: 'schema' })
    },
    resolveSchemaTypeName(name) {
      return pascalCase(name, { suffix: 'schema' })
    },
    resolveTypeName(name) {
      return pascalCase(name)
    },
    resolvePathName(name, type) {
      return this.default(name, type)
    },
    resolveParamName(node, param) {
      return this.resolveSchemaName(`${node.operationId} ${param.in} ${param.name}`)
    },
    resolveResponseStatusName(node, statusCode) {
      return this.resolveSchemaName(`${node.operationId} Status ${statusCode}`)
    },
    resolveDataName(node) {
      return this.resolveSchemaName(`${node.operationId} Data`)
    },
    resolveResponsesName(node) {
      return this.resolveSchemaName(`${node.operationId} Responses`)
    },
    resolveResponseName(node) {
      return this.resolveSchemaName(`${node.operationId} Response`)
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
