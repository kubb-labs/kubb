import type { AsyncEventEmitter, PossiblePromise } from '@internals/utils'
import type { FileNode, HttpMethod, ImportNode, InputNode, Node, SchemaNode, Visitor } from '@kubb/ast'
import type { DEFAULT_STUDIO_URL, logLevel } from './constants.ts'
import type { RendererFactory } from './createRenderer.ts'
import type { Storage } from './createStorage.ts'
import type { Generator } from './defineGenerator.ts'
import type { Parser } from './defineParser.ts'
import type { Plugin } from './definePlugin.ts'
import type { KubbHooks } from './Kubb.ts'
import type { PluginDriver } from './PluginDriver.ts'

export type { Renderer, RendererFactory } from './createRenderer.ts'

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

/**
 * Controls how `index.ts` barrel files are generated.
 * - `'all'` — exports every generated symbol from every file.
 * - `'named'` — exports only explicitly named exports.
 * - `'propagate'` — propagates re-exports from nested barrel files upward.
 */
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
   * Source file or data to generate code from.
   * Use `input.path` for a file on disk or `input.data` for an inline string or object.
   */
  input: TInput
  output: {
    /**
     * Output directory for generated files.
     * Accepts an absolute path or a path relative to `root`.
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
   * An array of Kubb plugins used for code generation.
   * Each plugin may declare additional configurable options.
   * If a plugin depends on another, an error is thrown when the dependency is missing.
   * Use `dependencies` on the plugin to declare execution order.
   */
  plugins: Array<Plugin>
  /**
   * Project-wide renderer factory. All plugins and generators that do not declare their own
   * `renderer` ultimately fall back to this value.
   *
   * The resolution chain is: `generator.renderer` → `plugin.renderer` → `config.renderer` → `undefined` (raw `FileNode[]` mode).
   *
   * @example
   * ```ts
   * import { jsxRenderer } from '@kubb/renderer-jsx'
   * export default defineConfig({
   *   renderer: jsxRenderer,
   *   plugins: [pluginTs(), pluginZod()],
   * })
   * ```
   */
  renderer?: RendererFactory
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
/**
 * Resolves filtered options for a given operation or schema node.
 *
 * @internal
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
  default(name: string, type?: 'file' | 'function' | 'type' | 'const'): string
  resolveOptions<TOptions>(node: Node, context: ResolveOptionsContext<TOptions>): TOptions | null
  resolvePath(params: ResolverPathParams, context: ResolverContext): string
  resolveFile(params: ResolverFileParams, context: ResolverContext): FileNode
  resolveBanner(node: InputNode | null, context: ResolveBannerContext): string | undefined
  resolveFooter(node: InputNode | null, context: ResolveBannerContext): string | undefined
}

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

/**
 * Internal representation of a plugin after normalization.
 * Extends the user-facing `Plugin` with runtime fields populated during `kubb:plugin:setup`.
 * Not part of the public API — use `Plugin` for external-facing interactions.
 * @internal
 */
export type NormalizedPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = Plugin<TOptions> & {
  options: TOptions['resolvedOptions'] & {
    output: Output
    include?: Array<Include>
    exclude: Array<Exclude>
    override: Array<Override<TOptions['resolvedOptions']>>
  }
  resolver: TOptions['resolver']
  transformer?: Visitor
  renderer?: RendererFactory
  generators?: Array<Generator>
  apply?: (config: Config) => boolean
  version?: string
}

/**
 * Partial version of {@link Config} intended for user-facing config entry points.
 *
 * Fields that have sensible defaults (`root`, `plugins`, `parsers`, `adapter`) are optional.
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
   */
  parsers?: Array<Parser>
  /**
   * Adapter that converts the input file into a `@kubb/ast` `InputNode`.
   */
  adapter?: Adapter
  /**
   * An array of Kubb plugins used for code generation.
   * Each entry is a hook-style plugin created with `definePlugin`.
   */
  plugins?: Array<Plugin>
}

export type ResolveNameParams = {
  name: string
  pluginName?: string
  /**
   * Specifies the type of entity being named.
   * - `'file'` — customizes the name of the created file (camelCase).
   * - `'function'` — customizes the exported function names (camelCase).
   * - `'type'` — customizes TypeScript type names (PascalCase).
   * - `'const'` — customizes variable names (camelCase).
   */
  type?: 'file' | 'function' | 'type' | 'const'
}
/**
 * Context object passed as the second argument to generator `schema`, `operation`, and
 * `operations` methods.
 *
 * Generators are only invoked from `runPluginAstHooks`, which already guards against a
 * missing adapter. This type reflects that guarantee — `ctx.adapter` and `ctx.inputNode`
 * are always defined, so no runtime checks or casts are needed inside generator bodies.
 *
 * `ctx.options` carries the per-node resolved options for `schema`/`operation` calls
 * (after exclude/include/override filtering) and the plugin-level options for `operations`.
 */
