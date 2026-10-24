import { isPackageName } from '@kubb/core'
import { camelCase } from '@internals/utils'
import type { InstalledExtensions, OptionValue } from './types.ts'

/** `@kubb/plugin-ts` becomes `plugin-ts`, the `name` Kubb plugin factories use. */
export function toPluginName(packageName: string): string {
  return packageName.split('/').pop() ?? packageName
}

/** `@kubb/plugin-react-query` becomes `pluginReactQuery`, the export a plugin package uses by convention. */
export function toExportName(packageName: string): string {
  return camelCase(toPluginName(packageName))
}

const KUBB_PLUGIN_SPECIFIER = /^@kubb\/plugin-[\w.-]+$/

/** Only a `@kubb/plugin-*` package or an installed plugin extension may be imported, never a path or URL. */
export function isAllowedPlugin({ packageName, extensions }: { packageName: string; extensions: InstalledExtensions }): boolean {
  if (!isPackageName(packageName)) return false
  return KUBB_PLUGIN_SPECIFIER.test(packageName) || extensions.get(packageName)?.manifest.kind === 'plugin'
}

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/** Whether `key` can be an option key without reaching the object's prototype. */
export function isSafeKey(key: string): boolean {
  return !UNSAFE_KEYS.has(key)
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === null || prototype === Object.prototype
}

/** Whether `value` survives a JSON round trip, so an edit never writes a lossy copy into the file. */
export function isOptionValue(value: unknown): value is OptionValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(isOptionValue)
  if (isPlainObject(value)) return Object.entries(value).every(([key, entry]) => isSafeKey(key) && isOptionValue(entry))

  return false
}

/** The root `output` members Studio may set, with the values each takes. */
const OUTPUT_VALUES: Record<string, (value: unknown) => boolean> = {
  barrel: (value) => value === false || (isPlainObject(value) && Object.keys(value).length === 1 && (value.type === 'named' || value.type === 'all')),
  format: (value) => value === false || ['auto', 'prettier', 'biome', 'oxfmt'].includes(value as string),
  lint: (value) => value === false || ['auto', 'eslint', 'biome', 'oxlint'].includes(value as string),
  clean: (value) => typeof value === 'boolean',
  defaultBanner: (value) => value === false || value === 'simple' || value === 'full',
}

export function isOutputKey(key: string): boolean {
  return Object.hasOwn(OUTPUT_VALUES, key)
}

export function isOutputValue({ key, value }: { key: string; value: unknown }): boolean {
  return isOutputKey(key) && OUTPUT_VALUES[key]!(value)
}

export function pickOutput<T>(output: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(output).filter(([key]) => isOutputKey(key)))
}
