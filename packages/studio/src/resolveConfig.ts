import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import type { Adapter, Plugin } from '@kubb/core'
import { camelCase } from '@internals/utils'
import { mergeDeep } from 'remeda'
import type { JSONKubbConfig } from './protocol/index.ts'

/**
 * Turns the JSON config Studio sends back into live Kubb objects.
 *
 * A plugin or adapter instance carries closures (`parse`, `getImports`, ...) that cannot survive
 * JSON, so both sides pass options over the wire and the factory is re-invoked here with the merged
 * result. That re-invocation is why {@link assertAllowedPlugins} exists: resolving a plugin means
 * `import()`-ing whatever module the payload names.
 */

type Factory = (options: unknown) => Plugin

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
 * Strips the scope and any leading path segments from a plugin package name,
 * matching the `name` convention Kubb plugin factories use internally.
 *
 * @example
 * ```ts
 * toPluginName('@kubb/plugin-ts') // 'plugin-ts'
 * toPluginName('my-custom-plugin') // 'my-custom-plugin'
 * ```
 */
function toPluginName(packageName: string): string {
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
  return camelCase(toPluginName(packageName))
}

/**
 * Dynamically imports a plugin package and returns its factory function.
 *
 * Packages must be pre-installed in the Docker image at build time via the `KUBB_PACKAGES`
 * build ARG, no runtime installation is possible in the distroless container. Both
 * `@kubb/*` scoped and third-party packages are supported as long as they are included in
 * the image.
 *
 * Resolution order: the camelCase named export the package name implies (e.g. `pluginTs`), then
 * the default export.
 *
 * @throws if the package cannot be imported or exports no callable factory.
 */
async function loadPluginFactory(packageName: string): Promise<Factory> {
  assertBareSpecifier(packageName)

  let mod: Record<string, unknown>
  try {
    mod = await importFromProject(packageName)
  } catch (cause) {
    throw new Error(`Plugin "${packageName}" could not be loaded. Make sure it is installed: \`npm install ${packageName}\``, { cause })
  }

  const exportName = toExportName(packageName)

  if (typeof mod[exportName] === 'function') return mod[exportName] as Factory

  if (typeof mod['default'] === 'function') return mod['default'] as Factory

  throw new Error(`Plugin "${packageName}" does not export a callable factory. Tried the named export "${exportName}" and "default".`)
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

/**
 * A bare npm specifier: `plugin-ts`, `@kubb/plugin-ts`. Nothing else may reach `import()`.
 *
 * Anchored, and the scope is a single segment, so a payload cannot smuggle a path through the
 * package position: `../../../etc/plugin-ts` and `/tmp/evil` both fail to match.
 */
const BARE_SPECIFIER = /^(?:@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*$/i

/**
 * Rejects anything that is not a bare package specifier before it reaches `import()`.
 *
 * This holds even with no allow-list, which is the Docker agent's configuration: the image bounds
 * *which packages exist*, but nothing stopped a payload naming a relative path from importing an
 * arbitrary file inside the container.
 */
function assertBareSpecifier(name: string): void {
  if (!BARE_SPECIFIER.test(name)) {
    throw new Error(`Plugin "${name}" is not a package name. Kubb Studio may only name installed packages, not file paths.`)
  }
}

/**
 * The specifiers an allow-list entry stands for.
 *
 * A disk plugin's `name` is the unscoped base (`plugin-ts`), while a payload names the package it
 * came from (`@kubb/plugin-ts`), so an unscoped entry accepts both. Matching is exact: normalizing
 * the *payload* down to a base name instead would let `@evil/plugin-ts` pass as `plugin-ts`.
 */
function toAllowedSpecifiers(entry: string): Array<string> {
  return entry.includes('/') ? [entry] : [entry, `@kubb/${entry}`]
}

/**
 * Rejects a Studio payload naming a module specifier outside `allowed`.
 *
 * `resolvePlugins` resolves a plugin by `await import(name)`, so an unrestricted payload can
 * execute any module reachable from the project. The Docker image bounds this by shipping a fixed
 * plugin set; a host running in the user's own project passes the specifiers its disk config
 * already imports instead. An `undefined` allow-list means no restriction beyond
 * {@link assertBareSpecifier}.
 */
export function assertAllowedPlugins(studioPlugins: JSONKubbConfig['plugins'] | undefined, allowed: ReadonlyArray<string> | undefined): void {
  if (!studioPlugins?.length) {
    return
  }

  for (const plugin of studioPlugins) {
    assertBareSpecifier(plugin.name)
  }

  if (!allowed) {
    return
  }

  const allowedSpecifiers = new Set(allowed.flatMap(toAllowedSpecifiers))
  const rejected = studioPlugins.map((plugin) => plugin.name).filter((name) => !allowedSpecifiers.has(name))

  if (rejected.length) {
    throw new Error(
      `Kubb Studio asked to load ${rejected.map((name) => `"${name}"`).join(', ')}, which the local Kubb config does not import. ` +
        'Add the plugin to your config and reconnect.',
    )
  }
}

/**
 * Merges studio plugin options with disk config plugins.
 * Studio takes priority: options from studio win over disk, and a plugin Studio explicitly
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
      // `diskPlugin.options` undefined, which `mergeDeep` can't accept.
      const options = mergeDeep((diskPlugin.options as Record<string, unknown>) ?? {}, (studioEntry.options as Record<string, unknown>) ?? {})
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

  const mergedOptions = mergeDeep(diskAdapter.options as Record<string, unknown>, studioOptions as Record<string, unknown>)

  return factory(mergedOptions) as Adapter
}
