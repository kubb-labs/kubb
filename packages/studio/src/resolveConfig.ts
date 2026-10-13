import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { type Adapter, type ExtensionKind, isPackageName, type Parser, type Plugin, resolveMeta } from '@kubb/core'
import { camelCase } from '@internals/utils'
import type { InstalledExtensions } from './extensions.ts'
import type { JSONKubbConfig, OptionValue } from './protocol.ts'

/**
 * Turns the JSON config Studio sends back into live Kubb objects.
 *
 * A plugin or adapter instance carries closures (`parse`, `getImports`, ...) that cannot survive
 * JSON, so both sides pass options over the wire and the factory is re-invoked here with the merged
 * result. Only packages {@link isAllowedPlugin} accepts are resolved this way, never an arbitrary
 * module the payload names.
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

function resolvesFrom(base: string | URL, packageName: string): boolean {
  try {
    // Every Kubb package exports its `package.json`, which resolves even before a build exists.
    createRequire(base).resolve(`${packageName}/package.json`)
    return true
  } catch {
    return false
  }
}

/**
 * Whether `packageName` resolves from the project at `root`, from this package, or from the `kubb`
 * package the project installs, which brings the plugins Kubb adds on its own such as
 * `@kubb/plugin-barrel`. Only resolves the package, it never runs it.
 */
function isInstalled({ packageName, root }: { packageName: string; root: string }): boolean {
  const project = pathToFileURL(`${root}/`)
  if (resolvesFrom(project, packageName) || resolvesFrom(import.meta.url, packageName)) return true

  try {
    return resolvesFrom(createRequire(project).resolve('kubb/package.json'), packageName)
  } catch {
    return false
  }
}

/**
 * The name Studio knows a plugin by: its `@kubb/plugin-*` package when one is installed, otherwise
 * the plugin's own `name`, so a plugin defined in the user's project is never reported as a Kubb
 * package that does not exist. An installed extension whose manifest `name` matches wins.
 *
 * @example
 * ```ts
 * toStudioName({ name: 'plugin-ts', root })              // '@kubb/plugin-ts'
 * toStudioName({ name: 'plugin-zod-operations', root })  // 'plugin-zod-operations', a local plugin
 * ```
 */
