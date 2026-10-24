import { isPackageName } from '@kubb/core'
import { camelCase } from '@internals/utils'
import type { InstalledExtensions, OptionValue } from './types.ts'

/**
 * Strips the `@kubb/` scope from a plugin package name, matching the `name` convention Kubb
 * plugin factories use internally.
 *
 * @example
 * ```ts
 * toPluginName('@kubb/plugin-ts') // 'plugin-ts'
 * ```
 */
export function toPluginName(packageName: string): string {
  return packageName.split('/').pop() ?? packageName
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
 * Whether `value` is an object literal or a null-prototype object, not an array or class instance.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
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

/** The root `output` members Studio may set, with the values each takes. The rest, `path` and `postGenerate` among them, stay with the config file. */
const OUTPUT_VALUES: Record<string, (value: unknown) => boolean> = {
  barrel: (value) => value === false || (isPlainObject(value) && Object.keys(value).length === 1 && (value.type === 'named' || value.type === 'all')),
  format: (value) => value === false || ['auto', 'prettier', 'biome', 'oxfmt'].includes(value as string),
  lint: (value) => value === false || ['auto', 'eslint', 'biome', 'oxlint'].includes(value as string),
  clean: (value) => typeof value === 'boolean',
  defaultBanner: (value) => value === false || value === 'simple' || value === 'full',
}

/** Whether Studio may set the root `output` member `key`. */
export function isOutputKey(key: string): boolean {
  return Object.hasOwn(OUTPUT_VALUES, key)
}

/** Whether Studio may set the root `output` member `key` to `value`. */
export function isOutputValue({ key, value }: { key: string; value: unknown }): boolean {
  return isOutputKey(key) && OUTPUT_VALUES[key]!(value)
}

/** The members of `output` Studio may see and set. */
export function pickOutput<T>(output: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(output).filter(([key]) => isOutputKey(key)))
}
