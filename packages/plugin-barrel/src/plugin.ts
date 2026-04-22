import { definePlugin } from '@kubb/core'
import type { PluginBarrel, PluginBarrelOptions } from './types.ts'
import { pluginBarrelName } from './types.ts'

/**
 * Barrel-file generation plugin.
 *
 * Registers per-plugin and root-level `index.ts` barrel configuration with the Kubb build pipeline.
 * When this plugin is present, the core build uses its options to determine barrel types for each
 * registered plugin (overriding each plugin's own `output.barrelType`) and for the root barrel
 * (overriding `config.output.barrelType`).
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
      ctx.setOptions(options)
    },
  },
}))
