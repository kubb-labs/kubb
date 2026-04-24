import { defineMiddleware } from '@kubb/core'
import type { KubbBuildStartContext } from '@kubb/core'
import type { BarrelType } from './types.ts'
import { generatePerPluginBarrel } from './utils/generatePerPluginBarrel.ts'
import { generateRootBarrel } from './utils/generateRootBarrel.ts'
import { resolve } from 'node:path'

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
export const middlewareBarrel = defineMiddleware({
  name: 'middleware-barrel',
  install(hooks) {
    let ctx: KubbBuildStartContext
    const excludedPaths = new Set<string>()

    hooks.on('kubb:build:start', (buildCtx) => {
      ctx = buildCtx
    })

    hooks.on('kubb:plugin:end', ({ plugin }) => {
      if (!ctx) return

      const barrelType = plugin.options.output?.barrelType ?? ctx.config.output.barrelType ?? 'all'

      if (!barrelType) {
        excludedPaths.add(resolve(ctx.config.root, ctx.config.output.path, plugin.options.output.path))
        return
      }

      const barrelFiles = generatePerPluginBarrel({
        barrelType,
        plugin,
        files: ctx.files,
        config: ctx.config,
      })

      if (barrelFiles.length > 0) {
        ctx.upsertFile(...barrelFiles)
      }
    })

    hooks.on('kubb:plugins:end', ({ files, config, upsertFile }) => {
      const rootBarrelType = config.output.barrelType ?? 'named'
      if (!rootBarrelType) return

      const filteredFiles = excludedPaths.size > 0 ? files.filter((f) => ![...excludedPaths].some((excluded) => f.path.startsWith(excluded + '/'))) : files

      const rootBarrelFiles = generateRootBarrel({
        barrelType: rootBarrelType,
        files: filteredFiles,
        config,
      })

      if (rootBarrelFiles.length > 0) {
        upsertFile(...rootBarrelFiles)
      }
    })
  },
})
