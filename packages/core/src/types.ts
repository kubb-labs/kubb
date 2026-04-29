import type { AsyncEventEmitter, PossiblePromise } from '@internals/utils'
import type { FileNode, HttpMethod, ImportNode, InputNode, Node, SchemaNode, UserFileNode, Visitor } from '@kubb/ast'
import type { DEFAULT_STUDIO_URL, logLevel } from './constants.ts'
import type { RendererFactory } from './createRenderer.ts'
import type { Storage } from './createStorage.ts'
import type { Generator } from './defineGenerator.ts'
import type { Middleware } from './defineMiddleware.ts'
import type { Parser } from './defineParser.ts'
import type { Plugin } from './definePlugin.ts'
import type { KubbHooks } from './Kubb.ts'
import type { PluginDriver } from './PluginDriver.ts'

export type { Renderer, RendererFactory } from './createRenderer.ts'

/**
 * Safely extracts a type from a registry, returning `{}` if the key doesn't exist.
 * Enables optional interface augmentation for `Kubb.ConfigOptionsRegistry` and `Kubb.PluginOptionsRegistry`
 * without requiring changes to core.
 *
 * @internal
 */
type ExtractRegistryKey<T, K extends PropertyKey> = K extends keyof T ? T[K] : {}

export type InputPath = {
  /**
   * Path to your Swagger/OpenAPI file, absolute or relative to the config file location.
   */
  path: string
}

export type InputData = {
  /**
   * Swagger/OpenAPI data as a string or object.
   */
  data: string | unknown
}

type Input = InputPath | InputData

/**
 * Source data passed to an adapter's `parse` function.
 * Mirrors the config input shape with paths resolved to absolute.
 */
export type AdapterSource = { type: 'path'; path: string } | { type: 'data'; data: string | unknown } | { type: 'paths'; paths: Array<string> }

/**
 * Generic type parameters for an adapter definition.
 *
 * - `TName` — unique identifier (e.g. `'oas'`, `'asyncapi'`)
 * - `TOptions` — user-facing options passed to the adapter factory
 * - `TResolvedOptions` — options after defaults applied
 * - `TDocument` — type of the parsed source document
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
 * Adapter that converts input files or data into an `InputNode`.
 *
 * Adapters parse different schema formats (OpenAPI, AsyncAPI, Drizzle, etc.) into Kubb's
 * universal intermediate representation that all plugins consume.
 *
 * @example
 * ```ts
 * import { adapterOas } from '@kubb/adapter-oas'
 *
 * export default defineConfig({
 *   adapter: adapterOas(),
 *   input: { path: './openapi.yaml' },
 *   plugins: [pluginTs(), pluginZod()],
 * })
 * ```
 */
export type Adapter<TOptions extends AdapterFactoryOptions = AdapterFactoryOptions> = {
  /**
   * Human-readable adapter identifier (e.g. `'oas'`, `'asyncapi'`).
   */
  name: TOptions['name']
  /**
   * Resolved adapter options after defaults have been applied.
   */
  options: TOptions['resolvedOptions']
  /**
   * Parsed source document after the first `parse()` call. `null` before parsing.
   */
  document: TOptions['document'] | null
  inputNode: InputNode | null
  /**
   * Parse the source into a universal `InputNode`.
   */
  parse: (source: AdapterSource) => PossiblePromise<InputNode>
  /**
   * Extract `ImportNode` entries for a schema tree.
   * Returns an empty array before the first `parse()` call.
   *
   * The `resolve` callback receives the collision-corrected schema name and must
   * return `{ name, path }` for the import, or `undefined` to skip it.
   */
  getImports: (node: SchemaNode, resolve: (schemaName: string) => { name: string; path: string }) => Array<ImportNode>
}

