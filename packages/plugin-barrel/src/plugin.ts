import { definePlugin } from '@kubb/core'
import type { NormalizedPlugin } from '@kubb/core'
import type { PluginBarrel, PluginBarrelOptions } from './types.ts'
import { pluginBarrelName } from './types.ts'

/**
 * Barrel-file generation plugin.
 *
 * Integrates with the existing Kubb build lifecycle — no new hooks required.
 *
 * - `kubb:plugin:setup`: Disables own barrel generation (this plugin produces no output
 *   files, so the core per-plugin barrel loop must skip it).
 * - `kubb:build:start`: Runs before the plugin execution loop. Overwrites each listed
 *   plugin's `output.barrelType` with the value from `options.plugins`, and (when
 *   `options.root` is specified) overwrites `config.output.barrelType` so that the core
 *   root-barrel phase uses the correct type.
 *
 * Because these mutations happen before the build loop, the standard barrel generation
 * in `createKubb` naturally produces the correct output — core remains unaware of this
 * plugin.
 *
 * @example
 * ```ts
 * import { pluginBarrel } from '@kubb/plugin-barrel'
 *
 * export default defineConfig({
 *   plugins: [
 *     pluginTs(),
 *     pluginZod(),
 *     pluginBarrel({
 *       root: { barrelType: 'named' },
 *       plugins: [
 *         { name: 'plugin-ts', barrelType: 'named' },
 *         { name: 'plugin-zod', barrelType: 'all' },
 *       ],
 *     }),
 *   ],
 * })
 * ```
 */
export const pluginBarrel = definePlugin<PluginBarrel>((options: PluginBarrelOptions = {}) => ({
  name: pluginBarrelName,
  options,
  hooks: {
    'kubb:plugin:setup'(ctx) {
      // Store barrel config and prevent own barrel generation.
      // `plugin-barrel` has no output files; setting output.barrelType: false ensures
      // the core per-plugin barrel loop produces nothing for this plugin.
      ctx.setOptions({ ...options, output: { barrelType: false } } as never)
    },
    'kubb:build:start'(ctx) {
      // Overwrite each listed plugin's barrelType before the build loop starts so that
      // the core barrel generation picks up the correct type without any special casing.
      for (const entry of options.plugins ?? []) {
        const plugin = ctx.getPlugin(entry.name) as NormalizedPlugin | undefined
        if (plugin?.options) {
          plugin.options.output = { ...plugin.options.output, barrelType: entry.barrelType }
        }
      }

      // When the caller explicitly configures a root barrel type, overwrite
      // config.output.barrelType so the core root-barrel phase uses it.
      if (options.root !== undefined) {
        ctx.config.output = { ...ctx.config.output, barrelType: options.root.barrelType ?? undefined }
      }
    },
  },
}))