export function toStudioName({
  name,
  root,
  extensions = new Map(),
  kind = 'plugin',
}: {
  name: string
  root: string
  extensions?: InstalledExtensions
  kind?: ExtensionKind
}): string {
  const installed = [...extensions.values()].find(({ manifest }) => manifest.kind === kind && manifest.name === name)
  if (installed) return installed.package

  const packageName = toPackageName(name)
  return packageName !== name && isInstalled({ packageName, root }) ? packageName : name
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

const KUBB_PLUGIN_SPECIFIER = /^@kubb\/plugin-[\w.-]+$/

/**
 * Whether Studio may import `packageName` as a plugin: a `@kubb/plugin-*` package, or an installed
 * package whose `kubb-extension.json` has `kind: "plugin"`. A path, URL or arbitrary package is
 * refused before it can execute. `configFile.ts` applies the same rule before printing a plugin name.
 */
export function isAllowedPlugin({ packageName, extensions }: { packageName: string; extensions: InstalledExtensions }): boolean {
  if (!isPackageName(packageName)) return false
  return KUBB_PLUGIN_SPECIFIER.test(packageName) || extensions.get(packageName)?.manifest.kind === 'plugin'
}

/**
 * Dynamically imports a plugin package and returns its factory. Only packages
 * {@link isAllowedPlugin} accepts reach `import()`.
 *
 * Packages must be pre-installed in the Docker image at build time via the `KUBB_PACKAGES`
 * build ARG, no runtime installation is possible in the distroless container.
 *
 * Resolution order: the manifest's `export`, else the camelCase named export the package name
 * implies (e.g. `pluginTs`), then the default export.
 *
 * @throws if the package is not allowed, cannot be imported, or exports no callable factory.
 */
async function loadPluginFactory({ packageName, extensions }: { packageName: string; extensions: InstalledExtensions }): Promise<PluginFactory> {
  if (!isAllowedPlugin({ packageName, extensions })) {
    throw new Error(
      `Plugin "${packageName}" is not an installed Kubb plugin. Studio loads @kubb/plugin-* packages and installed packages that ship a kubb-extension.json with kind "plugin".`,
    )
  }

  let mod: Record<string, unknown>
  try {
    mod = await importFromProject(packageName)
  } catch (cause) {
    throw new Error(`Plugin "${packageName}" could not be loaded. Make sure it is installed: \`npm install ${packageName}\``, { cause })
  }

  const manifestExport = extensions.get(packageName)?.manifest.export
  if (manifestExport) {
    if (typeof mod[manifestExport] === 'function') return mod[manifestExport] as PluginFactory
    throw new Error(`Plugin "${packageName}" does not export "${manifestExport}", the factory its kubb-extension.json names.`)
  }

  const exportName = toExportName(packageName)
  if (typeof mod[exportName] === 'function') return mod[exportName] as PluginFactory
  if (typeof mod['default'] === 'function') return mod['default'] as PluginFactory

  throw new Error(`Plugin "${packageName}" does not export a callable factory. Tried the named export "${exportName}" and "default".`)
}

/**
 * Resolves each plugin entry by dynamically importing its package and calling its factory with the
 * provided options. See {@link loadPluginFactory} for which packages are allowed.
 *
 * @example
 * ```ts
 * const plugins = await resolvePlugins({
 *   plugins: [
 *     { name: '@kubb/plugin-react-query', options: { output: { path: './hooks' } } },
 *     { name: '@kubb/plugin-ts', options: { output: { path: './types' } } },
 *   ],
 * })
 * ```
 */
export async function resolvePlugins({
  plugins,
  extensions = new Map(),
}: {
  plugins: NonNullable<JSONKubbConfig['plugins']>
  extensions?: InstalledExtensions
}): Promise<Array<Plugin>> {
  return Promise.all(
    plugins.map(async ({ name, options }) => {
      const factory = await loadPluginFactory({ packageName: name, extensions })
      return factory(options ?? {}) as Plugin
    }),
  )
}

type PackageJSON = {
  version?: string
}

/** The installed version of each plugin's package, plus the names that could not be resolved. */
export async function resolvePeerDependencies(names: Array<string>): Promise<{
  peerDependencies: Record<string, string>
  missingDependencies: Array<string>
}> {
  const require = createRequire(import.meta.url)
  const uniqueNames = [...new Set(names.map(toPackageName))]
  const peerDependencies: Record<string, string> = {}
  const missingDependencies: Array<string> = []

  const versions = await Promise.all(
    uniqueNames.map(async (name) => {
      try {
        const path = require.resolve(`${name}/package.json`)
        const packageJSON = JSON.parse(await readFile(path, 'utf8')) as PackageJSON
        return packageJSON.version
      } catch {
        return undefined
      }
    }),
  )

  for (const [index, name] of uniqueNames.entries()) {
    const version = versions[index]
    if (version) {
      peerDependencies[name] = version
      continue
    }
    missingDependencies.push(name)
  }

  return { peerDependencies, missingDependencies }
}

/**
 * Keys that reach an object's prototype when assigned. Never read from or written into options.
 */
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * Whether `key` can be used as an option key without touching an object's prototype.
 */
export function isSafeKey(key: string): boolean {
  return !UNSAFE_KEYS.has(key)
}

/**
 * A JSON copy of plugin or adapter options: functions and other values JSON cannot hold are left
 * out, so nothing callable crosses the socket. Options that cannot be copied at all, such as a
 * circular structure, come back empty.
 *
 * @example
 * ```ts
 * toJSONOptions({ output: { path: 'types' }, group: { name: () => 'x' } }) // { output: { path: 'types' }, group: {} }
 * ```
 */
export function toJSONOptions(options: unknown): Record<string, unknown> {
  try {
    const copy = JSON.parse(
      JSON.stringify(options ?? {}, (key, value: unknown) => (isSafeKey(key) && typeof value !== 'bigint' ? value : undefined)),
    ) as unknown
    return isPlainObject(copy) ? copy : {}
  } catch {
    return {}
  }
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
 * Whether `value` survives a JSON round trip, so it can be printed into a config file as a literal.
 * A function, `undefined`, a non-finite number or a class instance comes back from Studio as a
 * lossy copy, so an edit carrying one is refused rather than written into the user's source.
 */
export function isOptionValue(value: unknown): value is OptionValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(isOptionValue)
  if (isPlainObject(value)) return Object.entries(value).every(([key, entry]) => isSafeKey(key) && isOptionValue(entry))

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
    if (!isSafeKey(key)) continue
    const current = disk[key]

    if (isPlainObject(current) && isPlainObject(value)) {
      merged[key] = mergeOptions(current, value)
      continue
    }
    if (current !== undefined && !isOptionValue(current)) continue

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
export async function mergePlugins({
  diskPlugins,
  studioPlugins,
  extensions = new Map(),
}: {
  diskPlugins: Array<Plugin> | undefined
  studioPlugins: JSONKubbConfig['plugins'] | undefined
  extensions?: InstalledExtensions
}): Promise<Array<Plugin> | undefined> {
  const pluginNameOf = (packageName: string) => extensions.get(packageName)?.manifest.name ?? toPluginName(packageName)
  // Matched on the package's base name rather than by instantiating first. Every Kubb plugin
  // factory returns exactly that (`@kubb/plugin-ts` → `plugin-ts`), enforced by the `satisfies` on
  // each factory's name.
  const disabledNames = new Set((studioPlugins ?? []).filter((entry) => entry.disabled).map((entry) => pluginNameOf(entry.name)))
  const activeDiskPlugins = disabledNames.size ? diskPlugins?.filter((plugin) => !disabledNames.has(resolveMeta(plugin).name)) : diskPlugins
  const activeStudioPlugins = studioPlugins?.filter((entry) => !entry.disabled)

  if (!activeDiskPlugins && !activeStudioPlugins?.length) return undefined
  if (!activeStudioPlugins?.length) return activeDiskPlugins

  if (!activeDiskPlugins) return resolvePlugins({ plugins: activeStudioPlugins, extensions })

  const studioEntryByName = new Map(activeStudioPlugins.map((entry) => [pluginNameOf(entry.name), entry] as const))
  const diskNames = new Set(activeDiskPlugins.map((plugin) => plugin.name))

  // Each plugin is instantiated once, with its final options. Resolving the whole payload first
  // just to read the names would build every overlapping plugin twice and discard the first.
  const merged = await Promise.all(
    activeDiskPlugins.map(async (diskPlugin) => {
      const studioEntry = studioEntryByName.get(resolveMeta(diskPlugin).name)
      if (!studioEntry) return diskPlugin

      // Disk as base, studio overrides, then re-instantiate so the plugin's closures reference the
      // merged values. A plugin that never sets `options` (e.g. `@kubb/plugin-barrel`) leaves
      // `diskPlugin.options` undefined.
      const diskOptions = (diskPlugin.options as Record<string, unknown>) ?? {}
      const options = mergeOptions(diskOptions, (studioEntry.options as Record<string, unknown>) ?? {})
      // A plugin defined in the user's project has no package to re-instantiate it from. Studio
      // echoing its options back unchanged is fine, any real change can only be made on disk.
      const unchanged = JSON.stringify(toJSONOptions(options)) === JSON.stringify(toJSONOptions(diskOptions))
      const [resolved] = await resolvePlugins({ plugins: [{ name: studioEntry.name, options }], extensions }).catch((cause: unknown) => {
        if (unchanged) return [diskPlugin]
        throw new Error(
          `Plugin "${diskPlugin.name}" is not an installed @kubb/plugin-* package or Kubb extension, so Studio cannot change its options. Edit it in the config file, or only enable or disable it from Studio.`,
          { cause },
        )
      })

      return resolved ?? diskPlugin
    }),
  )

  const studioOnly = activeStudioPlugins.filter((entry) => !diskNames.has(pluginNameOf(entry.name)))

  return [...merged, ...(await resolvePlugins({ plugins: studioOnly, extensions }))]
}

/**
 * Re-invokes the factory behind a disk adapter or parser with Studio's options merged over its own.
 * An instance carries live functions (`parse`, `print`, ...) that cannot survive JSON, so Studio's
 * options are a patch, not a replacement, and the factory is found from the disk instance itself: the
 * installed extension whose manifest names it, or the `@kubb/<kind>-<name>` package for a built-in
 * one. Throws when no factory resolves, as `mergePlugins` does, so an override Studio sent is never
 * dropped without a word. An extension without a manifest, such as `parserTsx`, has no options in
 * Studio, so Studio never sends one for it.
 */
async function rebuildExtension<T extends Adapter | Parser>({
  disk,
  studioOptions,
  kind,
  extensions,
}: {
  disk: T
  studioOptions: object | undefined
  kind: ExtensionKind
  extensions: InstalledExtensions
}): Promise<T> {
  if (!studioOptions || !Object.keys(studioOptions).length) return disk

  const { name } = resolveMeta(disk)
  const installed = [...extensions.values()].find(({ manifest }) => manifest.kind === kind && manifest.name === name)
  const packageName = installed?.package ?? `@kubb/${kind}-${name}`
  const factory = await importFromProject(packageName)
    .then((mod) => mod[installed?.manifest.export ?? toExportName(packageName)])
    .catch((cause: unknown) => {
      throw new Error(`The ${kind} "${name}" is not an installed Kubb extension, so Studio cannot change its options. Edit it in the config file.`, { cause })
    })

  if (typeof factory !== 'function') {
    throw new Error(`The ${kind} "${name}" is not an installed Kubb extension, so Studio cannot change its options. Edit it in the config file.`)
  }

  return factory(mergeOptions((disk.options as Record<string, unknown>) ?? {}, studioOptions as Record<string, unknown>)) as T
}

/**
 * Merges Studio-provided adapter option overrides into the disk config's adapter, see {@link rebuildExtension}.
 */
export async function mergeAdapter(diskAdapter: Adapter | undefined, studioOptions: object | undefined, extensions: InstalledExtensions = new Map()) {
  if (!diskAdapter) return diskAdapter

  return rebuildExtension({ disk: diskAdapter, studioOptions, kind: 'adapter', extensions })
}

/**
 * Merges Studio-provided parser option overrides into the disk config's parsers, matched by the name
 * Studio knows each parser by, see {@link rebuildExtension}. Parsers Studio does not name are kept as is.
 */
export async function mergeParsers({
  diskParsers,
  studioParsers,
  root,
  extensions = new Map(),
}: {
  diskParsers: Array<Parser>
  studioParsers: JSONKubbConfig['parsers'] | undefined
  root: string
  extensions?: InstalledExtensions
}): Promise<Array<Parser>> {
  if (!studioParsers?.length) return diskParsers

  const studioOptions = new Map(studioParsers.map((entry) => [entry.name, entry.options]))

  return Promise.all(
    diskParsers.map((parser) =>
      rebuildExtension({
        disk: parser,
        studioOptions: studioOptions.get(toStudioName({ name: resolveMeta(parser).name, root, extensions, kind: 'parser' })),
        kind: 'parser',
        extensions,
      }),
    ),
  )
}
