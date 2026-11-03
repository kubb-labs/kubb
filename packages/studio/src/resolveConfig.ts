import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { type Adapter, type Config, Diagnostics, type ExtensionKind, type Parser, type Plugin, resolveMeta } from '@kubb/core'
import { isAllowedPlugin, isOptionValue, isOutputKey, isOutputValue, isPlainObject, isSafeKey, toExportName, toPluginName } from '@internals/shared'
import { isPathInside, toError } from '@internals/utils'
import type { InstalledExtensions, JSONKubbConfig } from './protocol.ts'

/**
 * Turns the JSON config Studio sends back into live Kubb objects.
 *
 * A plugin or adapter instance carries closures (`parse`, `getImports`, ...) that cannot survive
 * JSON, so both sides pass options over the wire and the factory is re-invoked here with the merged
 * result. Only packages {@link isAllowedPlugin} accepts are resolved this way, never an arbitrary
 * module the payload names.
 */

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
    const requireModule = createRequire(pathToFileURL(`${process.cwd()}/`))
    // `requireModule.resolve` picks the package's `require` condition, so prefer the ESM build sitting
    // next to it. Loading the CJS copy would pull in a second `@kubb/core` instance.
    const resolved = requireModule.resolve(packageName)
    const esm = resolved.replace(/\.cjs$/, '.js')

    return await import(pathToFileURL(esm !== resolved && existsSync(esm) ? esm : resolved).href)
  }
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
 * The name Studio knows an extension by: the package of the installed extension whose manifest
 * `name` matches, otherwise its own `name`, so a plugin defined in the user's project is never
 * reported as a Kubb package that does not exist.
 *
 * @example
 * ```ts
 * toStudioName({ name: 'plugin-ts', extensions })              // '@kubb/plugin-ts'
 * toStudioName({ name: 'plugin-zod-operations', extensions })  // 'plugin-zod-operations', a local plugin
 * ```
 */
export function toStudioName({
  name,
  extensions = new Map(),
  kind = 'plugin',
}: {
  name: string
  extensions?: InstalledExtensions
  kind?: ExtensionKind
}): string {
  return [...extensions.values()].find(({ manifest }) => manifest.kind === kind && manifest.name === name)?.package ?? name
}

/**
 * Dynamically imports an extension package and returns its factory. Callers check
 * {@link isAllowedPlugin} or derive the package from a disk instance first, so an arbitrary module
 * never reaches `import()`.
 *
 * Packages must be pre-installed in the Docker image at build time via the `KUBB_PACKAGES`
 * build ARG, no runtime installation is possible in the distroless container.
 *
 * Resolution order: the manifest's `export`, else the camelCase named export the package name
 * implies (e.g. `pluginTs`), then the default export.
 *
 * @throws if the package cannot be imported or exports no callable factory.
 */
async function loadFactory({
  packageName,
  extensions,
  kind = 'plugin',
}: {
  packageName: string
  extensions: InstalledExtensions
  kind?: ExtensionKind
}): Promise<(options: unknown) => unknown> {
  const label = { plugin: 'Plugin', adapter: 'Adapter', parser: 'Parser' }[kind]
  let mod: Record<string, unknown>
  try {
    mod = await importFromProject(packageName)
  } catch (cause) {
    throw new Diagnostics.Error({
      code: kind === 'plugin' ? Diagnostics.code.pluginNotFound : Diagnostics.code.unknown,
      severity: 'error',
      message: `${label} "${packageName}" could not be loaded. Make sure it is installed: \`npm install ${packageName}\``,
      cause: toError(cause),
    })
  }

  const manifestExport = extensions.get(packageName)?.manifest.export
  if (manifestExport) {
    if (typeof mod[manifestExport] === 'function') return mod[manifestExport] as (options: unknown) => unknown
    throw new Diagnostics.Error({
      code: Diagnostics.code.incompatibleExtension,
      severity: 'error',
      message: `${label} "${packageName}" does not export "${manifestExport}", the factory its kubb-extension.json names.`,
      help: 'Install a version of the plugin whose exports match its kubb-extension.json.',
    })
  }

  const exportName = toExportName(packageName)
  if (typeof mod[exportName] === 'function') return mod[exportName] as (options: unknown) => unknown
  if (typeof mod['default'] === 'function') return mod['default'] as (options: unknown) => unknown

  throw new Diagnostics.Error({
    code: Diagnostics.code.incompatibleExtension,
    severity: 'error',
    message: `${label} "${packageName}" does not export a callable factory. Tried the named export "${exportName}" and "default".`,
    help: 'Install a Kubb plugin package that exports its factory.',
  })
}

