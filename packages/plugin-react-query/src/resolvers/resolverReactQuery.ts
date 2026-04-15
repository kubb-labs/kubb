import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginReactQuery } from '../types.ts'

/**
 * Resolver for `@kubb/plugin-react-query` that provides the default naming
 * and path-resolution helpers used by the plugin.
 *
 * @example
 * ```ts
 * import { resolverReactQuery } from '@kubb/plugin-react-query'
 *
 * resolverReactQuery.default('list pets', 'function') // -> 'listPets'
 * resolverReactQuery.resolveName('show pet by id')    // -> 'showPetById'
 * ```
 */
export const resolverReactQuery = defineResolver<PluginReactQuery>(() => ({
  name: 'default',
  pluginName: 'plugin-react-query',
  default(name, type) {
    return camelCase(name, { isFile: type === 'file' })
  },
  resolveName(name) {
    return this.default(name, 'function')
  },
}))
