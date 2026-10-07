import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import type { Adapter, Plugin } from '@kubb/core'
import { camelCase } from '@internals/utils'
import type { JSONKubbConfig } from '../protocol/index.ts'

/**
 * Turns the JSON config Studio sends back into live Kubb objects.
 *
 * A plugin or adapter instance carries closures (`parse`, `getImports`, ...) that cannot survive
 * JSON, so both sides pass options over the wire and the factory is re-invoked here with the merged
 * result. Only `@kubb/plugin-*` packages are resolved this way, so the reinstantiated factory is
 * always one Kubb ships, never an arbitrary module the payload names.
 */

type PluginFactory = (options: unknown) => Plugin

/**
 * Imports a package, falling back to how the user's project would resolve it.
 *
 * `import()` resolves from this file, so a linked or globally installed Studio (`pnpm link`,
 * `npm i -g`) only sees its own `node_modules` and misses the plugins installed next to the user's
 * config. The retry resolves from `process.cwd()` instead.
 */
async function importFromProject(packageName: string): Promise<Record<string, unknown>> {
  try {
    return await import(packageName)
  } catch {
    const require = createRequire(pathToFileURL(`${process.cwd()}/`))
    // `require.resolve` picks the package's `require` condition, so prefer the ESM build sitting
    // next to it. Loading the CJS copy would pull in a second `@kubb/core` instance.
    const resolved = require.resolve(packageName)
    const esm = resolved.replace(/\.cjs$/, '.js')

    return await import(pathToFileURL(esm !== resolved && existsSync(esm) ? esm : resolved).href)
  }
}

/**
 * Strips the `@kubb/` scope from a plugin package name, matching the `name` convention Kubb
 * plugin factories use internally.
 *
 * @example
 * ```ts
 * toPluginName('@kubb/plugin-ts') // 'plugin-ts'
 * ```
 */
function toPluginName(packageName: string): string {
  return packageName.split('/').pop() ?? packageName
}

/**
 * Adds the `@kubb/` scope a plugin's package carries but its `name` does not, the inverse of
 * {@link toPluginName}. A name outside the `plugin-` convention is left alone, so a third-party
 * plugin is not reported as one of Kubb's.
 *
 * @example
 * ```ts
 * toPackageName('plugin-ts')       // '@kubb/plugin-ts'
 * toPackageName('@acme/my-plugin') // '@acme/my-plugin'
 * ```
 */
export function toPackageName(name: string): string {
  return name.startsWith('plugin-') ? `@kubb/${name}` : name
}

/**
 * Derives the conventional named export for a `@kubb/*` plugin package from its package name.
 *
 * @example
 * ```ts
 * toExportName('@kubb/plugin-react-query') // 'pluginReactQuery'
 * toExportName('@kubb/plugin-ts')          // 'pluginTs'
 * ```
 */
export function toExportName(packageName: string): string {
  return camelCase(toPluginName(packageName))
}

/**
 * A `@kubb/plugin-*` package specifier. Nothing else may reach `import()`: only Kubb's own
 * plugins are supported, so a payload naming anything else, a third-party package or a path, is
 * refused before it can execute.
 */
const KUBB_PLUGIN_SPECIFIER = /^@kubb\/plugin-[\w.-]+$/

/**
 * Whether `name` is a `@kubb/plugin-*` specifier. Exported so `configFile.ts` can refuse the same
 * shape before printing a Studio-supplied plugin name into the config file's source text.
 */
export function isKubbPluginSpecifier(name: string): boolean {
  return KUBB_PLUGIN_SPECIFIER.test(name)
}

/**
 * Dynamically imports a `@kubb/plugin-*` package and returns its factory function.
 *
 * Packages must be pre-installed in the Docker image at build time via the `KUBB_PACKAGES`
 * build ARG, no runtime installation is possible in the distroless container.
 *
 * Resolution order: the camelCase named export the package name implies (e.g. `pluginTs`), then
 * the default export.
 *
 * @throws if the package cannot be imported or exports no callable factory.
 */
async function loadPluginFactory(packageName: string): Promise<PluginFactory> {
  if (!isKubbPluginSpecifier(packageName)) {
    throw new Error(`Plugin "${packageName}" is not a @kubb/plugin-* package. Kubb Studio only supports Kubb's own plugins.`)
  }

  let mod: Record<string, unknown>
  try {
    mod = await importFromProject(packageName)
  } catch (cause) {
    throw new Error(`Plugin "${packageName}" could not be loaded. Make sure it is installed: \`npm install ${packageName}\``, { cause })
  }

  const exportName = toExportName(packageName)

  if (typeof mod[exportName] === 'function') return mod[exportName] as PluginFactory

  if (typeof mod['default'] === 'function') return mod['default'] as PluginFactory

  throw new Error(`Plugin "${packageName}" does not export a callable factory. Tried the named export "${exportName}" and "default".`)
}

/**
 * Resolves each plugin entry by dynamically importing the `@kubb/plugin-*` package and
 * calling its factory with the provided options.
 *
 * Packages must be pre-installed in the Docker image at build time, use the `KUBB_PACKAGES`
 * build ARG to control which ones are available at runtime.
 *
 * @example
 * ```ts
 * { name: '@kubb/plugin-react-query', options: { output: { path: './hooks' } } }
 * { name: '@kubb/plugin-ts', options: { output: { path: './types' } } }
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
 * Whether `value` is an object literal or a null-prototype object, not an array or class instance.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === null || prototype === Object.prototype
}

/**
 * Whether `value` comes back unchanged from a JSON round trip. A function, a `RegExp` or another
 * class instance does not: the agent reports options to Studio as JSON, so what Studio sends back
 * for such a value is a lossy copy (`macros: [{ name }]` without its hooks, `pattern: {}`).
 */
