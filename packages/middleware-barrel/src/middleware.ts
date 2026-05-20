import path from 'node:path'
import { resolve } from 'node:path'
import { defineMiddleware } from '@kubb/core'
import type { Middleware } from '@kubb/core'
import type { BarrelConfig, PluginBarrelConfig } from './types.ts'
import { getBarrelFiles, getPluginOutputPrefix, isExcludedPath } from './utils.ts'

declare global {
  namespace Kubb {
    interface PluginOptionsRegistry {
      output: {
        /**
         * Barrel configuration for this plugin's output.
         * Set to `false` to disable barrel generation for this plugin entirely; doing so also
         * excludes the plugin's files from the root barrel.
         *
         * Falls back to `config.output.barrel` when omitted.
         *
         * @default { type: 'named' }
         */
        barrel?: PluginBarrelConfig | false
      }
    }
    interface ConfigOptionsRegistry {
      output: {
        /**
         * Barrel configuration for the root barrel file at `config.output.path/index.ts`.
         * Set to `false` to disable root barrel generation. Individual plugins can override
         * this via their own `output.barrel`.
         *
         * @default { type: 'named' }
         */
        barrel?: BarrelConfig | false
      }
    }
  }
}

/**
 * Canonical middleware name for `@kubb/middleware-barrel`. Used for driver
 * lookups.
 */
export const middlewareBarrelName = 'middleware-barrel' satisfies Middleware['name']

/**
 * Generates an `index.ts` for every plugin output directory and one root
 * barrel at `config.output.path/index.ts` after the build completes. Ships
 * with Kubb and is registered by default in `defineConfig`.
 *
 * Each plugin inherits `output.barrel` from `config.output.barrel` (which
 * defaults to `{ type: 'named' }`). Set `barrel: false` on a plugin to skip
 * its barrel and also exclude its files from the root barrel.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@kubb/core'
 * import { middlewareBarrel } from '@kubb/middleware-barrel'
 * import { pluginTs } from '@kubb/plugin-ts'
 * import { pluginZod } from '@kubb/plugin-zod'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: 'src/gen', barrel: { type: 'named' } },
 *   plugins: [
 *     pluginTs({ output: { path: 'types', barrel: { type: 'all' } } }),
 *     pluginZod({ output: { path: 'schemas' } }),
 *   ],
 *   middleware: [middlewareBarrel()],
 * })
 * ```
 */
export const middlewareBarrel = defineMiddleware(() => {
  const excludedPrefixes = new Set<string>()

  return {
    name: middlewareBarrelName,
    hooks: {
      'kubb:plugin:end'({ plugin, config, files, upsertFile }) {
        const pluginBarrel = plugin.options.output?.barrel
        const configBarrel = config.output.barrel
        const defaultBarrel = { type: 'named' } as const

        // Root config barrel doesn't have nested, so we add it
        const barrelConfig: PluginBarrelConfig | false = (() => {
          if (pluginBarrel !== undefined) return pluginBarrel
          if (configBarrel !== undefined) return configBarrel === false ? false : { ...configBarrel, nested: false }
          return defaultBarrel
        })()

        if (barrelConfig === false) {
          excludedPrefixes.add(getPluginOutputPrefix(plugin, config))
          return
        }

        const barrelType = barrelConfig.type
        const nested = barrelConfig.nested ?? false

        const base = resolve(config.root, config.output.path)
        const target = resolve(base, plugin.options.output.path)
        const relative = path.relative(base, target)
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
          throw new Error('Invalid output path')
        }
        for (const file of getBarrelFiles({ outputPath: target, files, barrelType, nested, recursive: true })) {
          upsertFile(file)
        }
      },
      'kubb:plugins:end'({ files, config, upsertFile }) {
        const barrelConfig = config.output.barrel ?? { type: 'named' }

        const filteredFiles = excludedPrefixes.size === 0 ? files : files.filter((f) => !isExcludedPath(f.path, excludedPrefixes))
        excludedPrefixes.clear()

        if (barrelConfig === false) return

        const barrelType = barrelConfig.type

        for (const file of getBarrelFiles({ outputPath: resolve(config.root, config.output.path), files: filteredFiles, barrelType })) {
          upsertFile(file)
        }
      },
    },
  }
})
