import type { AsyncEventEmitter, PossiblePromise } from '@internals/utils'
import type { FileNode, ImportNode, InputNode, Node, OperationNode, Printer, SchemaNode, Visitor } from '@kubb/ast/types'
import type { HttpMethod } from '@kubb/oas'
import type { DEFAULT_STUDIO_URL, logLevel } from './constants.ts'
import type { Storage } from './createStorage.ts'
import type { Generator } from './defineGenerator.ts'
import type { Parser } from './defineParser.ts'
import type { KubbEvents } from './Kubb.ts'
import type { PluginDriver } from './PluginDriver.ts'

export type { Printer, PrinterFactoryOptions, PrinterPartial } from '@kubb/ast/types'

declare global {
  namespace Kubb {
    interface PluginContext {}
    /**
     * Registry that maps plugin names to their `PluginFactoryOptions`.
     * Augment this interface in each plugin's `types.ts` to enable automatic
     * typing for `getPlugin` and `requirePlugin`.
     *
     * @example
     * ```ts
     * // packages/plugin-ts/src/types.ts
     * declare global {
     *   namespace Kubb {
     *     interface PluginRegistry {
     *       'plugin-ts': PluginTs
     *     }
     *   }
     * }
     * ```
     */
    interface PluginRegistry {}
  }
}

/**
 * Config used in `kubb.config.ts`
 *
 * @example
 * import { defineConfig } from '@kubb/core'
 * export default defineConfig({
 * ...
 * })
 */
export type UserConfig<TInput = Input> = Omit<Config<TInput>, 'root' | 'plugins' | 'parsers' | 'adapter'> & {
  /**
   * The project root directory, which can be either an absolute path or a path relative to the location of your `kubb.config.ts` file.
   * @default process.cwd()
   */
  root?: string
  /**
   * An array of parsers used to convert generated files to strings.
   * Each parser handles specific file extensions (e.g. `.ts`, `.tsx`).
   *
   * A catch-all fallback parser is always appended last for any unhandled extension.
   *
   * When omitted, `parserTsx` from `@kubb/parser-ts` is used automatically as the
   * default (requires `@kubb/parser-ts` to be installed as an optional dependency).
   * @default [parserTsx] — from `@kubb/parser-ts`
   * @example
   * ```ts
   * import { parserTs, tsxParser } from '@kubb/parser-ts'
   * export default defineConfig({
   *   parsers: [parserTs, tsxParser],
   * })
   * ```
   */
  parsers?: Array<Parser>
  /**
   * Adapter that converts the input file into a `@kubb/ast` `InputNode` — the universal
   * intermediate representation consumed by all Kubb plugins.
   *
   * When omitted, `adapterOas()` from `@kubb/adapter-oas` is used automatically as the
   * default (requires `@kubb/adapter-oas` to be installed as an optional dependency).
   *
   * - Use `@kubb/adapter-oas` for OpenAPI / Swagger (default).
   * - Use `@kubb/adapter-drizzle` or `@kubb/adapter-asyncapi` for other formats.
   *
   * @default adapterOas() — from `@kubb/adapter-oas`
   */
  adapter?: Adapter
  /**
   * An array of Kubb plugins used for generation. Each plugin may have additional configurable options (defined within the plugin itself). If a plugin relies on another plugin, an error will occur if the required dependency is missing. Refer to “pre” for more details.
   */
  // inject needs to be omitted because else we have a clash with the PluginDriver instance
  plugins?: Array<Omit<UnknownUserPlugin, 'inject'>>
}

export type InputPath = {
  /**
   * Specify your Swagger/OpenAPI file, either as an absolute path or a path relative to the root.
   */
  path: string
}

export type InputData = {
  /**
   * A `string` or `object` that contains your Swagger/OpenAPI data.
   */
  data: string | unknown
}

type Input = InputPath | InputData

/**
 * The raw source passed to an adapter's `parse` function.
 * Mirrors the shape of `Config['input']` with paths already resolved to absolute.
 */
export type AdapterSource = { type: 'path'; path: string } | { type: 'data'; data: string | unknown } | { type: 'paths'; paths: Array<string> }

/**
 * Type parameters for an adapter definition.
 *
 * Mirrors `PluginFactoryOptions` but scoped to the adapter lifecycle:
 * - `TName` — unique string identifier (e.g. `'oas'`, `'asyncapi'`)
 * - `TOptions` — raw user-facing options passed to the adapter factory
 * - `TResolvedOptions` — defaults applied; what the adapter stores as `options`
 * - `TDocument` — type of the raw source document exposed by the adapter after `parse()`
 */
