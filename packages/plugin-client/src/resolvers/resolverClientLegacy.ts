import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginClient } from '../types.ts'

/**
 * Legacy resolver for `@kubb/plugin-client` that provides backward-compatible
 * naming conventions matching the v4 behavior.
 *
 * @example
 * ```ts
 * import { resolverClientLegacy } from '@kubb/plugin-client'
 *
 * resolverClientLegacy.default('list pets', 'function') // -> 'listPets'
 * resolverClientLegacy.resolveName('show pet by id')    // -> 'showPetById'
 * ```
 */
export const resolverClientLegacy = defineResolver<PluginClient>(() => ({
  name: 'kubbV4',
  pluginName: 'plugin-client',
  default(name, type) {
    return camelCase(name, { isFile: type === 'file' })
  },
  resolveName(name) {
    return this.default(name, 'function')
  },
}))