export type GeneratorContext<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  config: Config
  /**
   * Absolute path to the output directory for the current plugin.
   * Shorthand for `path.resolve(config.root, config.output.path)`.
   */
  root: string
  /**
   * Returns the output mode for the given output config.
   * Returns `'single'` when `output.path` has a file extension, `'split'` otherwise.
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
   */
  requirePlugin<TName extends keyof Kubb.PluginRegistry>(name: TName): Plugin<Kubb.PluginRegistry[TName]>
  requirePlugin(name: string): Plugin
  /**
   * Get a resolver by plugin name. Returns the resolver typed via `Kubb.PluginRegistry` when
   * the name is a registered key, otherwise returns the generic `Resolver`.
   */
  getResolver<TName extends keyof Kubb.PluginRegistry>(name: TName): Kubb.PluginRegistry[TName]['resolver']
  getResolver(name: string): Resolver
  /**
   * Add files only when they do not exist yet.
   */
  addFile: (...file: Array<FileNode>) => Promise<void>
  /**
   * Merge multiple sources into the same output file.
   */
  upsertFile: (...file: Array<FileNode>) => Promise<void>
  hooks: AsyncEventEmitter<KubbHooks>
  /**
   * The current plugin.
   */
  plugin: Plugin<TOptions>
  /**
   * Resolver for the current plugin.
   */
  resolver: TOptions['resolver']
  /**
   * Composed transformer for the current plugin.
   */
  transformer: Visitor | undefined
  /**
   * Emit a warning via the build event system.
   */
  warn: (message: string) => void
  /**
   * Emit an error via the build event system.
   */
  error: (error: string | Error) => void
  /**
   * Emit an info message via the build event system.
   */
  info: (message: string) => void
  /**
   * Opens the Kubb Studio URL for the current `inputNode` in the default browser.
   */
  openInStudio: (options?: DevtoolsOptions) => Promise<void>
  /**
   * The adapter from `@kubb/ast`.
   */
  adapter: Adapter
  /**
   * The universal `@kubb/ast` `InputNode` produced by the configured adapter.
   */
  inputNode: InputNode
  /**
   * Per-node resolved options (after exclude/include/override filtering).
   */
  options: TOptions['resolvedOptions']
}
/**
 * Configure generated file output location and behavior.
 */
export type Output<_TOptions = unknown> = {
  /**
   * Path to the output folder or file that will contain generated code.
   */
  path: string
  /**
   * Define what needs to be exported, here you can also disable the export of barrel files
   * @default 'named'
   */
  barrelType?: BarrelType | false
  /**
   * Text or function appended at the start of every generated file.
   * When a function, receives the current `InputNode` and must return a string.
   */
  banner?: string | ((node?: InputNode) => string)
  /**
   * Text or function appended at the end of every generated file.
   * When a function, receives the current `InputNode` and must return a string.
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
   * Determines how files are grouped into subdirectories.
   * - `'tag'` groups files by OpenAPI tags.
   * - `'path'` groups files by OpenAPI paths.
   */
  type: 'tag' | 'path'
  /**
   * Returns the subdirectory name for a given group value.
   * Defaults to `${camelCase(group)}Controller` for tags and the first path segment for paths.
   */
  name?: (context: { group: string }) => string
}

