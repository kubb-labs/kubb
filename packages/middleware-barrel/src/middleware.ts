/**
 * @deprecated Use `@kubb/plugin-barrel` instead.
 *
 * `@kubb/middleware-barrel` is deprecated and will be removed in a future release.
 * Replace it with `pluginBarrel` from `@kubb/plugin-barrel`, which is a standard
 * `enforce: 'post'` plugin with identical barrel-generation behaviour.
 *
 * @example
 * ```ts
 * // Before
 * import { middlewareBarrel } from '@kubb/middleware-barrel'
 * defineConfig({ middleware: [middlewareBarrel()] })
 *
 * // After
 * import { pluginBarrel } from '@kubb/plugin-barrel'
 * defineConfig({ plugins: [pluginBarrel()] })
 * ```
 */
export { pluginBarrel as middlewareBarrel, pluginBarrelName as middlewareBarrelName } from '@kubb/plugin-barrel'
export type { BarrelConfig, BarrelType, PluginBarrelConfig } from '@kubb/plugin-barrel'
