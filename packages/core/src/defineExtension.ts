import { satisfies } from 'verkit'
import { version as kubbVersion } from '../package.json'
import { Diagnostics } from './Diagnostics.ts'
import type { PluginName } from './definePlugin.ts'
import type { Config } from './types.ts'

/**
 * What an extension extends: a plugin generates code, an adapter reads the input, a parser prints files.
 */
export type ExtensionKind = 'plugin' | 'adapter' | 'parser'

/**
 * Identity and registry data for an extension. Kubb reads `name` and `compatibility` at runtime.
 * Studio, the kubb.dev registry, and the docs read the rest.
 */
export type ExtensionMeta<TName extends string = string> = {
  /**
   * Unique name, such as `'plugin-ts'`. Becomes the plugin's `name`.
   */
  name: TName
  /**
   * Package version. Dependents check their `version` range against it.
   */
  version?: string
  displayName?: string
  /**
   * One-sentence summary of what the extension generates or does.
   */
  description?: string
  category?: string
  icon?: { light: string; dark?: string }
  tags?: Array<string>
  /**
   * Semver ranges the extension supports. A mismatch fails the run with `KUBB_INCOMPATIBLE_EXTENSION`.
   */
  compatibility?: {
    kubb?: string
    node?: string
  }
  docs?: string
}

/**
 * An extension's identity: `meta`, a `name`, or both. `name` is deprecated in favor of `meta.name`.
 */
export type ExtensionNamed = { name?: string; meta?: ExtensionMeta }

/**
 * Returns `meta`, or `{ name }` for an extension that only sets the deprecated `name`. Throws `KUBB_INVALID_PLUGIN_OPTIONS` when it has neither.
 */
export function resolveMeta({ name, meta }: ExtensionNamed): ExtensionMeta {
  if (meta) return meta
  if (name) return { name }

  throw new Diagnostics.Error({
    code: Diagnostics.code.invalidPluginOptions,
    severity: 'error',
    message: 'An extension has neither `meta.name` nor `name`.',
    help: 'Set `meta: { name }` on the plugin or parser.',
    location: { kind: 'config' },
  })
}

/**
 * Sets how Kubb checks one entry in a `dependencies` record.
 */
export type ExtensionDependency = {
  /**
   * Semver range the dependency's `meta.version` must satisfy. Skipped when the dependency has no `meta.version`.
   */
  version?: string
  /**
   * When `true`, Kubb skips the entry if the plugin is missing, but still checks `version` on an installed one.
   * Otherwise a missing plugin fails the run with `KUBB_MISSING_DEPENDENCY`.
   */
  optional?: boolean
}

/**
 * Plugins an extension builds on, keyed by name, or a function that picks them from the user's options.
 */
export type ExtensionDependencies<TOptions = object> =
  | ExtensionDependencyRecord
  // Method syntax keeps `options` bivariant, so a `Plugin<PluginTs>` still fits `Config['plugins']`.
  | { resolve(options: TOptions, kubb: { config: Config }): ExtensionDependencyRecord }['resolve']

/**
 * Maps each dependency's plugin name to how Kubb checks it.
 */
export type ExtensionDependencyRecord = Partial<Record<PluginName, ExtensionDependency>>

/**
 * Throws `KUBB_INCOMPATIBLE_EXTENSION` when the running Kubb or Node.js version is outside `meta.compatibility`.
 */
export function checkCompatibility(meta: ExtensionMeta): void {
  const checks = [
    { target: 'Kubb', range: meta.compatibility?.kubb, version: kubbVersion },
    { target: 'Node.js', range: meta.compatibility?.node, version: process.versions.node },
  ]

  for (const { target, range, version } of checks) {
    if (!range || satisfies(version, range, { includePrerelease: true })) continue

    throw new Diagnostics.Error({
      code: Diagnostics.code.incompatibleExtension,
      severity: 'error',
      message: `"${meta.name}" requires ${target} ${range}, but ${version} is running.`,
      help: `Use a ${target} version that satisfies ${range}, or a version of "${meta.name}" that supports ${target} ${version}.`,
      location: { kind: 'config' },
      plugin: meta.name,
    })
  }
}

/**
 * Throws `KUBB_MISSING_DEPENDENCY` for a missing required entry in a `dependencies` record, and
 * `KUBB_INCOMPATIBLE_DEPENDENCY` when an entry's `meta.version` is out of range. Arrays are not checked.
 */
export function checkDependencies({
  name,
  dependencies,
  plugins,
}: {
  name: string
  dependencies: Array<PluginName> | ExtensionDependencyRecord | undefined
  plugins: ReadonlyMap<string, { meta?: ExtensionMeta }>
}): void {
  if (!dependencies || Array.isArray(dependencies)) return

  for (const [dependencyName, dependency] of Object.entries(dependencies)) {
    const target = plugins.get(dependencyName)

    if (!target) {
      if (dependency?.optional) continue

      throw new Diagnostics.Error({
        code: Diagnostics.code.missingDependency,
        severity: 'error',
        message: `Plugin "${dependencyName}" is required by "${name}" but not found.`,
        help: `Add "${dependencyName}" to the \`plugins\` array in kubb.config.ts.`,
        location: { kind: 'config' },
        plugin: name,
      })
    }

    const range = dependency?.version
    const version = target.meta?.version
    if (!range || !version || satisfies(version, range, { includePrerelease: true })) continue

    throw new Diagnostics.Error({
      code: Diagnostics.code.incompatibleDependency,
      severity: 'error',
      message: `"${name}" requires "${dependencyName}" ${range}, but ${version} is configured.`,
      help: `Install a version of "${dependencyName}" that satisfies ${range}.`,
      location: { kind: 'config' },
      plugin: name,
    })
  }
}

/**
 * The function an extension definition returns. Call it with user options to get the extension.
 */
export type ExtensionFactory<TKind extends ExtensionKind, TOptions, TExtension, TName extends string = string> = {
  (options?: TOptions): TExtension
  kind: TKind
  meta: ExtensionMeta<TName>
}

/**
 * Builds the factory behind `definePlugin`, `defineParser`, and `createAdapter`. It passes `{}` when called without
 * options, and carries `kind`, plus `meta` when the definition has it, so tools can read them
 * without calling it.
 *
 * @internal
 */
export function defineExtension<TKind extends ExtensionKind, TOptions extends object, TExtension, TName extends string>(params: {
  kind: TKind
  meta: ExtensionMeta<TName>
  build: (options: TOptions) => TExtension
}): ExtensionFactory<TKind, TOptions, TExtension, TName>
export function defineExtension<TKind extends ExtensionKind, TOptions extends object, TExtension>(params: {
  kind: TKind
  build: (options: TOptions) => TExtension
}): ((options?: TOptions) => TExtension) & { kind: TKind }
export function defineExtension({ kind, meta, build }: { kind: ExtensionKind; meta?: ExtensionMeta; build: (options: object) => unknown }) {
  const factory = (options?: object) => build(options ?? {})
  return Object.assign(factory, meta ? { kind, meta } : { kind })
}
