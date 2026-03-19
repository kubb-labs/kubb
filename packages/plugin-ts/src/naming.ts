import { pascalCase } from '@internals/utils'
import { defineNaming } from '@kubb/core'
import type { Naming, NamingResolveName } from '@kubb/core'

/**
 * Resolver function for converting a raw name (and optional entity type) into
 * a string identifier. Alias of `NamingResolveName` from `@kubb/core` exposed
 * for convenience when importing directly from `@kubb/plugin-ts`.
 */
export type ResolveName = NamingResolveName

/**
 * The default `resolveName` used by plugin-ts.
 * Applies `pascalCase` to the name, matching plugin-ts's own `resolveName` implementation.
 */
export const defaultResolveName: ResolveName = ({ name, type }) => pascalCase(name, { isFile: type === 'file' })

/**
 * Centralised naming object for plugin-ts generated types.
 *
 * Import this in other plugins to compute the exact names that plugin-ts
 * generates without hardcoding naming conventions. Each method accepts an
 * optional `resolveName` override to apply user-configured name transformers.
 * The `naming.pluginName` property provides the plugin name for use with
 * `driver.resolveName`.
 *
 * @example
 * ```ts
 * import { naming } from '@kubb/plugin-ts'
 *
 * // default (pascalCase, same as plugin-ts internals)
 * naming.getResponseStatusName({ operationId: 'listPets' }, 200) // → 'ListPetsStatus200'
 *
 * // with driver resolver to apply user transformers
 * naming.getRequestBodyName(operationNode, {
 *   resolveName: ({ name, type }) => driver.resolveName({ name, type, pluginName: naming.pluginName }),
 * })
 * ```
 */
export const naming: Naming<'plugin-ts'> = defineNaming('plugin-ts', {
  getSchemaName(node, { type = 'type', resolveName = defaultResolveName } = {}) {
    if (!node.name) {
      throw new Error('Schema node does not have a name')
    }

    return resolveName({ name: node.name, type })
  },

  getParameterName(node, param, { type = 'type', resolveName = defaultResolveName } = {}) {
    return resolveName({ name: `${node.operationId} ${pascalCase(param.in)} ${param.name}`, type })
  },

  getResponseStatusName(node, statusCode, { type = 'type', resolveName = defaultResolveName } = {}) {
    return resolveName({ name: `${node.operationId} Status ${statusCode}`, type })
  },

  getRequestBodyName(node, { type = 'type', resolveName = defaultResolveName } = {}) {
    return resolveName({ name: `${node.operationId} Data`, type })
  },

  getRequestConfigName(node, { type = 'type', resolveName = defaultResolveName } = {}) {
    return resolveName({ name: `${node.operationId} RequestConfig`, type })
  },

  getResponsesName(node, { type = 'type', resolveName = defaultResolveName } = {}) {
    return resolveName({ name: `${node.operationId} Responses`, type })
  },

  getResponseName(node, { type = 'type', resolveName = defaultResolveName } = {}) {
    return resolveName({ name: `${node.operationId} Response`, type })
  },
})