export type AdapterFactoryOptions<
  TName extends string = string,
  TOptions extends object = object,
  TResolvedOptions extends object = TOptions,
  TDocument = unknown,
> = {
  name: TName
  options: TOptions
  resolvedOptions: TResolvedOptions
  document: TDocument
}

/**
 * An adapter converts a source file or data into a `@kubb/ast` `InputNode`.
 *
 * Adapters are the single entry-point for different schema formats
 * (OpenAPI, AsyncAPI, Drizzle, …) and produce the universal `InputNode`
 * that all Kubb plugins consume.
 *
 * @example
 * ```ts
 * import { oasAdapter } from '@kubb/adapter-oas'
 *
 * export default defineConfig({
 *   adapter: adapterOas(),         // default — OpenAPI / Swagger
 *   input:   { path: './openapi.yaml' },
 *   plugins: [pluginTs(), pluginZod()],
 * })
 * ```
 */
export type Adapter<TOptions extends AdapterFactoryOptions = AdapterFactoryOptions> = {
  /**
   * Human-readable identifier, e.g. `'oas'`, `'drizzle'`, `'asyncapi'`.
   */
  name: TOptions['name']
  /**
   * Resolved options (after defaults have been applied).
   */
  options: TOptions['resolvedOptions']
  /**
   * The raw source document produced after the first `parse()` call.
   * `undefined` before parsing; typed by the adapter's `TDocument` generic.
   */
  document: TOptions['document'] | null
  inputNode: InputNode | null
  /**
   * Convert the raw source into a universal `InputNode`.
   */
  parse: (source: AdapterSource) => PossiblePromise<InputNode>
  /**
   * Extracts `ImportNode` entries needed by a `SchemaNode` tree.
   * Populated after the first `parse()` call. Returns an empty array before that.
   *
   * The `resolve` callback receives the collision-corrected schema name and must
   * return the `{ name, path }` pair for the import, or `undefined` to skip it.
   */
  getImports: (node: SchemaNode, resolve: (schemaName: string) => { name: string; path: string }) => Array<ImportNode>
}

export type BarrelType = 'all' | 'named' | 'propagate'

export type DevtoolsOptions = {
  /**
   * Open the AST inspector view (`/ast`) in Kubb Studio.
   * When `false`, opens the main Studio page instead.
   * @default false
   */
  ast?: boolean
}

/**
 * @private
 */
