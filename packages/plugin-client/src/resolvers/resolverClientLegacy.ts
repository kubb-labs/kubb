import { camelCase } from '@internals/utils'
import type { RootNode } from '@kubb/ast/types'
import type { ResolveBannerContext } from '@kubb/core'
import { buildDefaultBanner, defineResolver } from '@kubb/core'
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
