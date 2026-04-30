import path from 'node:path'
import { resolve } from 'node:path'
import { defineMiddleware } from '@kubb/core'
import type { Middleware } from '@kubb/core'
import type { BarrelConfig, PluginBarrelConfig } from './types.ts'
import { getPluginOutputPrefix, isExcludedPath } from './utils/excludedPaths.ts'
import { getBarrelFiles } from './utils/getBarrelFiles.ts'

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
 * Generates `index.ts` barrel files for each plugin and a root barrel at `config.output.path/index.ts`.
 *
 * Each plugin inherits `output.barrel` from `config.output.barrel` (defaults to `{ type: 'named' }`).
 * Set `barrel: false` on a plugin to disable its barrel and exclude it from the root barrel.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@kubb/core'
 * import { middlewareBarrel } from '@kubb/middleware-barrel'
 *
 * export default defineConfig({
 *   output: { path: 'src/gen', barrel: { type: 'named' } },
 *   plugins: [
 *     pluginTs({ output: { path: 'types', barrel: { type: 'all' } } }),
 *     pluginZod({ output: { path: 'schemas' } }),
 *   ],
 *   middleware: [middlewareBarrel()],
 * })
 * ```
 */

/**
 * Stable string identifier for the barrel middleware.
 */
export const middlewareBarrelName = 'middleware-barrel' satisfies Middleware['name']

export const middlewareBarrel = defineMiddleware(() => {
  const excludedPrefixes = new Set<string>()

  return {
    name: middlewareBarrelName,
    hooks: {
      'kubb:plugin:end'({ plugin, config, files, upsertFile }) {
        const barrelConfig = plugin.options.output?.barrel ?? config.output.barrel ?? { type: 'named' }

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
        const barrelFiles = getBarrelFiles({
          outputPath: target,
          files,
          barrelType,
          nested,
          recursive: true,
        })

        if (barrelFiles.length > 0) {
          upsertFile(...barrelFiles)
        }
      },
      'kubb:plugins:end'({ files, config, upsertFile }) {
        const barrelConfig = config.output.barrel ?? { type: 'named' }

        const filteredFiles = excludedPrefixes.size === 0 ? files : files.filter((f) => !isExcludedPath(f.path, excludedPrefixes))
        excludedPrefixes.clear()

        if (barrelConfig === false) return

        const barrelType = barrelConfig.type

        const rootBarrelFiles = getBarrelFiles({
          outputPath: resolve(config.root, config.output.path),
          files: filteredFiles,
          barrelType,
        })

        if (rootBarrelFiles.length > 0) {
          upsertFile(...rootBarrelFiles)
        }
      },
    },
  }
})