/**
 * Resolves each plugin entry by dynamically importing its package and calling its factory with the
 * provided options. Only packages {@link isAllowedPlugin} accepts are loaded.
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
      if (!isAllowedPlugin({ packageName: name, extensions })) {
        throw new Diagnostics.Error({
          code: Diagnostics.code.pluginNotFound,
          severity: 'error',
          message: `Plugin "${name}" is not an installed Kubb plugin. Studio loads @kubb/plugin-* packages and installed packages that ship a kubb-extension.json with kind "plugin".`,
        })
      }
      const factory = await loadFactory({ packageName: name, extensions })
      return factory(options ?? {}) as Plugin
    }),
  )
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
 * Deep-merges Studio's options over the disk options, with Studio taking priority, except where the
 * disk value cannot survive JSON. Studio only ever saw a lossy copy of such a value, so the disk
 * value is kept rather than replaced by what Studio echoes back. Plain objects merge key by key, so
 * Studio can still change a literal that sits next to a function (e.g. `group.type` beside `group.name`).
 *
 * @example
 * ```ts
 * mergeOptions({ macros: [camelCaseMacro], syntaxType: 'type' }, { macros: [{ name: 'camelCase' }], syntaxType: 'interface' })
 * // { macros: [camelCaseMacro], syntaxType: 'interface' }
 * mergeOptions({ emptySchemaType: 'any' }, { emptySchemaType: null }) // {}
 * ```
 */
export function mergeOptions(disk: Record<string, unknown>, studio: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...disk }

  for (const [key, value] of Object.entries(studio)) {
    if (!isSafeKey(key)) continue
    const current = disk[key]

    // A `null` from Studio is a field set back to "unset", so the factory default applies again.
    if (value === null) {
      if (current === undefined || isOptionValue(current)) delete merged[key]
      continue
    }

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
        throw new Diagnostics.Error({
          code: Diagnostics.code.pluginNotFound,
          severity: 'error',
          message: `Plugin "${diskPlugin.name}" is not an installed @kubb/plugin-* package or Kubb extension, so Studio cannot change its options. Edit it in the config file, or only enable or disable it from Studio.`,
          cause: toError(cause),
        })
      })

      return resolved ?? diskPlugin
    }),
  )

  const studioOnly = activeStudioPlugins.filter((entry) => !diskNames.has(pluginNameOf(entry.name)))

  return [...merged, ...(await resolvePlugins({ plugins: studioOnly, extensions }))]
}

/**
 * Throws `KUBB_PATH_TRAVERSAL` when a plugin would write outside the config's output folder to a path
 * the disk config does not set. Studio can change `output.path`, also inside `override`, and add
 * plugins, so without this check any member of the Studio organization could write any file the agent
 * can reach, including `node_modules` code the next run imports. A path from the config file stays
 * allowed, since a monorepo may write outside its root.
 */
export function assertOutputPaths({
  plugins,
  diskPlugins,
  root,
  outputPath,
}: {
  plugins: Array<Plugin>
  diskPlugins: Array<Plugin>
  root: string
  outputPath: string
}): void {
  const base = path.resolve(root, outputPath)
  const targetsOf = (plugin: Plugin): Array<string> => {
    const { output, override } = (plugin.options ?? {}) as { output?: { path?: unknown }; override?: Array<{ options?: { output?: { path?: unknown } } }> }
    const outputs = [output, ...(Array.isArray(override) ? override.map((entry) => entry?.options?.output) : [])]
    return outputs.flatMap((entry) => (typeof entry?.path === 'string' ? [path.resolve(base, entry.path)] : []))
  }
  const diskTargets = new Set(diskPlugins.flatMap(targetsOf))

  for (const plugin of plugins) {
    const target = targetsOf(plugin).find((resolved) => !diskTargets.has(resolved) && !isPathInside(resolved, base))
    if (!target) continue

    throw new Diagnostics.Error({
      code: Diagnostics.code.pathTraversal,
      severity: 'error',
      message: `Plugin "${plugin.name}" would write to "${target}", outside the output folder "${base}". Studio can only set an output path inside it.`,
      help: 'Choose an output path inside the output folder, or set this path in the config file.',
      location: { kind: 'config' },
      plugin: plugin.name,
    })
  }
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
  const factory = await loadFactory({ packageName, extensions, kind }).catch((cause: unknown) => {
    throw new Diagnostics.Error({
      code: kind === 'plugin' ? Diagnostics.code.pluginNotFound : Diagnostics.code.unknown,
      severity: 'error',
      message: `The ${kind} "${name}" is not an installed Kubb extension, so Studio cannot change its options. Edit it in the config file.`,
      cause: toError(cause),
    })
  })

  return factory(mergeOptions((disk.options as Record<string, unknown>) ?? {}, studioOptions as Record<string, unknown>)) as T
}

/** Merges Studio's valid `output` overrides, with `null` unsetting a member. */
export function mergeOutput({ output, studio }: { output: Config['output']; studio: unknown }): Config['output'] {
  if (!isPlainObject(studio)) return output
  const overrides = Object.fromEntries(Object.entries(studio).filter(([key, value]) => (value === null ? isOutputKey(key) : isOutputValue({ key, value }))))
  return mergeOptions(output, overrides) as Config['output']
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
  extensions = new Map(),
}: {
  diskParsers: Array<Parser>
  studioParsers: JSONKubbConfig['parsers'] | undefined
  extensions?: InstalledExtensions
}): Promise<Array<Parser>> {
  if (!studioParsers?.length) return diskParsers

  const studioOptions = new Map(studioParsers.map((entry) => [entry.name, entry.options]))

  return Promise.all(
    diskParsers.map((parser) =>
      rebuildExtension({
        disk: parser,
        studioOptions: studioOptions.get(toStudioName({ name: resolveMeta(parser).name, extensions, kind: 'parser' })),
        kind: 'parser',
        extensions,
      }),
    ),
  )
}
