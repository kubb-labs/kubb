import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginCypress } from '../types.ts'

/**
 * Resolver for `@kubb/plugin-cypress` that provides the default naming and
 * path-resolution helpers used by the plugin.
 *
 * Import this in other plugins to resolve the exact names and paths that
 * `plugin-cypress` generates without hardcoding the conventions.
 *
 * @example
 * ```ts
 * import { resolverCypress } from '@kubb/plugin-cypress/resolvers'
 *
 * resolverCypress.default('list pets', 'function') // → 'listPets'
 * resolverCypress.resolveName('show pet by id')    // → 'showPetById'
 * ```
 */
export const resolverCypress = defineResolver<PluginCypress>(() => ({
  name: 'default',
  pluginName: 'plugin-cypress',
  default(name, type) {
    return camelCase(name, { isFile: type === 'file' })
  },
  resolveName(name) {
    return this.default(name, 'function')
  },
}))