export type Config<TInput = Input> = {
  /**
   * The name to display in the CLI output.
   */
  name?: string
  /**
   * The project root directory, which can be either an absolute path or a path relative to the location of your `kubb.config.ts` file.
   * @default process.cwd()
   */
  root: string
  /**
   * An array of parsers used to convert generated files to strings.
   * Each parser handles specific file extensions (e.g. `.ts`, `.tsx`).
   *
   * A catch-all fallback parser is always appended last for any unhandled extension.
   *
   * When omitted, `parserTs` from `@kubb/parser-ts` is used automatically as the
   * default (requires `@kubb/parser-ts` to be installed as an optional dependency).
   * @default [parserTs] — from `@kubb/parser-ts`
   * @example
   * ```ts
   * import { parserTs, tsxParser } from '@kubb/parser-ts'
   * export default defineConfig({
   *   parsers: [parserTs, tsxParser],
   * })
   * ```
   */
  parsers: Array<Parser>
  /**
   * Adapter that converts the input file into a `@kubb/ast` `InputNode` — the universal
   * intermediate representation consumed by all Kubb plugins.
   *
   * - Use `@kubb/adapter-oas` for OpenAPI / Swagger.
   * - Use `@kubb/adapter-drizzle` or `@kubb/adapter-asyncapi` for other formats.
   *
   * @example
   * ```ts
   * import { adapterOas } from '@kubb/adapter-oas'
   * export default defineConfig({
   *   adapter: adapterOas(),
   *   input: { path: './petStore.yaml' },
   * })
   * ```
   */
  adapter: Adapter
  /**
   * You can use either `input.path` or `input.data`, depending on your specific needs.
   */
  input: TInput
  output: {
    /**
     * The path where all generated files receives exported.
     * This can be an absolute path or a path relative to the specified root option.
     */
    path: string
    /**
     * Clean the output directory before each build.
     */
    clean?: boolean
    /**
     * Save files to the file system.
     * @default true
     * @deprecated Use `storage` to control where files are written.
     */
    write?: boolean
    /**
     * Storage backend for generated files.
     * Defaults to `fsStorage()` — the built-in filesystem driver.
     * Accepts any object implementing the {@link Storage} interface.
     * Keys are root-relative paths (e.g. `src/gen/api/getPets.ts`).
     * @default fsStorage()
     * @example
     * ```ts
     * import { memoryStorage } from '@kubb/core'
     * storage: memoryStorage()
     * ```
     */
    storage?: Storage
    /**
     * Specifies the formatting tool to be used.
     * - 'auto' automatically detects and uses biome or prettier (in that order of preference).
     * - 'prettier' uses Prettier for code formatting.
     * - 'biome' uses Biome for code formatting.
     * - 'oxfmt' uses Oxfmt for code formatting.
     * - false disables code formatting.
     * @default 'prettier'
     */
    format?: 'auto' | 'prettier' | 'biome' | 'oxfmt' | false
    /**
     * Specifies the linter that should be used to analyze the code.
     * - 'auto' automatically detects and uses biome, oxlint, or eslint (in that order of preference).
     * - 'eslint' uses ESLint for linting.
     * - 'biome' uses Biome for linting.
     * - 'oxlint' uses Oxlint for linting.
     * - false disables linting.
     * @default 'auto'
     */
    lint?: 'auto' | 'eslint' | 'biome' | 'oxlint' | false
    /**
     * Overrides the extension for generated imports and exports. By default, each plugin adds an extension.
     * @default { '.ts': '.ts'}
     */
    extension?: Record<FileNode['extname'], FileNode['extname'] | ''>
    /**
     * Configures how `index.ts` files are created, including disabling barrel file generation. Each plugin has its own `barrelType` option; this setting controls the root barrel file (e.g., `src/gen/index.ts`).
     * @default 'named'
     */
    barrelType?: 'all' | 'named' | false
    /**
     * Adds a default banner to the start of every generated file indicating it was generated by Kubb.
     * - 'simple' adds banner with link to Kubb.
     * - 'full' adds source, title, description, and OpenAPI version.
     * - false disables banner generation.
     * @default 'simple'
     */
    defaultBanner?: 'simple' | 'full' | false
    /**
     * Whether to override existing external files if they already exist.
     * When setting the option in the global configuration, all plugins inherit the same behavior by default.
     * However, all plugins also have an `output.override` option, which can be used to override the behavior for a specific plugin.
     * @default false
     */
    override?: boolean
  }
  /**
   * An array of Kubb plugins that used in the generation.
   * Each plugin may include additional configurable options(defined in the plugin itself).
   * If a plugin depends on another plugin, an error is returned if the required dependency is missing. See pre for more details.
   */
  plugins: Array<Plugin>
  /**
   * Devtools configuration for Kubb Studio integration.
   */
  devtools?:
    | true
    | {
        /**
         * Override the Kubb Studio base URL.
         * @default 'https://studio.kubb.dev'
         */
        studioUrl?: typeof DEFAULT_STUDIO_URL | (string & {})
      }
  /**
   * Hooks triggered when a specific action occurs in Kubb.
   */
  hooks?: {
    /**
     * Hook that triggers at the end of all executions.
     * Useful for running Prettier or ESLint to format/lint your code.
     */
    done?: string | Array<string>
  }
}

// plugin

/**
 * A type/string-pattern filter used for `include`, `exclude`, and `override` matching.
 */
type PatternFilter = {
  type: string
  pattern: string | RegExp
}

/**
 * A pattern filter paired with partial option overrides to apply when the pattern matches.
 */
type PatternOverride<TOptions> = PatternFilter & {
  options: Omit<Partial<TOptions>, 'override'>
}

/**
 * Context passed to `resolver.resolveOptions` to apply include/exclude/override filtering
 * for a given operation or schema node.
 */
export type ResolveOptionsContext<TOptions> = {
  options: TOptions
  exclude?: Array<PatternFilter>
  include?: Array<PatternFilter>
  override?: Array<PatternOverride<TOptions>>
}

/**
 * Base constraint for all plugin resolver objects.
 *
 * `default`, `resolveOptions`, `resolvePath`, and `resolveFile` are injected automatically
 * by `defineResolver` — plugin authors may override them but never need to implement them
 * from scratch.
 *
 * @example
 * ```ts
 * type MyResolver = Resolver & {
 *   resolveName(node: SchemaNode): string
 *   resolveTypedName(node: SchemaNode): string
 * }
 * ```
 */
export type Resolver = {
  name: string
  pluginName: Plugin['name']
  default(name: ResolveNameParams['name'], type?: ResolveNameParams['type']): string
  resolveOptions<TOptions>(node: Node, context: ResolveOptionsContext<TOptions>): TOptions | null
  resolvePath(params: ResolverPathParams, context: ResolverContext): string
  resolveFile(params: ResolverFileParams, context: ResolverContext): FileNode
  resolveBanner(node: InputNode | null, context: ResolveBannerContext): string | undefined
  resolveFooter(node: InputNode | null, context: ResolveBannerContext): string | undefined
}