function survivesJson(value: unknown): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(survivesJson)
  if (isPlainObject(value)) return Object.values(value).every(survivesJson)

  return false
}

/**
 * Deep-merges Studio's options over the disk options, with Studio taking priority, except where the
 * disk value cannot survive JSON. Studio only ever saw a lossy copy of such a value, so the disk
 * value is kept rather than replaced by what Studio echoes back. Plain objects merge key by key, so
 * Studio can still change a literal that sits next to a function (e.g. `group.type` beside `group.name`).
 *
 * @example
 * ```ts
 * mergeOptions({ macros: [camelCaseMacro], syntaxType: 'type' }, { macros: [{ name: 'camelCase' }], syntaxType: 'interface' })
 * // { macros: [camelCaseMacro], syntaxType: 'interface' }
 * ```
 */
export function mergeOptions(disk: Record<string, unknown>, studio: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...disk }

  for (const [key, value] of Object.entries(studio)) {
    const current = disk[key]

    if (isPlainObject(current) && isPlainObject(value)) {
      merged[key] = mergeOptions(current, value)
      continue
    }
    if (current !== undefined && !survivesJson(current)) continue

    merged[key] = value
  }

  return merged
}

/**
 * Merges studio plugin options with disk config plugins.
 * Studio takes priority: options from studio win over disk (except values only the disk config
 * can express, see {@link mergeOptions}), and a plugin Studio explicitly
 * disabled is dropped even when the disk config still lists it. Disk plugins without a studio
 * counterpart are kept as-is. Studio plugins not present on disk are appended.
 *
 * For plugins present in both configs, the plugin is re-instantiated with merged options
 * so that all internal closures correctly reference the merged values.
 */
export async function mergePlugins(
  diskPlugins: Array<Plugin> | undefined,
  studioPlugins: JSONKubbConfig['plugins'] | undefined,
): Promise<Array<Plugin> | undefined> {
  // Matched on the package's base name rather than by instantiating first. Every Kubb plugin
  // factory returns exactly that (`@kubb/plugin-ts` → `plugin-ts`), enforced by the `satisfies` on
  // each factory's name.
  const disabledNames = new Set((studioPlugins ?? []).filter((entry) => entry.disabled).map((entry) => toPluginName(entry.name)))
  const activeDiskPlugins = disabledNames.size ? diskPlugins?.filter((plugin) => !disabledNames.has(plugin.name)) : diskPlugins
  const activeStudioPlugins = studioPlugins?.filter((entry) => !entry.disabled)

  if (!activeDiskPlugins && !activeStudioPlugins?.length) return undefined
  if (!activeStudioPlugins?.length) return activeDiskPlugins

  if (!activeDiskPlugins) return resolvePlugins(activeStudioPlugins)

  const studioEntryByName = new Map(activeStudioPlugins.map((entry) => [toPluginName(entry.name), entry] as const))
  const diskNames = new Set(activeDiskPlugins.map((plugin) => plugin.name))

  // Each plugin is instantiated once, with its final options. Resolving the whole payload first
  // just to read the names would build every overlapping plugin twice and discard the first.
  const merged = await Promise.all(
    activeDiskPlugins.map(async (diskPlugin) => {
      const studioEntry = studioEntryByName.get(diskPlugin.name)
      if (!studioEntry) return diskPlugin

      // Disk as base, studio overrides, then re-instantiate so the plugin's closures reference the
      // merged values. A plugin that never sets `options` (e.g. `@kubb/plugin-barrel`) leaves
      // `diskPlugin.options` undefined.
      const options = mergeOptions((diskPlugin.options as Record<string, unknown>) ?? {}, (studioEntry.options as Record<string, unknown>) ?? {})
      const [resolved] = await resolvePlugins([{ name: studioEntry.name, options }])

      return resolved ?? diskPlugin
    }),
  )

  const studioOnly = activeStudioPlugins.filter((entry) => !diskNames.has(toPluginName(entry.name)))

  return [...merged, ...(await resolvePlugins(studioOnly))]
}

/**
 * Merges Studio-provided adapter option overrides into the disk config's adapter.
 *
 * Adapter instances carry live functions (`parse`, `getImports`, ...) that can't survive
 * JSON serialization over the WebSocket, so `studioOptions` is treated as an options patch
 * rather than a replacement adapter. Re-invokes the same `@kubb/adapter-<name>` factory the
 * disk config used, with the merged options, so the resulting instance has fresh closures
 * over the merged values instead of a plain object missing `parse`.
 */
export async function mergeAdapter(diskAdapter: Adapter | undefined, studioOptions: object | undefined): Promise<Adapter | undefined> {
  if (!studioOptions || !diskAdapter) {
    return diskAdapter
  }

  const packageName = `@kubb/adapter-${diskAdapter.name}`
  const mod = await importFromProject(packageName)
  const factory = mod[toExportName(packageName)]

  if (typeof factory !== 'function') {
    return diskAdapter
  }

  const mergedOptions = mergeOptions((diskAdapter.options as Record<string, unknown>) ?? {}, studioOptions as Record<string, unknown>)

  return factory(mergedOptions) as Adapter
}
