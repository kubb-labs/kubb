import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginClient } from '../types.ts'

/**
 * Resolver for `@kubb/plugin-client` that provides the default naming
 * and path-resolution helpers used by the plugin.
 *
 * @example
 * ```ts
 * import { resolverClient } from '@kubb/plugin-client'
 *
 * resolverClient.default('list pets', 'function') // -> 'listPets'
 * resolverClient.resolveName('show pet by id')    // -> 'showPetById'
 * ```
 */
export const resolverClient = defineResolver<PluginClient>(() => ({
  name: 'default',
  pluginName: 'plugin-client',
  default(name, type) {
    return camelCase(name, { isFile: type === 'file' })
  },
  resolveName(name) {
    return this.default(name, 'function')
  },
}))