/**
 * The user-facing subset of a `Resolver` — everything except the four methods injected by
 * `defineResolver` (`default`, `resolveOptions`, `resolvePath`, and `resolveFile`).
 *
 * All four injected methods can still be overridden by providing them explicitly in the builder.
 *
 * @example
 * ```ts
 * export const resolver = defineResolver<PluginTs>(() => ({
 *   name: 'default',
 *   resolveName(node) { return this.default(node.name, 'function') },
 * }))
 * ```
 */
export type UserResolver = Omit<Resolver, 'default' | 'resolveOptions' | 'resolvePath' | 'resolveFile' | 'resolveBanner' | 'resolveFooter'>

export type PluginFactoryOptions<
  /**
   * Name to be used for the plugin.
   */
  TName extends string = string,
  /**
   * Options of the plugin.
   */
  TOptions extends object = object,
  /**
   * Options of the plugin that can be used later on, see `options` inside your plugin config.
   */
  TResolvedOptions extends object = TOptions,
  /**
   * Context that you want to expose to other plugins.
   */
  TContext = unknown,
  /**
   * When calling `resolvePath` you can specify better types.
   */
  TResolvePathOptions extends object = object,
  /**
   * Resolver object that encapsulates the naming and path-resolution helpers used by this plugin.
   * Use `defineResolver` to define the resolver object and export it alongside the plugin.
   */
  TResolver extends Resolver = Resolver,
> = {
  name: TName
  options: TOptions
  resolvedOptions: TResolvedOptions
  context: TContext
  resolvePathOptions: TResolvePathOptions
  resolver: TResolver
}

export type UserPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Unique name used for the plugin
   * The name of the plugin follows the format scope:foo-bar or foo-bar, adding scope: can avoid naming conflicts with other plugins.
   * @example @kubb/typescript
   */
  name: TOptions['name']
  /**
   * Options set for a specific plugin(see kubb.config.js), passthrough of options.
   */
  options: TOptions['resolvedOptions'] & {
    output: Output
    include?: Array<Include>
    exclude: Array<Exclude>
    override: Array<Override<TOptions['resolvedOptions']>>
  }
  /**
   * The resolver for this plugin.
   * Composed by `getPreset` from the preset resolver and the user's `resolver` partial override.
   */
  resolver?: TOptions['resolver']
  /**
   * The composed transformer for this plugin.
   * Composed by `getPreset` from the preset's transformers and the user's `transformer` visitor.
   * When a visitor method returns `null`/`undefined`, the preset transformer's result is used instead.
   */
  transformer?: Visitor
  /**
   * Specifies the preceding plugins for the current plugin. You can pass an array of preceding plugin names, and the current plugin is executed after these plugins.
   * Can be used to validate dependent plugins.
   */
  pre?: Array<string>
  /**
   * Specifies the succeeding plugins for the current plugin. You can pass an array of succeeding plugin names, and the current plugin is executed before these plugins.
   */
  post?: Array<string>
  /**
   * When `apply` is defined, the plugin is only activated when `apply(config)` returns `true`.
   * Inspired by Vite's `apply` option.
   *
   * @example
   * ```ts
   * apply: (config) => config.output.path !== 'disabled'
   * ```
   */
  apply?: (config: Config) => boolean
  /**
   * Expose shared helpers or data to all other plugins via `PluginContext`.
   * The object returned is merged into the context that every plugin receives.
   * Use the `declare global { namespace Kubb { interface PluginContext { … } } }` pattern
   * to make the injected properties type-safe.
   *
   * @example
   * ```ts
   * inject() {
   *   return { getOas: () => parseSpec(this.config) }
   * }
   * // Other plugins can then call `this.getOas()` inside buildStart()
   * ```
   */
  inject?: (this: PluginContext<TOptions>) => TOptions['context']
}

export type UserPluginWithLifeCycle<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = UserPlugin<TOptions> & PluginLifecycle<TOptions>

type UnknownUserPlugin = UserPlugin<PluginFactoryOptions<string, object, object, unknown, object>>

/**
 * Handler for a single schema node. Used by the `schema` hook on a plugin.
 */
export type SchemaHook<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = (
  this: GeneratorContext<TOptions>,
  node: SchemaNode,
  options: TOptions['resolvedOptions'],
) => PossiblePromise<unknown | Array<FileNode> | void>