export type DevtoolsOptions = {
  /**
   * Open the AST inspector in Kubb Studio (`/ast`). Defaults to the main Studio page.
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
   * Project root directory, absolute or relative to the config file.
   * @default process.cwd()
   */
  root: string
  /**
   * Parsers that convert generated files to strings.
   * Each parser handles specific extensions (e.g. `.ts`, `.tsx`).
   * A fallback parser is appended for unhandled extensions.
   * When omitted, defaults to `parserTs` from `@kubb/parser-ts`.
   *
   * @default [parserTs] from `@kubb/parser-ts`
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
   * Adapter that parses input files into the universal `InputNode` representation.
   * Use `@kubb/adapter-oas` for OpenAPI/Swagger or `@kubb/adapter-asyncapi` for other formats.
   *
   * @example
   * ```ts
   * import { adapterOas } from '@kubb/adapter-oas'
   * export default defineConfig({
   *   adapter: adapterOas(),
   *   input: { path: './petstore.yaml' },
   * })
   * ```
   */
  adapter: Adapter
  /**
   * Source file or data to generate code from.
   * Use `input.path` for a file path or `input.data` for inline data.
   */
  input: TInput
  output: {
    /**
     * Output directory for generated files, absolute or relative to `root`.
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
     * Code formatter to apply to generated files.
     * - `'auto'` — auto-detect oxfmt, biome, or prettier
     * - `false` — skip formatting
     * @default false
     */
    format?: 'auto' | 'prettier' | 'biome' | 'oxfmt' | false
    /**
     * Linter to analyze generated files.
     * - `'auto'` — auto-detect oxlint, biome, or eslint
     * - `false` — skip linting
     * @default false
     */
    lint?: 'auto' | 'eslint' | 'biome' | 'oxlint' | false
    /**
     * Override the file extension for generated imports and exports.
     * Each plugin applies its own extension by default.
     * @default { '.ts': '.ts' }
     */
    extension?: Record<FileNode['extname'], FileNode['extname'] | ''>
    /**
     * Banner text to prepend to every generated file.
     * - `'simple'` — banner with link to Kubb
     * - `'full'` — banner with source, title, description, and API version
     * - `false` — no banner
     * @default 'simple'
     */
    defaultBanner?: 'simple' | 'full' | false
    /**
     * Override existing external files if they already exist.
     * Plugins can override this with their own `output.override` option.
     * @default false
     */
    override?: boolean
  } & ExtractRegistryKey<Kubb.ConfigOptionsRegistry, 'output'>
  /**
   * Storage backend for generated files, defaults to `fsStorage()`.
   * Accepts any object implementing the {@link Storage} interface.
   * Keys are root-relative paths (e.g. `src/gen/api/getPets.ts`).
   *
   * @default fsStorage()
   * @example
   * ```ts
   * import { memoryStorage } from '@kubb/core'
   * storage: memoryStorage()
   * ```
   */
  storage?: Storage
  /**
   * Plugins used for code generation.
   * Each plugin may declare additional configurable options.
   * Dependencies are enforced — an error is thrown if a plugin's dependency is missing.
   */
  plugins: Array<Plugin>
  /**
   * Middleware instances that observe and post-process build output.
   * Middleware listeners fire after all plugin listeners for any given event.
   *
   * @example
   * ```ts
   * import { middlewareBarrel } from '@kubb/middleware-barrel'
   * export default defineConfig({
   *   middleware: [middlewareBarrel()],
   *   plugins: [pluginTs(), pluginZod()],
   * })
   * ```
   */
  middleware?: Array<Middleware>
  /**
   * Default renderer factory used by all plugins and generators.
   * Resolution chain: `generator.renderer` → `plugin.renderer` → `config.renderer` → `undefined` (raw FileNode[] mode).
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
   * Kubb Studio integration settings.
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
   * Lifecycle hooks triggered during build.
   */
  hooks?: {
    /**
     * Hook that fires after all builds complete.
     * Run Prettier, ESLint, or other tools to format/lint generated code.
     */
    done?: string | Array<string>
  }
}

// plugin

/**
 * Type/string pattern filter for include/exclude/override matching.
 */
type PatternFilter = {
  type: string
  pattern: string | RegExp
}

/**
 * Pattern filter with partial option overrides applied when the pattern matches.
 */
type PatternOverride<TOptions> = PatternFilter & {
  options: Omit<Partial<TOptions>, 'override'>
}

