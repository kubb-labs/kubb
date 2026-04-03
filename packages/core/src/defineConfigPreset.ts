import type { Parser } from './defineParser.ts'
import type { Adapter, BuiltInPreset, ConfigPresetDefinition, UnknownUserPlugin, UserConfig } from './types.ts'

/**
 * Global registry that maps preset names to their definitions.
 * Built-in presets are registered by the `kubb` meta-package when it is first imported.
 * Custom presets can be added via {@link registerConfigPreset}.
 */
export const configPresetRegistry = new Map<string, ConfigPresetDefinition>()

/**
 * Defines a config-level preset.
 * This is a typed identity helper — it returns the object as-is with correct typings.
 *
 * @example
 * ```ts
 * import { defineConfigPreset, registerConfigPreset } from '@kubb/core'
 * import { adapterOas } from '@kubb/adapter-oas'
 * import { parserTs } from '@kubb/parser-ts'
 * import { pluginTs } from '@kubb/plugin-ts'
 *
 * const myPreset = defineConfigPreset({
 *   name: 'my-preset',
 *   adapter: adapterOas(),
 *   parsers: [parserTs],
 *   plugins: [pluginTs()],
 * })
 * registerConfigPreset(myPreset)
 * ```
 */
export function defineConfigPreset(definition: ConfigPresetDefinition): ConfigPresetDefinition {
  return definition
}

/**
 * Registers a config preset in the global registry.
 * Registration is idempotent — registering under the same name overwrites the previous entry.
 */
export function registerConfigPreset(definition: ConfigPresetDefinition): void {
  configPresetRegistry.set(definition.name, definition)
}

/**
 * Looks up a preset by name. Returns `undefined` when not found.
 */
export function resolvePreset(name: BuiltInPreset): ConfigPresetDefinition | undefined {
  return configPresetRegistry.get(name)
}

/**
 * Merges a config preset into a `UserConfig`, respecting the following rules:
 *
 * - **adapter**: user-provided adapter wins; preset adapter is used only when none is supplied.
 * - **parsers**: union by `name` — the user's parser replaces a preset parser with the same name;
 *   preset parsers not overridden are kept.
 * - **plugins**: union by `name` — the user's plugin replaces a preset plugin with the same name;
 *   preset plugins not overridden are appended before the user's unique plugins.
 *
 * When no `configPreset` is specified, the config is returned unchanged.
 * When `configPreset` is specified but not found in the registry, an error is thrown.
 */
export function applyPreset(userConfig: UserConfig): UserConfig {
  const { configPreset, ...rest } = userConfig

  if (!configPreset) {
    return userConfig
  }

  const definition = resolvePreset(configPreset)

  if (!definition) {
    const available = [...configPresetRegistry.keys()]
    const hint = available.length > 0 ? `\n  Available presets: ${available.map((n) => `'${n}'`).join(', ')}` : '\n  No presets are currently registered. Make sure to import from \'kubb\' instead of \'@kubb/core\'.'
    throw new Error(`[kubb] Unknown configPreset '${configPreset}'.${hint}`)
  }

  const resolvedAdapter = resolveAdapter(definition.adapter, rest.adapter)
  const resolvedParsers = mergeParsers(definition.parsers, rest.parsers)
  const resolvedPlugins = mergePlugins(definition.plugins, rest.plugins)

  return {
    ...rest,
    ...(resolvedAdapter !== undefined ? { adapter: resolvedAdapter } : {}),
    ...(resolvedParsers !== undefined ? { parsers: resolvedParsers } : {}),
    ...(resolvedPlugins !== undefined ? { plugins: resolvedPlugins } : {}),
  }
}

function resolveAdapter(presetAdapter: Adapter | undefined, userAdapter: Adapter | undefined): Adapter | undefined {
  return userAdapter ?? presetAdapter
}

function mergeParsers(presetParsers: Array<Parser> | undefined, userParsers: Array<Parser> | undefined): Array<Parser> | undefined {
  if (!presetParsers?.length && !userParsers?.length) {
    return undefined
  }

  const preset = presetParsers ?? []
  const user = userParsers ?? []

  const userNames = new Set(user.map((p) => p.name))
  return [...preset.filter((p) => !userNames.has(p.name)), ...user]
}

function mergePlugins(
  presetPlugins: Array<Omit<UnknownUserPlugin, 'inject'>> | undefined,
  userPlugins: Array<Omit<UnknownUserPlugin, 'inject'>> | undefined,
): Array<Omit<UnknownUserPlugin, 'inject'>> | undefined {
  if (!presetPlugins?.length && !userPlugins?.length) {
    return undefined
  }

  const preset = presetPlugins ?? []
  const user = userPlugins ?? []

  const userNames = new Set(user.map((p) => p.name))
  return [...preset.filter((p) => !userNames.has(p.name)), ...user]
}