/**
 * Handler for a single operation node. Used by the `operation` hook on a plugin.
 */
export type OperationHook<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = (
  this: GeneratorContext<TOptions>,
  node: OperationNode,
  options: TOptions['resolvedOptions'],
) => PossiblePromise<unknown | Array<FileNode> | void>

/**
 * Handler for all collected operation nodes. Used by the `operations` hook on a plugin.
 */
export type OperationsHook<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = (
  this: GeneratorContext<TOptions>,
  nodes: Array<OperationNode>,
  options: TOptions['resolvedOptions'],
) => PossiblePromise<unknown | Array<FileNode> | void>

export type Plugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Unique name used for the plugin
   * @example @kubb/typescript
   */
  name: TOptions['name']
  /**
   * Specifies the preceding plugins for the current plugin. You can pass an array of preceding plugin names, and the current plugin is executed after these plugins.
   * Can be used to validate dependent plugins.
   */
  pre?: Array<string>
  /**
   * Specifies the succeeding plugins for the current plugin. You can pass an array of succeeding plugin names, and the current plugin is executed before these plugins.
   */
  post?: Array<string>
  /**
   * Options set for a specific plugin(see kubb.config.js), passthrough of options.
   */
  options: TOptions['resolvedOptions'] & {
    output: Output
    include?: Array<Include>
    exclude: Array<Exclude>
    override: Array<Override<TOptions['resolvedOptions']>>
  }
  /**
   * The resolver for this plugin.
   * Composed by `getPreset` from the preset resolver and the user's `resolver` partial override.
   */
  resolver: TOptions['resolver']
  /**
   * The composed transformer for this plugin. Accessible via `context.transformer`.
   * Composed by `getPreset` from the preset's transformers and the user's `transformer` visitor.
   * When a visitor method returns `null`/`undefined`, the preset transformer's result is used instead.
   */
  transformer?: Visitor

  /**
   * When `apply` is defined, the plugin is only activated when `apply(config)` returns `true`.
   * Inspired by Vite's `apply` option.
   */
  apply?: (config: Config) => boolean
  /**
   * Optional semver version string for this plugin, e.g. `"1.2.3"`.
   * Used in diagnostic messages and version-conflict detection.
   */
  version?: string

  buildStart: (this: PluginContext<TOptions>) => PossiblePromise<void>
  /**
   * Called once per plugin after all files have been written to disk.
   * Use this for post-processing, copying assets, or generating summary reports.
   */
  buildEnd: (this: PluginContext<TOptions>) => PossiblePromise<void>
  /**
   * Called for each schema node during the AST walk.
   * Return a React element, an array of `FileNode`, or `void` for manual handling.
   * Nodes matching `exclude`/`include` filters are skipped automatically.
   *
   * For multiple generators, use `composeGenerators` inside the plugin factory.
   */
  schema?: SchemaHook<TOptions>
  /**
   * Called for each operation node during the AST walk.
   * Return a React element, an array of `FileNode`, or `void` for manual handling.
   *
   * For multiple generators, use `composeGenerators` inside the plugin factory.
   */
  operation?: OperationHook<TOptions>
  /**
   * Called once after all operations have been walked, with the full collected set.
   *
   * For multiple generators, use `composeGenerators` inside the plugin factory.
   */
  operations?: OperationsHook<TOptions>
  /**
   * Expose shared helpers or data to all other plugins via `PluginContext`.
   * The returned object is merged into the context received by every plugin.
   */
  inject: (this: PluginContext<TOptions>) => TOptions['context']
}

export type PluginWithLifeCycle<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = Plugin<TOptions> & PluginLifecycle<TOptions>