/**
 * Context for resolving filtered options for a given operation or schema node.
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
 * `default`, `resolveOptions`, `resolvePath`, `resolveFile`, `resolveBanner`, and `resolveFooter`
 * are injected automatically by `defineResolver` — extend this type to add custom resolution methods.
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
   * Unique plugin name.
   */
  TName extends string = string,
  /**
   * User-facing plugin options.
   */
  TOptions extends object = object,
  /**
   * Plugin options after defaults are applied.
   */
  TResolvedOptions extends object = TOptions,
  /**
   * Resolver that encapsulates naming and path-resolution helpers.
   * Define with `defineResolver` and export alongside the plugin.
   */
  TResolver extends Resolver = Resolver,
> = {
  name: TName
  options: TOptions
  resolvedOptions: TResolvedOptions
  resolver: TResolver
}

/**
 * Normalized plugin after setup, with runtime fields populated.
 * For internal use only — plugins use the public `Plugin` type externally.
 *
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
 * Partial `Config` for user-facing entry points with sensible defaults.
 * `root`, `plugins`, `parsers`, and `adapter` are optional.
 */
export type UserConfig<TInput = Input> = Omit<Config<TInput>, 'root' | 'plugins' | 'parsers' | 'adapter'> & {
  /**
   * Project root directory, absolute or relative to the config file.
   * @default process.cwd()
   */
  root?: string
  /**
   * Parsers that convert generated files to strings.
   * When omitted, `parserTs` from `@kubb/parser-ts` is used as default.
   */
  parsers?: Array<Parser>
  /**
   * Adapter that parses input into the universal `InputNode` representation.
   */
  adapter?: Adapter
  /**
   * Plugins used for code generation.
   */
  plugins?: Array<Plugin>
}

export type ResolveNameParams = {
  name: string
  pluginName?: string
  /**
   * Entity type being named.
   * - `'file'` — file name (camelCase)
   * - `'function'` — exported function name (camelCase)
   * - `'type'` — TypeScript type name (PascalCase)
   * - `'const'` — variable name (camelCase)
   */
  type?: 'file' | 'function' | 'type' | 'const'
}
/**
 * Context object passed to generator `schema`, `operation`, and `operations` methods.
 *
 * The adapter is always defined (guaranteed by `runPluginAstHooks`) so no runtime checks
 * are needed. `ctx.options` carries resolved per-node options after exclude/include/override
 * filtering for individual schema/operation calls, or plugin-level options for operations.
 */
export type GeneratorContext<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  config: Config
  /**
   * Absolute path to the current plugin's output directory.
   */
  root: string
  /**
   * Determine output mode based on the output config.
   * Returns `'single'` when `output.path` is a file, `'split'` for a directory.
   */
  getMode: (output: { path: string }) => 'single' | 'split'
  driver: PluginDriver
  /**
   * Get a plugin by name, typed via `Kubb.PluginRegistry` when registered.
   */
  getPlugin<TName extends keyof Kubb.PluginRegistry>(name: TName): Plugin<Kubb.PluginRegistry[TName]> | undefined
  getPlugin(name: string): Plugin | undefined
  /**
   * Get a plugin by name, throws an error if not found.
   */
  requirePlugin<TName extends keyof Kubb.PluginRegistry>(name: TName): Plugin<Kubb.PluginRegistry[TName]>
  requirePlugin(name: string): Plugin
  /**
   * Get a resolver by plugin name, typed via `Kubb.PluginRegistry` when registered.
   */
  getResolver<TName extends keyof Kubb.PluginRegistry>(name: TName): Kubb.PluginRegistry[TName]['resolver']
  getResolver(name: string): Resolver
  /**
   * Add files only if they don't exist.
   */
  addFile: (...file: Array<FileNode>) => Promise<void>
  /**
   * Merge sources into the same output file.
   */
  upsertFile: (...file: Array<FileNode>) => Promise<void>
  hooks: AsyncEventEmitter<KubbHooks>
  /**
   * The current plugin instance.
   */
  plugin: Plugin<TOptions>
  /**
   * The current plugin's resolver.
   */
  resolver: TOptions['resolver']
  /**
   * The current plugin's transformer.
   */
  transformer: Visitor | undefined
  /**
   * Emit a warning.
   */
  warn: (message: string) => void
  /**
   * Emit an error.
   */
  error: (error: string | Error) => void
  /**
   * Emit an info message.
   */
  info: (message: string) => void
  /**
   * Open the current input node in Kubb Studio.
   */
  openInStudio: (options?: DevtoolsOptions) => Promise<void>
  /**
   * The configured adapter instance.
   */
  adapter: Adapter
  /**
   * The universal `InputNode` produced by the adapter.
   */
  inputNode: InputNode
  /**
   * Resolved options after exclude/include/override filtering.
   */
  options: TOptions['resolvedOptions']
}
/**
 * Output configuration for generated files.
 */
