import { camelCase } from '@internals/utils'
import { defineResolver } from '@kubb/core'
import type { PluginMcp } from '../types.ts'

/**
 * Resolver for `@kubb/plugin-mcp` that provides the default naming
 * and path-resolution helpers used by the plugin.
 *
 * @example
 * ```ts
 * import { resolverMcp } from '@kubb/plugin-mcp'
 *
 * resolverMcp.default('addPet', 'function') // -> 'addPetHandler'
 * resolverMcp.resolveName('show pet by id')  // -> 'showPetByIdHandler'
 * ```
 */
export const resolverMcp = defineResolver<PluginMcp>(() => ({
  name: 'default',
  pluginName: 'plugin-mcp',
  default(name, type) {
    if (type === 'file') {
      return camelCase(name, { isFile: true })
    }
    return camelCase(name, { suffix: 'handler' })
  },
  resolveName(name) {
    return this.default(name, 'function')
  },
}))