export type PluginLifecycle<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Called once per plugin at the start of its processing phase, before schema/operation/operations hooks run.
   * Use this to set up shared state, fetch remote data, or perform any async initialization.
   * @type hookParallel
   */
  buildStart?: (this: PluginContext<TOptions>) => PossiblePromise<void>
  /**
   * Called once per plugin after all files have been written to disk.
   * Use this for post-processing, copying assets, or generating summary reports.
   * @type hookParallel
   */
  buildEnd?: (this: PluginContext<TOptions>) => PossiblePromise<void>
  /**
   * Called for each schema node during the AST walk.
   * Return a React element (`<File>...</File>`), an array of `FileNode` objects,
   * or `void` to handle file writing manually via `this.upsertFile`.
   * Nodes matching `exclude` / `include` filters are skipped automatically.
   *
   * For multiple generators, use `composeGenerators` inside the plugin factory.
   */
  schema?: SchemaHook<TOptions>
  /**
   * Called for each operation node during the AST walk.
   * Return a React element (`<File>...</File>`), an array of `FileNode` objects,
   * or `void` to handle file writing manually via `this.upsertFile`.
   *
   * For multiple generators, use `composeGenerators` inside the plugin factory.
   */
  operation?: OperationHook<TOptions>
  /**
   * Called once after all operation nodes have been walked, with the full collection.
   * Useful for generating index/barrel files per group or aggregate operation handlers.
   *
   * For multiple generators, use `composeGenerators` inside the plugin factory.
   */
  operations?: OperationsHook<TOptions>
  /**
   * Resolve to a Path based on a baseName(example: `./Pet.ts`) and directory(example: `./models`).
   * Options can als be included.
   * @type hookFirst
   * @example ('./Pet.ts', './src/gen/') => '/src/gen/Pet.ts'
   * @deprecated this will be replaced by resolvers
   */
  resolvePath?: (this: PluginContext<TOptions>, baseName: FileNode['baseName'], mode?: 'single' | 'split', options?: TOptions['resolvePathOptions']) => string
  /**
   * Resolve to a name based on a string.
   * Useful when converting to PascalCase or camelCase.
   * @type hookFirst
   * @example ('pet') => 'Pet'
   * @deprecated this will be replaced by resolvers
   */
  resolveName?: (this: PluginContext<TOptions>, name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
}

export type PluginLifecycleHooks = keyof PluginLifecycle

export type PluginParameter<H extends PluginLifecycleHooks> = Parameters<Required<PluginLifecycle>[H]>

export type ResolvePathParams<TOptions = object> = {
  pluginName?: string
  baseName: FileNode['baseName']
  mode?: 'single' | 'split'
  /**
   * Options to be passed to 'resolvePath' 3th parameter
   */
  options?: TOptions
}

export type ResolveNameParams = {
  name: string
  pluginName?: string
  /**
   * Specifies the type of entity being named.
   * - 'file' customizes the name of the created file (uses camelCase).
   * - 'function' customizes the exported function names (uses camelCase).
   * - 'type' customizes TypeScript types (uses PascalCase).
   * - 'const' customizes variable names (uses camelCase).
   * @default undefined
   */
  type?: 'file' | 'function' | 'type' | 'const'
}

export type PluginContext<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  config: Config
  /**
   * Absolute path to the output directory for the current plugin.
   * Shorthand for `path.resolve(config.root, config.output.path)`.
   */
  root: string
  /**
   * Returns the output mode for the given output config.
   * Returns `'single'` when `output.path` has a file extension, `'split'` otherwise.
   * Shorthand for `getMode(path.resolve(this.root, output.path))`.
   */
  getMode: (output: { path: string }) => 'single' | 'split'
  driver: PluginDriver
  /**
   * Get a plugin by name. Returns the plugin typed via `Kubb.PluginRegistry` when
   * the name is a registered key, otherwise returns the generic `Plugin`.
   */
  getPlugin<TName extends keyof Kubb.PluginRegistry>(name: TName): Plugin<Kubb.PluginRegistry[TName]> | undefined
  getPlugin(name: string): Plugin | undefined
  /**
   * Like `getPlugin` but throws a descriptive error when the plugin is not found.
   * Useful for enforcing dependencies inside `buildStart()`.
   */
  requirePlugin<TName extends keyof Kubb.PluginRegistry>(name: TName): Plugin<Kubb.PluginRegistry[TName]>
  requirePlugin(name: string): Plugin
  /**
   * Only add when the file does not exist yet
   */
  addFile: (...file: Array<FileNode>) => Promise<void>
  /**
   * merging multiple sources into the same output file
   */
  upsertFile: (...file: Array<FileNode>) => Promise<void>
  /**
   * @deprecated use this.warn, this.error, this.info instead
   */
  events: AsyncEventEmitter<KubbEvents>
  /**
   * Current plugin
   */
  plugin: Plugin<TOptions>
  /**
   * Resolver for the current plugin. Shorthand for `plugin.resolver`.
   */
  resolver: TOptions['resolver']
  /**
   * Composed transformer for the current plugin. Shorthand for `plugin.transformer`.
   * Apply with `transform(node, context.transformer)` to pre-process AST nodes before printing.
   */
  transformer: Visitor | undefined

  /**
   * Emit a warning via the build event system.
   * Shorthand for `this.events.emit('warn', message)`.
   */
  warn: (message: string) => void
  /**
   * Emit an error via the build event system.
   * Shorthand for `this.events.emit('error', error)`.
   */
  error: (error: string | Error) => void
  /**
   * Emit an info message via the build event system.
   * Shorthand for `this.events.emit('info', message)`.
   */
  info: (message: string) => void
  /**
   * Opens the Kubb Studio URL for the current `inputNode` in the default browser.
   * Falls back to printing the URL if the browser cannot be launched.
   * No-ops silently when no adapter has set an `inputNode`.
   */
  openInStudio: (options?: DevtoolsOptions) => Promise<void>
} & (
  | {
      /**
       * Returns the universal `@kubb/ast` `InputNode` produced by the configured adapter.
       * Returns `undefined` when no adapter was set (legacy OAS-only usage).
       */
      inputNode: InputNode
      /**
       * Return the adapter from `@kubb/ast`
       */
      adapter: Adapter
    }
  | {
      inputNode?: never
      adapter?: never
    }
) &
  Kubb.PluginContext

