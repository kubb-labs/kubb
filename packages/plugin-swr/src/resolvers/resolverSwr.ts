import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginSwr } from '../types.ts'

/**
 * Resolver for `@kubb/plugin-swr` that provides the default naming
 * and path-resolution helpers used by the plugin.
 *
 * @example
 * ```ts
 * import { resolverSwr } from '@kubb/plugin-swr'
 *
 * resolverSwr.default('list pets', 'function') // -> 'listPets'
 * resolverSwr.resolveName('show pet by id')    // -> 'showPetById'
 * ```
 */
export const resolverSwr = defineResolver<PluginSwr>(() => ({
  name: 'default',
  pluginName: 'plugin-swr',
  default(name, type) {
    return camelCase(name, { isFile: type === 'file' })
  },
  resolveName(name) {
    return this.default(name, 'function')
  },
}))
