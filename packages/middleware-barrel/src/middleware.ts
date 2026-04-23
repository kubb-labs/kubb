import { defineMiddleware } from '@kubb/core'
import type { KubbBuildStartContext, NormalizedPlugin } from '@kubb/core'
import './types.ts'
import type { BarrelType } from './types.ts'
import { generatePerPluginBarrel } from './utils/generatePerPluginBarrel.ts'
import { generateRootBarrel } from './utils/generateRootBarrel.ts'

/**
 * Barrel-file generation middleware.
 *
 * When added to `config.middleware`, generates an `index.ts` barrel file for each
 * plugin that has `output.barrelType` set (or inherits it from `config.output.barrelType`),
 * as well as a root `index.ts` at `config.output.path` when `config.output.barrelType` is set.
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
      const barrelType = pluginOutput?.barrelType !== undefined ? pluginOutput.barrelType : rootOutput.barrelType

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

    hooks.on('kubb:build:end', () => {
      if (!ctx) return

      const rootOutput = ctx.config.output as { barrelType?: BarrelType | false }
      const rootBarrelType = rootOutput.barrelType

      if (!rootBarrelType) return

      const rootBarrelFiles = generateRootBarrel({
        barrelType: rootBarrelType,
        files: ctx.files,
        config: ctx.config,
      })

      if (rootBarrelFiles.length > 0) {
        ctx.upsertFile(...rootBarrelFiles)
      }
    })
  },
})