/**
 * Narrowed `PluginContext` used as the `this` type inside generator and plugin AST hook methods.
 *
 * Generators and the `schema`/`operation`/`operations` plugin hooks are only invoked from
 * `runPluginAstHooks`, which already guards against a missing adapter. This type reflects
 * that guarantee — `this.adapter` and `this.inputNode` are always defined, so no runtime
 * checks or casts are needed inside the method bodies.
 */
export type GeneratorContext<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = Omit<PluginContext<TOptions>, 'adapter' | 'inputNode'> & {
  adapter: Adapter
  inputNode: InputNode
}
/**
 * Specify the export location for the files and define the behavior of the output
 */
export type Output<_TOptions = unknown> = {
  /**
   * Path to the output folder or file that will contain the generated code
   */
  path: string
  /**
   * Define what needs to be exported, here you can also disable the export of barrel files
   * @default 'named'
   */
  barrelType?: BarrelType | false
  /**
   * Add a banner text in the beginning of every file
   */
  banner?: string | ((node?: InputNode) => string)
  /**
   * Add a footer text in the beginning of every file
   */
  footer?: string | ((node?: InputNode) => string)
  /**
   * Whether to override existing external files if they already exist.
   * @default false
   */
  override?: boolean
}

export type UserGroup = {
  /**
   * Defines the type where to group the files.
   * - 'tag' groups files by OpenAPI tags.
   * - 'path' groups files by OpenAPI paths.
   * @default undefined
   */
  type: 'tag' | 'path'
  /**
   * Return the name of a group based on the group name, this is used for the file and name generation.
   */
  name?: (context: { group: string }) => string
}

export type Group = {
  /**
   * Defines the type where to group the files.
   * - 'tag' groups files by OpenAPI tags.
   * - 'path' groups files by OpenAPI paths.
   * @default undefined
   */
  type: 'tag' | 'path'
  /**
   * Return the name of a group based on the group name, this is used for the file and name generation.
   */
  name: (context: { group: string }) => string
}

export type LoggerOptions = {
  /**
   * @default 3
   */
  logLevel: (typeof logLevel)[keyof typeof logLevel]
}

/**
 * Shared context passed to all plugins, parsers, and other internals.
 */
export type LoggerContext = AsyncEventEmitter<KubbEvents>

export type Logger<TOptions extends LoggerOptions = LoggerOptions> = {
  name: string
  install: (context: LoggerContext, options?: TOptions) => void | Promise<void>
}

export type UserLogger<TOptions extends LoggerOptions = LoggerOptions> = Logger<TOptions>

/**
 * Compatibility preset for code generation tools.
 * - `'default'` – no compatibility adjustments (default behavior).
 * - `'kubbV4'` – align generated names and structures with Kubb v4 output.
 */
export type CompatibilityPreset = 'default' | 'kubbV4'

export type { Storage } from './createStorage.ts'
export type { Generator } from './defineGenerator.ts'
export type { KubbEvents } from './Kubb.ts'

/**
 * A preset bundles a name, a resolver, optional AST transformers,
 * and optional generators into a single reusable configuration object.
 *
 * @template TResolver - The concrete resolver type for this preset.
 */
export type Preset<TResolver extends Resolver = Resolver> = {
  /**
   * Unique identifier for this preset.
   */
  name: string
  /**
   * The resolver used by this preset.
   */
  resolver: TResolver
  /**
   * Optional AST visitors / transformers applied after resolving.
   */
  transformers?: Array<Visitor>
  /**
   * Optional generators used by this preset. Plugin implementations cast this
   * to their concrete generator type.
   */
  generators?: Array<Generator<any>>
  /**
   * Optional printer factory used by this preset.
   * The generator calls this function at render-time to produce a configured printer instance.
   */
  printer?: (options: any) => Printer
}

