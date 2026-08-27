import type { Plugin } from 'kubb/kit'
import type { JSONKubbConfig } from '../protocol/index.ts'

type Factory = (options: unknown) => Plugin

/**
 * Strips the scope and any leading path segments from a plugin package name,
 * matching the `name` convention Kubb plugin factories use internally.
 *
 * @example
 * ```ts
 * toPluginName('@kubb/plugin-ts') // 'plugin-ts'
 * toPluginName('my-custom-plugin') // 'my-custom-plugin'
 * ```
 */
export function toPluginName(packageName: string): string {
  return packageName.split('/').pop() ?? packageName
}

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
export function toExportName(packageName: string): string {
  // camelCase: 'plugin-react-query' → 'pluginReactQuery'
  return toPluginName(packageName).replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
}

/**
 * Dynamically imports a plugin package and returns its factory function.
 *
 * Packages must be pre-installed in the Docker image at build time via the `KUBB_PACKAGES`
 * build ARG, no runtime installation is possible in the distroless container. Both
 * `@kubb/*` scoped and third-party packages are supported as long as they are included in
 * the image.
 *
 * Resolution order (first callable wins):
 * 1. Named export matching the camelCase of the package base name (e.g. `pluginTs`)
 * 2. `default` export
 * 3. First function found among the module's exports (for single-export packages)
 *
 * @throws if the package cannot be imported or exports no callable factory.
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
 * Both `@kubb/*` scoped and third-party packages are supported. Packages must be
 * pre-installed in the Docker image at build time, use the `KUBB_PACKAGES` build ARG
 * to control which ones are available at runtime.
 *
 * @example
 * ```ts
 * { name: '@kubb/plugin-react-query', options: { output: { path: './hooks' } } }
 * { name: '@kubb/plugin-ts', options: { output: { path: './types' } } }
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
