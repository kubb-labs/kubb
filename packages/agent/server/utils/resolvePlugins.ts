import type { Middleware, Plugin } from '@kubb/core'
import type { JSONKubbConfig } from '~/types/agent.ts'
import { logger } from './logger.ts'

type Factory = (options: unknown) => Plugin | Middleware

/**
 * Derives the conventional named export for a plugin package from its package name.
 * Works for any scoped or unscoped package, not just `@kubb/*`.
 *
 * @example
 * ```ts
 * toExportName('@kubb/plugin-react-query') // 'pluginReactQuery'
 * toExportName('@kubb/plugin-ts')          // 'pluginTs'
 * toExportName('@my-org/my-plugin')        // 'myPlugin'
 * toExportName('my-custom-plugin')         // 'myCustomPlugin'
 * ```
 */
function toExportName(packageName: string): string {
  // Strip scope and any leading path segments, e.g. '@kubb/plugin-ts' → 'plugin-ts'
  const base = packageName.split('/').pop() ?? packageName
  // camelCase: 'plugin-react-query' → 'pluginReactQuery'
  return base.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
}

/**
 * Dynamically imports a plugin package and returns its factory function.
 *
 * Resolution order (first callable wins):
 * 1. Named export matching the camelCase of the package base name (e.g. `pluginTs`)
 * 2. `default` export
 * 3. First function found among the module's exports (for single-export packages)
 *
 * This makes the loader work with any plugin regardless of scope or naming convention.
 *
 * @throws if the package cannot be imported or no callable factory is found.
 */
async function loadPluginFactory(packageName: string): Promise<Factory> {
  let mod: Record<string, unknown>
  try {
    mod = await import(packageName)
  } catch {
    throw new Error(`Plugin "${packageName}" could not be loaded. Make sure it is installed: \`npm install ${packageName}\``)
  }

  const exportName = toExportName(packageName)

  // 1. camelCase named export (e.g. pluginTs, pluginReactQuery, myPlugin)
  if (typeof mod[exportName] === 'function') return mod[exportName] as Factory

  // 2. default export
  if (typeof mod['default'] === 'function') return mod['default'] as Factory

  // 3. first exported function (handles single-export CJS/ESM packages)
  const firstFn = Object.values(mod).find((v) => typeof v === 'function') as Factory | undefined
  if (firstFn) return firstFn

  throw new Error(`Plugin "${packageName}" does not export a callable factory. ` + `Tried: named export "${exportName}", "default", and any exported function.`)
}

/**
 * Resolves each plugin entry by dynamically importing the plugin package and
 * calling its factory with the provided options.
 *
 * Plugin packages are not bundled with the agent — they are resolved from the
 * runtime environment. Install the plugins you need before starting the agent.
 *
 * Works with any plugin package, not just `@kubb/*`:
 * - `@kubb/plugin-ts` → calls `pluginTs(options)`
 * - `@my-org/my-plugin` → calls `myPlugin(options)` (or `default`, or first export)
 * - `my-custom-plugin` → calls `myCustomPlugin(options)` (or `default`, or first export)
 *
 * @example
 * ```ts
 * { name: '@kubb/plugin-react-query', options: { output: { path: './hooks' } } }
 * { name: 'my-custom-plugin', options: { output: { path: './custom' } } }
 * ```
 */
export async function resolvePlugins(plugins: NonNullable<JSONKubbConfig['plugins']>): Promise<Array<Plugin>> {
  return Promise.all(
    plugins.map(async ({ name, options }) => {
      const factory = await loadPluginFactory(name)
      return factory(options ?? {}) as Plugin
    }),
  )
}

/**
 * Resolves each middleware entry by dynamically importing the middleware package and
 * calling its factory with the provided options.
 *
 * Works with any middleware package, not just `@kubb/*`:
 * - `@kubb/middleware-barrel` → calls `middlewareBarrel(options)`
 *
 * @example
 * ```ts
 * { name: '@kubb/middleware-barrel', options: {} }
 * ```
 */
export async function resolveMiddlewares(middlewares: NonNullable<JSONKubbConfig['middleware']>): Promise<Array<Middleware>> {
  return Promise.all(
    middlewares.map(async ({ name, options }) => {
      const factory = await loadPluginFactory(name)
      return factory(options ?? {}) as Middleware
    }),
  )
}

/**
 * Checks that required peer dependencies are resolvable and warns when they are not.
 *
 * `@kubb/renderer-jsx` is required by all v5 Kubb plugins but is not a direct dependency
 * of the agent. Call this on agent startup so operators receive a clear diagnostic instead
 * of a cryptic runtime error when a plugin is first used.
 */
export async function checkPeerDependencies(): Promise<void> {
  try {
    await import('@kubb/renderer-jsx')
  } catch {
    logger.warn('Missing peer dependency @kubb/renderer-jsx. Install it alongside kubb plugins.')
  }
}