export type Output<_TOptions = unknown> = {
  /**
   * Output folder or file path for generated code.
   */
  path: string
  /**
   * Text or function prepended to every generated file.
   * When a function, receives the current `InputNode` and returns a string.
   */
  banner?: string | ((node?: InputNode) => string)
  /**
   * Text or function appended to every generated file.
   * When a function, receives the current `InputNode` and returns a string.
   */
  footer?: string | ((node?: InputNode) => string)
  /**
   * Whether to override existing external files if they already exist.
   * @default false
   */
  override?: boolean
} & ExtractRegistryKey<Kubb.PluginOptionsRegistry, 'output'>

export type Group = {
  /**
   * How to group files into subdirectories.
   * - `'tag'` — group by OpenAPI tags
   * - `'path'` — group by OpenAPI paths
   */
  type: 'tag' | 'path'
  /**
   * Function that returns the subdirectory name for a group value.
   * Defaults to `${camelCase(group)}Controller` for tags, first path segment for paths.
   */
  name?: (context: { group: string }) => string
}

export type LoggerOptions = {
  /**
   * Log level for output verbosity.
   * @default 3
   */
  logLevel: (typeof logLevel)[keyof typeof logLevel]
}

/**
 * Shared context passed to plugins, parsers, and other internals.
 */
export type LoggerContext = AsyncEventEmitter<KubbHooks>

export type Logger<TOptions extends LoggerOptions = LoggerOptions> = {
  name: string
  install: (context: LoggerContext, options?: TOptions) => void | Promise<void>
}

export type UserLogger<TOptions extends LoggerOptions = LoggerOptions> = Logger<TOptions>

export type { Storage } from './createStorage.ts'
export type { Generator } from './defineGenerator.ts'
export type { Middleware } from './defineMiddleware.ts'
export type { Plugin } from './definePlugin.ts'
export type { Kubb, KubbHooks } from './Kubb.ts'

/**
 * Context for hook-style plugin `kubb:plugin:setup` handler.
 * Provides methods to register generators, configure resolvers, transformers, and renderers.
 */
export type KubbPluginSetupContext<TFactory extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Register a generator dynamically. Generators fire during the AST walk (schema/operation/operations)
   * just like generators declared statically on `createPlugin`.
   */
  addGenerator<TElement = unknown>(generator: Generator<TFactory, TElement>): void
  /**
   * Set or override the resolver for this plugin.
   * The resolver controls file naming and path resolution.
   */
  setResolver(resolver: Partial<TFactory['resolver']>): void
  /**
   * Set the AST transformer to pre-process nodes before they reach generators.
   */
  setTransformer(visitor: Visitor): void
  /**
   * Set the renderer factory to process JSX elements from generators.
   */
  setRenderer(renderer: RendererFactory): void
  /**
   * Set resolved options merged into the normalized plugin's `options`.
   * Call this in `kubb:plugin:setup` to provide options generators need.
   */
  setOptions(options: TFactory['resolvedOptions']): void
  /**
   * Inject a raw file into the build output, bypassing the generation pipeline.
   */
  injectFile(userFileNode: UserFileNode): void
  /**
   * Merge a partial config update into the current build configuration.
   */
  updateConfig(config: Partial<Config>): void
  /**
   * The resolved build configuration at setup time.
   */
  config: Config
  /**
   * The plugin's user-provided options.
   */
  options: TFactory['options']
}

