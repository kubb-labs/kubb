import type { ExtensionKind, ExtensionManifest } from '@kubb/core'

/**
 * Which `defineConfig(...)` entry an edit targets, for a config file that exports an array.
 *
 * A number selects by position, a string matches the entry's `name`. Omitted targets the only
 * entry, or the first one when the file exports an array.
 */
export type ConfigRef = string | number

/**
 * A value the agent can read out of a plugin option in `kubb.config.ts` and round-trip through JSON.
 */
export type OptionValue = string | number | boolean | null | Array<OptionValue> | { [key: string]: OptionValue }

/**
 * The kinds of {@link ConfigEdit}, one per `operation`.
 */
export const ConfigEditOperation = {
  SET_OPTION: 'set-option',
  REMOVE_OPTION: 'remove-option',
  ADD_PLUGIN: 'add-plugin',
  DISABLE_PLUGIN: 'disable-plugin',
  ENABLE_PLUGIN: 'enable-plugin',
  SET_INPUT: 'set-input',
  SET_OUTPUT: 'set-output',
  REMOVE_OUTPUT: 'remove-output',
} as const
export type ConfigEditOperation = (typeof ConfigEditOperation)[keyof typeof ConfigEditOperation]

/**
 * One change to a plugin's options in the user's `kubb.config.ts`.
 *
 * `plugin` is the package name (`@kubb/plugin-ts`), the same identity used in Studio's `JSONKubbConfig`.
 * The agent applies these to the file with an AST patch, so only the targeted values are rewritten.
 *
 * Kept apart from `configFile.ts`, so `@kubb/studio/protocol` re-exports the wire contract without the parser.
 */
export type ConfigEdit =
  /**
   * Write a literal option value. `path` walks nested objects, so `['enum', 'type']` targets
   * `pluginTs({ enum: { type } })`. `kind` names which factory call `plugin` is: one in `plugins`
   * when left out, the config's `adapter`, or one in `parsers`.
   */
  | { operation: typeof ConfigEditOperation.SET_OPTION; config?: ConfigRef; kind?: ExtensionKind; plugin: string; path: Array<string>; value: unknown }
  /**
   * Drop an option so the extension falls back to its default. `kind` as for `set-option`.
   */
  | { operation: typeof ConfigEditOperation.REMOVE_OPTION; config?: ConfigRef; kind?: ExtensionKind; plugin: string; path: Array<string> }
  /**
   * Add a plugin factory call and its import to the `plugins` array.
   */
  | { operation: typeof ConfigEditOperation.ADD_PLUGIN; config?: ConfigRef; plugin: string; options?: Record<string, unknown> }
  /**
   * Comment the plugin call out, keeping its options in the file so enabling it again restores them.
   */
  | { operation: typeof ConfigEditOperation.DISABLE_PLUGIN; config?: ConfigRef; plugin: string }
  /**
   * Uncomment a plugin call a previous `disable-plugin` commented out.
   */
  | { operation: typeof ConfigEditOperation.ENABLE_PLUGIN; config?: ConfigRef; plugin: string }
  /**
   * Point the config's `input` at a spec. The agent writes a document to `openapi.yaml` (or
   * `openapi.json`, and `openapi-<entry>` for a later entry) in its project and points `input` there.
   * Refused without `allowSaveInput`, and a managed agent takes only a document, a URL, or a `git+` file.
   */
  | { operation: typeof ConfigEditOperation.SET_INPUT; config?: ConfigRef; input: string }
  /** Write a literal inside the root `output` object, for the members `JSONKubbConfig.output` takes. */
  | { operation: typeof ConfigEditOperation.SET_OUTPUT; config?: ConfigRef; path: Array<string>; value: unknown }
  /** Drop a member of the root `output` object that `set-output` may write. */
  | { operation: typeof ConfigEditOperation.REMOVE_OUTPUT; config?: ConfigRef; path: Array<string> }

/** The top-level keys of an object in the config file, as {@link PluginView.options} describes. */
export type OptionsView = Record<string, { literal: boolean; value?: OptionValue; locked?: Array<Array<string>> }>

/**
 * A factory call the agent found in a `defineConfig(...)`: a plugin in `plugins`, the `adapter`, or
 * a parser in `parsers`.
 */
export type PluginView = {
  /**
   * Local identifier of the factory in the file, e.g. `pluginTs`. This is the alias when the plugin
   * was imported under one.
   */
  importName: string
  /**
   * Module the factory is imported from, e.g. `@kubb/plugin-ts`.
   */
  packageName: string
  /**
   * Top-level option keys, each flagged with whether the agent may write it and, when it can, the
   * value found in the file. An option marked `literal: false` holds a function or a reference the
   * agent will not overwrite, so Studio shows the control disabled rather than hiding it, and
   * `value` is absent since there is nothing safe to display as the current value.
   *
   * An object option that holds code in only some members, such as
   * `output: { path: './gen', banner: () => '' }`, also carries `value` with its literal members
   * and `locked` with the paths of the members that are code, relative to the option
   * (`[['banner']]`). A `set-option` at any deeper path outside `locked` succeeds, so Studio can edit
   * `output.path` there.
   */
  options: OptionsView
  /**
   * Set when the plugin call is commented out in the file. Its options stay on disk but are not
   * readable, so `options` is empty until it is enabled again.
   */
  disabled?: true
}

/**
 * One `defineConfig(...)` entry. A config file that exports a single object has exactly one.
 */
export type ConfigView = {
  /**
   * The entry's `name`, when it sets one. Studio labels the config picker with it.
   */
  name?: string
  /**
   * Each plugin call in the entry, with its top-level option keys.
   */
  plugins: Array<PluginView>
  /**
   * The `adapter` call, when the entry sets one through an imported factory.
   */
  adapter?: PluginView
  /**
   * The parser calls in `parsers`, when the entry lists any through imported factories.
   */
  parsers?: Array<PluginView>
  /** The root `output` members Studio may set. Absent when `output` is not an object literal. */
  output?: OptionsView
}

/**
 * What the agent found in the user's config file, so Studio knows which controls it may offer.
 * Absent when the agent could not read the file at all.
 */
export type ConfigFileView =
  | {
      managed: true
      /**
       * One entry per config the file exports, in source order. Every {@link ConfigEdit} names
       * which of these it targets through its `config` field.
       */
      configs: Array<ConfigView>
    }
  | {
      managed: false
      /**
       * Why the file is outside what the agent edits, for example a default export that is not a
       * `defineConfig(...)` call. Studio shows this and offers no property-level controls.
       */
      reason: string
    }

/**
 * Outcome of a single {@link ConfigEdit}, returned in Studio's `SaveResult`.
 */
export type ConfigEditOutcome = {
  edit: ConfigEdit
  applied: boolean
  /**
   * Why the edit was refused, absent when it was applied.
   */
  reason?: string
}

/** An installed extension package and the manifest it ships. */
export type ExtensionEntry = { package: string; version: string; manifest: ExtensionManifest }

/** Installed extension packages by package name, the only ones Studio may import besides `@kubb/plugin-*`. */
export type InstalledExtensions = ReadonlyMap<string, ExtensionEntry>