export type Group = {
  /**
   * Determines how files are grouped into subdirectories.
   * - `'tag'` groups files by OpenAPI tags.
   * - `'path'` groups files by OpenAPI paths.
   */
  type: 'tag' | 'path'
  /**
   * Returns the subdirectory name for a given group value.
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
export type LoggerContext = AsyncEventEmitter<KubbHooks>

export type Logger<TOptions extends LoggerOptions = LoggerOptions> = {
  name: string
  install: (context: LoggerContext, options?: TOptions) => void | Promise<void>
}

export type UserLogger<TOptions extends LoggerOptions = LoggerOptions> = Logger<TOptions>

export type { Storage } from './createStorage.ts'
export type { Generator } from './defineGenerator.ts'
export type { Plugin } from './definePlugin.ts'
export type { Kubb, KubbHooks } from './Kubb.ts'

/**
 * Context passed to a hook-style plugin's `kubb:plugin:setup` handler.
 * Provides methods to register generators, configure the resolver, transformer,
 * and renderer, as well as access to the current build configuration.
 */
export type KubbPluginSetupContext<TFactory extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Register a generator on this plugin. Generators are invoked during the AST walk
   * (schema/operation/operations) exactly like generators declared statically on `createPlugin`.
   */
  addGenerator<TElement = unknown>(generator: Generator<TFactory, TElement>): void
  /**
   * Set or partially override the resolver for this plugin.
   * The resolver controls file naming and path resolution for generated files.
   *
   * When `TFactory` is a concrete `PluginFactoryOptions` (e.g. `PluginClient`),
   * the resolver parameter is typed to the plugin's own resolver type (e.g. `ResolverClient`).
   */
  setResolver(resolver: Partial<TFactory['resolver']>): void
  /**
   * Set the AST transformer (visitor) for this plugin.
   * The transformer pre-processes nodes before they reach the generators.
   */
  setTransformer(visitor: Visitor): void
  /**
   * Set the renderer factory for this plugin.
   * Used to process JSX elements returned by generators.
   */
  setRenderer(renderer: RendererFactory): void
  /**
   * Set the resolved options for the build loop. These options are merged into the
   * normalized plugin's `options` object (which includes `output`, `exclude`, `override`).
   *
   * Call this in `kubb:plugin:setup` to provide the resolved options that generators
   * and the build loop need (e.g., `enumType`, `optionalType`, `group`).
   */
  setOptions(options: TFactory['resolvedOptions']): void
  /**
   * Inject a raw file into the build output, bypassing the normal generation pipeline.
   */
  injectFile(file: Pick<FileNode, 'baseName' | 'path'> & { sources?: FileNode['sources'] }): void
  /**
   * Merge a partial config update into the current build configuration.
   */
  updateConfig(config: Partial<Config>): void
  /**
   * The resolved build configuration at the time of setup.
   */
  config: Config
  /**
   * The plugin's own options as passed by the user.
   */
  options: TFactory['options']
}

/**
 * Context passed to a hook-style plugin's `kubb:build:start` handler.
 * Fires immediately before the plugin execution loop begins.
 */
export type KubbBuildStartContext = {
  config: Config
  adapter: Adapter
  inputNode: InputNode
  /**
   * Get a plugin by name. Returns the plugin typed via `Kubb.PluginRegistry` when
   * the name is a registered key, otherwise returns the generic `Plugin`.
   */
  getPlugin<TName extends keyof Kubb.PluginRegistry>(name: TName): Plugin<Kubb.PluginRegistry[TName]> | undefined
  getPlugin(name: string): Plugin | undefined
}

/**
 * Context passed to a hook-style plugin's `kubb:build:end` handler.
 * Fires after all files have been written to disk.
 */
export type KubbBuildEndContext = {
  files: Array<FileNode>
  config: Config
  outputDir: string
}

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

/**
 * A pattern filter that prevents matching nodes from being generated.
 * Match by `tag`, `operationId`, `path`, `method`, `contentType`, or `schemaName`.
 */
export type Exclude = ByTag | ByOperationId | ByPath | ByMethod | ByContentType | BySchemaName

/**
 * A pattern filter that restricts generation to only matching nodes.
 * Match by `tag`, `operationId`, `path`, `method`, `contentType`, or `schemaName`.
 */
export type Include = ByTag | ByOperationId | ByPath | ByMethod | ByContentType | BySchemaName

/**
 * A pattern filter paired with partial option overrides applied when the pattern matches.
 * Match by `tag`, `operationId`, `path`, `method`, `schemaName`, or `contentType`.
 */
export type Override<TOptions> = (ByTag | ByOperationId | ByPath | ByMethod | BySchemaName | ByContentType) & {
  //TODO should be options: Omit<Partial<TOptions>, 'override'>
  options: Partial<TOptions>
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
  group?: UserGroup
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

/**
 * CLI options derived from command-line flags.
 */
export type CLIOptions = {
  /**
   * Path to `kubb.config.js`.
   */
  config?: string
  /**
   * Enable watch mode for input files.
   */
  watch?: boolean
  /**
   * Logging verbosity for CLI usage.
   * @default 'silent'
   */
  logLevel?: 'silent' | 'info' | 'debug'
}

/**
 * All accepted forms of a Kubb configuration.
 *
 * Config is always `@kubb/core` {@link Config}.
 * - `PossibleConfig` accepts `Config`/`Config[]`/promise or a no-arg config factory.
 * - `PossibleConfig<TCliOptions>` accepts the same config forms or a config factory receiving `TCliOptions`.
 */
export type PossibleConfig<TCliOptions = undefined> =
  | PossiblePromise<Config | Config[]>
  | ((...args: [TCliOptions] extends [undefined] ? [] : [TCliOptions]) => PossiblePromise<Config | Config[]>)

export type { BuildOutput } from './createKubb.ts'
export type { Parser } from './defineParser.ts'
export type { FileMetaBase } from './utils/getBarrelFiles.ts'
