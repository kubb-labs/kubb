import type { ValueOf } from '@internals/utils'
import type { ExtensionKind, ExtensionManifest } from '@kubb/core'

/** Which `defineConfig(...)` entry an edit targets: its index or `name`, the first entry when omitted. */
export type ConfigRef = string | number

/** A literal option value that survives a JSON round trip. */
export type OptionValue = string | number | boolean | null | Array<OptionValue> | { [key: string]: OptionValue }

export const extensionKinds = { plugin: 'plugin', adapter: 'adapter', parser: 'parser' } as const satisfies Record<string, ExtensionKind>

export const ConfigEditOperation = {
  SET_OPTION: 'set-option',
  REMOVE_OPTION: 'remove-option',
  ADD_PLUGIN: 'add-plugin',
  REMOVE_EXTENSION: 'remove-extension',
  DISABLE_PLUGIN: 'disable-plugin',
  ENABLE_PLUGIN: 'enable-plugin',
  SET_INPUT: 'set-input',
  SET_OUTPUT: 'set-output',
  REMOVE_OUTPUT: 'remove-output',
} as const
export type ConfigEditOperation = ValueOf<typeof ConfigEditOperation>

/**
 * One change to `kubb.config.ts`. `plugin` is the package name, and `kind` picks the `plugins` entry
 * (default), the `adapter`, or a `parsers` entry. `path` walks nested option objects.
 */
export type ConfigEdit =
  | { operation: typeof ConfigEditOperation.SET_OPTION; config?: ConfigRef; kind?: ExtensionKind; plugin: string; path: Array<string>; value: unknown }
  | { operation: typeof ConfigEditOperation.REMOVE_OPTION; config?: ConfigRef; kind?: ExtensionKind; plugin: string; path: Array<string> }
  /** With `kind: 'parser'`, adds to `parsers`. A config without `parsers` gets the defaults written next to it, so they keep running. */
  | {
      operation: typeof ConfigEditOperation.ADD_PLUGIN
      config?: ConfigRef
      kind?: typeof extensionKinds.plugin | typeof extensionKinds.parser
      plugin: string
      options?: Record<string, unknown>
    }
  /** Deletes every call of a plugin, or a parser with `kind: 'parser'`, a disabled block included, and the imports nothing else uses. */
  | {
      operation: typeof ConfigEditOperation.REMOVE_EXTENSION
      config?: ConfigRef
      kind?: typeof extensionKinds.plugin | typeof extensionKinds.parser
      plugin: string
    }
  | { operation: typeof ConfigEditOperation.DISABLE_PLUGIN; config?: ConfigRef; plugin: string }
  | { operation: typeof ConfigEditOperation.ENABLE_PLUGIN; config?: ConfigRef; plugin: string }
  | { operation: typeof ConfigEditOperation.SET_INPUT; config?: ConfigRef; input: string }
  | { operation: typeof ConfigEditOperation.SET_OUTPUT; config?: ConfigRef; path: Array<string>; value: unknown }
  | { operation: typeof ConfigEditOperation.REMOVE_OUTPUT; config?: ConfigRef; path: Array<string> }

/** Option keys, each with whether Studio may write it. `locked` lists the code paths inside a partly literal object. */
export type OptionsView = Record<string, { literal: boolean; value?: OptionValue; locked?: Array<Array<string>> }>

/** A factory call in `plugins`, `adapter`, or `parsers`. `importName` is the local name, alias included. */
export type PluginView = {
  importName: string
  packageName: string
  options: OptionsView
  /** The call is commented out by `disable-plugin`. */
  disabled?: true
}

export type ConfigView = {
  name?: string
  plugins: Array<PluginView>
  adapter?: PluginView
  parsers?: Array<PluginView>
  /** The root `output` members Studio may set, absent when `output` is not an object literal. */
  output?: OptionsView
}

/** The config file as Studio may edit it, or why it cannot. */
export type ConfigFileView = { managed: true; configs: Array<ConfigView> } | { managed: false; reason: string }

export type ConfigEditOutcome = {
  edit: ConfigEdit
  applied: boolean
  reason?: string
}

export type ExtensionEntry = {
  package: string
  version: string
  manifest: ExtensionManifest
  /** Ships with `kubb` at its version, so updating `kubb` updates it and `kubb update` cannot. */
  bundled?: true
}

/** Installed extensions by package name, the only ones Studio may import besides `@kubb/plugin-*`. */
export type InstalledExtensions = ReadonlyMap<string, ExtensionEntry>