/**
 * Context for hook-style plugin `kubb:build:start` handler.
 * Fires immediately before the plugin execution loop begins.
 */
export type KubbBuildStartContext = {
  config: Config
  adapter: Adapter
  inputNode: InputNode
  /**
   * Get a plugin by name, typed via `Kubb.PluginRegistry` when registered.
   */
  getPlugin<TName extends keyof Kubb.PluginRegistry>(name: TName): Plugin<Kubb.PluginRegistry[TName]> | undefined
  getPlugin(name: string): Plugin | undefined
  /**
   * Get all files currently in the file manager.
   * Call this lazily (e.g. in `kubb:plugin:end`) to see files added by prior plugins.
   */
  readonly files: ReadonlyArray<FileNode>
  /**
   * Upsert one or more files into the file manager.
   * Files with the same path are merged; new files are appended.
   * Safe to call at any point during the plugin lifecycle, including inside `kubb:plugin:end`.
   */
  upsertFile: (...files: Array<FileNode>) => void
}

/**
 * Context for `kubb:plugins:end` handlers.
 * Fires after plugins run and per-plugin barrels are written, before final write to disk.
 * Middleware that needs final files (e.g. root barrel) use this event.
 */
export type KubbPluginsEndContext = {
  config: Config
  /**
   * All files currently in the file manager (lazy snapshot).
   */
  readonly files: ReadonlyArray<FileNode>
  /**
   * Upsert files into the file manager.
   * Files added here are included in the write pass.
   */
  upsertFile: (...files: Array<FileNode>) => void
}

/**
 * Context for hook-style plugin `kubb:build:end` handler.
 * Fires after all files have been written to disk.
 */
export type KubbBuildEndContext = {
  files: Array<FileNode>
  config: Config
  outputDir: string
}

export type KubbLifecycleStartContext = {
  version: string
}

export type KubbConfigEndContext = {
  configs: Array<Config>
}

export type KubbGenerationStartContext = {
  config: Config
}

export type KubbGenerationEndContext = {
  config: Config
  files: Array<FileNode>
  sources: Map<string, string>
}

export type KubbGenerationSummaryContext = {
  config: Config
  failedPlugins: Set<{ plugin: Plugin; error: Error }>
  status: 'success' | 'failed'
  hrStart: [number, number]
  filesCreated: number
  pluginTimings?: Map<Plugin['name'], number>
}

export type KubbVersionNewContext = {
  currentVersion: string
  latestVersion: string
}

export type KubbInfoContext = {
  message: string
  info?: string
}

export type KubbErrorContext = {
  error: Error
  meta?: Record<string, unknown>
}

export type KubbSuccessContext = {
  message: string
  info?: string
}

export type KubbWarnContext = {
  message: string
  info?: string
}

export type KubbDebugContext = {
  date: Date
  logs: Array<string>
  fileName?: string
}

export type KubbFilesProcessingStartContext = {
  files: Array<FileNode>
}

export type KubbFileProcessingUpdateContext = {
  /**
   * Number of files processed.
   */
  processed: number
  /**
   * Total files to process.
   */
  total: number
  /**
   * Processing percentage (0–100).
   */
  percentage: number
  /**
   * Optional source identifier.
   */
  source?: string
  /**
   * The file being processed.
   */
  file: FileNode
  /**
   * The current build configuration.
   */
  config: Config
}

export type KubbFilesProcessingEndContext = {
  files: Array<FileNode>
}

export type KubbPluginStartContext = {
  plugin: NormalizedPlugin
}

export type KubbPluginEndContext = {
  plugin: NormalizedPlugin
  duration: number
  success: boolean
  error?: Error
  config: Config
  /**
   * Returns all files currently in the file manager (lazy snapshot).
   * Includes files added by plugins that have already run.
   */
  readonly files: ReadonlyArray<FileNode>
  /**
   * Upsert one or more files into the file manager.
   */
  upsertFile: (...files: Array<FileNode>) => void
}

export type KubbHookStartContext = {
  id?: string
  command: string
  args?: readonly string[]
}

export type KubbHookEndContext = {
  id?: string
  command: string
  args?: readonly string[]
  success: boolean
  error: Error | null
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
