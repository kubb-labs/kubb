import { resolve } from 'node:path'
import { defineMiddleware } from '@kubb/core'
import type { KubbBuildStartContext } from '@kubb/core'
import type { BarrelType } from './types.ts'
import { getPluginOutputPrefix, isExcludedPath } from './utils/excludedPaths.ts'
import { getBarrelFiles } from './utils/getBarrelFiles.ts'

declare global {
  namespace Kubb {
    interface PluginOptionsRegistry {
      output: {
        /**
         * Re-export style for this plugin's barrel file.
         * Set to `false` to disable barrel generation for this plugin entirely; doing so also
         * excludes the plugin's files from the root barrel.
         *
         * Falls back to `config.output.barrelType` when omitted.
         *
         * @default 'named'
         */
        barrelType?: BarrelType | false
      }
    }
    interface ConfigOptionsRegistry {
      output: {
        /**
         * Re-export style for the root barrel file at `config.output.path/index.ts`.
         * Set to `false` to disable root barrel generation. Individual plugins can override
         * this via their own `output.barrelType`.
         *
         * @default 'named'
         */
        barrelType?: BarrelType | false
      }
    }
  }
}

/**
 * Generates `index.ts` barrel files for each plugin's output directory and one root barrel
 * at `config.output.path/index.ts`.
 *
 * Plugins inherit `output.barrelType` from `config.output.barrelType` (which itself defaults to `'named'`).
 * Setting `barrelType: false` on a plugin disables its barrel and excludes the plugin's files from the
 * root barrel as well.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@kubb/core'
 * import { middlewareBarrel } from '@kubb/middleware-barrel'
 *
 * export default defineConfig({
 *   output: { path: 'src/gen', barrelType: 'named' },
 *   plugins: [
 *     pluginTs({ output: { path: 'types', barrelType: 'all' } }),
 *     pluginZod({ output: { path: 'schemas' } }),
 *   ],
 *   middleware: [middlewareBarrel],
 * })
 * ```
 */

let ctx: KubbBuildStartContext | undefined
const excludedPrefixes = new Set<string>()

export const middlewareBarrel = defineMiddleware({
  name: 'middleware-barrel',
  hooks: {
    'kubb:build:start'(buildCtx) {
      ctx = buildCtx
      excludedPrefixes.clear()
    },
    'kubb:plugin:end'({ plugin }) {
      if (!ctx) return

      const barrelType = plugin.options.output?.barrelType ?? ctx.config.output.barrelType ?? 'named'

      if (!barrelType) {
        excludedPrefixes.add(getPluginOutputPrefix(plugin, ctx.config))
        return
      }

      const barrelFiles = getBarrelFiles({
        outputPath: resolve(ctx.config.root, ctx.config.output.path, plugin.options.output.path),
        files: ctx.files,
        barrelType,
        recursive: true,
      })

      if (barrelFiles.length > 0) {
        ctx.upsertFile(...barrelFiles)
      }
    },
    'kubb:plugins:end'({ files, config, upsertFile }) {
      const rootBarrelType = config.output.barrelType ?? 'named'
      if (!rootBarrelType) return

      const filteredFiles = excludedPrefixes.size === 0 ? files : files.filter((f) => !isExcludedPath(f.path, excludedPrefixes))

      const rootBarrelFiles = getBarrelFiles({
        outputPath: resolve(config.root, config.output.path),
        files: filteredFiles,
        barrelType: rootBarrelType,
      })

      if (rootBarrelFiles.length > 0) {
        upsertFile(...rootBarrelFiles)
      }
    },
  },
})
