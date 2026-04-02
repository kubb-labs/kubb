import { camelCase } from '@internals/utils'
import type { RootNode } from '@kubb/ast/types'
import type { ResolveBannerContext } from '@kubb/core'
import { buildDefaultBanner, defineResolver } from '@kubb/core'
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
  resolveBanner(node: RootNode | null, { output, config }: ResolveBannerContext) {
    let defaultBanner = ''
    if (config?.output?.defaultBanner !== false) {
      defaultBanner = buildDefaultBanner({
        title: node?.meta?.title,
        description: node?.meta?.description,
        version: node?.meta?.version,
        config,
      })
    }

    if (!output?.banner) {
      return defaultBanner || undefined
    }

    if (typeof output.banner === 'function') {
      return node ? `${output.banner(node)}\n${defaultBanner}` : defaultBanner || undefined
    }

    return `${output.banner}\n${defaultBanner}`
  },
}))
