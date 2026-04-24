import { defineMiddleware } from '@kubb/core'
import type { KubbBuildStartContext, NormalizedPlugin } from '@kubb/core'
import './types.ts'
import type { BarrelType } from './types.ts'
import { generatePerPluginBarrel } from './utils/generatePerPluginBarrel.ts'
import { generateRootBarrel } from './utils/generateRootBarrel.ts'


declare global {
  namespace Kubb {
    interface PluginOptionsRegistry {
      output: {
        /**
         * Controls which barrel file (index.ts) is generated for this plugin's output directory.
         *
         * - `'all'`       — `export * from '...'` for every generated file.
         * - `'named'`     — `export { … } from '...'` using the file's named exports.
         * - `'propagate'` — like `'all'` but also generates intermediate barrel files.
         * - `false`       — disable barrel generation for this plugin.
         *
         * When omitted, the root `config.output.barrelType` is used as the default.
         */
        barrelType?: BarrelType | false
      }
    }
    interface ConfigOptionsRegistry {
      output: {
        /**
         * Controls the root barrel file (index.ts) generated at `config.output.path`.
         *
         * - `'all'`       — `export * from '...'` for every plugin's barrel.
         * - `'named'`     — `export { … } from '...'` using the barrel's named exports.
         * - `'propagate'` — like `'all'` but also generates intermediate barrel files.
         * - `false`       — disable root barrel generation.
         *
         * Individual plugins can override this via their own `output.barrelType`.
         */
        barrelType?: BarrelType | false
      }
    }
  }
}

/**
 * Barrel-file generation middleware.
 *
 * When added to `config.middleware`, generates an `index.ts` barrel file for each
 * plugin. When `output.barrelType` is omitted on a plugin it inherits from `config.output.barrelType`,
 * and when that is also omitted both default to `'all'`. Set `barrelType: false` to disable
 * barrel generation for a specific plugin or for the root entirely.
 *
 * The `barrelType` option controls the re-export style:
 * - `'all'`       — `export * from '...'` for each generated file
 * - `'named'`     — `export { name1, name2 } from '...'` using each file's indexable sources
 * - `'propagate'` — like `'all'` with intermediate barrel files for sub-directories
 *
 * @example
 * ```ts
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

    hooks.on('kubb:build:start', (buildCtx) => {
      ctx = buildCtx
    })

    hooks.on('kubb:plugin:end', ({ plugin }) => {
      if (!ctx) return

      // At runtime the plugin in kubb:plugin:end is always a NormalizedPlugin;
      // KubbPluginEndContext types it as Plugin for public API simplicity.
      const normalizedPlugin = plugin as NormalizedPlugin
      const pluginOutput = normalizedPlugin.options.output as { barrelType?: BarrelType | false } | undefined
      const rootOutput = ctx.config.output as { barrelType?: BarrelType | false }
      const barrelType = pluginOutput?.barrelType !== undefined ? pluginOutput.barrelType : (rootOutput.barrelType ?? 'all')

      if (!barrelType) return

      const barrelFiles = generatePerPluginBarrel({
        barrelType,
        plugin: normalizedPlugin,
        files: ctx.files,
        config: ctx.config,
      })

      if (barrelFiles.length > 0) {
        ctx.upsertFile(...barrelFiles)
      }
    })

    hooks.on('kubb:plugins:end', ({ files, config, upsertFile }) => {
      const rootOutput = config.output as { barrelType?: BarrelType | false }
      const rootBarrelType = rootOutput.barrelType ?? 'all'

      if (!rootBarrelType) return

      const rootBarrelFiles = generateRootBarrel({
        barrelType: rootBarrelType,
        files,
        config,
      })

      if (rootBarrelFiles.length > 0) {
        upsertFile(...rootBarrelFiles)
      }
    })
  },
})