/**
 * A named registry of presets, keyed by preset name.
 *
 * @template TResolver - The concrete resolver type shared by all presets in this registry.
 * @template TName - The union of valid preset name keys.
 */
export type Presets<TResolver extends Resolver = Resolver> = Record<CompatibilityPreset, Preset<TResolver>>

type ByTag = {
  type: 'tag'
  pattern: string | RegExp
}

type ByOperationId = {
  type: 'operationId'
  pattern: string | RegExp
}

type ByPath = {
  type: 'path'
  pattern: string | RegExp
}

type ByMethod = {
  type: 'method'
  pattern: HttpMethod | RegExp
}
// TODO implement as alternative for ByMethod
// type ByMethods = {
//   type: 'methods'
//   pattern: Array<HttpMethod>
// }

type BySchemaName = {
  type: 'schemaName'
  pattern: string | RegExp
}

type ByContentType = {
  type: 'contentType'
  pattern: string | RegExp
}

export type Exclude = ByTag | ByOperationId | ByPath | ByMethod | ByContentType | BySchemaName
export type Include = ByTag | ByOperationId | ByPath | ByMethod | ByContentType | BySchemaName

export type Override<TOptions> = (ByTag | ByOperationId | ByPath | ByMethod | BySchemaName | ByContentType) & {
  //TODO should be options: Omit<Partial<TOptions>, 'override'>
  options: Partial<TOptions>
}

export type ResolvePathOptions = {
  pluginName?: string
  group?: {
    tag?: string
    path?: string
  }
  type?: ResolveNameParams['type']
}

/**
 * File-specific parameters for `Resolver.resolvePath`.
 *
 * Pass alongside a `ResolverContext` to identify which file to resolve.
 * Provide `tag` for tag-based grouping or `path` for path-based grouping.
 *
 * @example
 * ```ts
 * resolver.resolvePath(
 *   { baseName: 'petTypes.ts', tag: 'pets' },
 *   { root: '/src', output: { path: 'types' }, group: { type: 'tag' } },
 * )
 * // → '/src/types/petsController/petTypes.ts'
 * ```
 */
export type ResolverPathParams = {
  baseName: FileNode['baseName']
  pathMode?: 'single' | 'split'
  /**
   * Tag value used when `group.type === 'tag'`.
   */
  tag?: string
  /**
   * Path value used when `group.type === 'path'`.
   */
  path?: string
}

/**
 * Shared context passed as the second argument to `Resolver.resolvePath` and `Resolver.resolveFile`.
 *
 * Describes where on disk output is rooted, which output config is active, and the optional
 * grouping strategy that controls subdirectory layout.
 *
 * @example
 * ```ts
 * const context: ResolverContext = {
 *   root: config.root,
 *   output,
 *   group,
 * }
 * ```
 */
export type ResolverContext = {
  root: string
  output: Output
  group?: Group
  /**
   * Plugin name used to populate `meta.pluginName` on the resolved file.
   */
  pluginName?: string
}

/**
 * File-specific parameters for `Resolver.resolveFile`.
 *
 * Pass alongside a `ResolverContext` to fully describe the file to resolve.
 * `tag` and `path` are used only when a matching `group` is present in the context.
 *
 * @example
 * ```ts
 * resolver.resolveFile(
 *   { name: 'listPets', extname: '.ts', tag: 'pets' },
 *   { root: '/src', output: { path: 'types' }, group: { type: 'tag' } },
 * )
 * // → { baseName: 'listPets.ts', path: '/src/types/petsController/listPets.ts', ... }
 * ```
 */
export type ResolverFileParams = {
  name: string
  extname: FileNode['extname']
  /**
   * Tag value used when `group.type === 'tag'`.
   */
  tag?: string
  /**
   * Path value used when `group.type === 'path'`.
   */
  path?: string
}

/**
 * Context passed to `Resolver.resolveBanner` and `Resolver.resolveFooter`.
 *
 * `output` is optional — not every plugin configures a banner/footer.
 * `config` carries the global Kubb config, used to derive the default Kubb banner.
 *
 * @example
 * ```ts
 * resolver.resolveBanner(inputNode, { output: { banner: '// generated' }, config })
 * // → '// generated'
 * ```
 */
export type ResolveBannerContext = {
  output?: Pick<Output, 'banner' | 'footer'>
  config: Config
}

export type { CLIOptions, ConfigInput } from './defineConfig.ts'
export type { Parser } from './defineParser.ts'
export type { FunctionParamsAST } from './utils/FunctionParams.ts'
export type { FileMetaBase } from './utils/getBarrelFiles.ts'
