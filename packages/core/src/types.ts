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

/**
 * Reference to an input file to generate code from.
 *
 * Specify an absolute path or a path relative to the config file location.
 * The adapter will parse this file (e.g., OpenAPI YAML or JSON) into the universal AST.
 */
export type InputPath = {
  /**
   * Path to your Swagger/OpenAPI file, absolute or relative to the config file location.
   *
   * @example
   * ```ts
   * { path: './petstore.yaml' }
   * { path: '/absolute/path/to/openapi.json' }
   * ```
   */
  path: string
}

/**
 * Inline input data to generate code from.
 *
 * Useful when you want to pass the specification directly instead of from a file.
 * Can be a string (YAML/JSON) or a parsed object.
 */
export type InputData = {
  /**
   * Swagger/OpenAPI data as a string (YAML/JSON) or a parsed object.
   *
   * @example
   * ```ts
   * { data: fs.readFileSync('./openapi.yaml', 'utf8') }
   * { data: { openapi: '3.1.0', info: { ... } } }
   * ```
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
 * Build configuration for Kubb code generation.
 *
 * The Config is the main entry point for customizing how Kubb generates code. It specifies:
 * - What to generate from (adapter + input)
 * - Where to output generated code (output)
 * - How to generate (plugins + middleware)
 * - Runtime details (parsers, storage, renderer)
 *
 * See `UserConfig` for a relaxed version with sensible defaults.
 *
 * @private
 */
export type Config<TInput = Input> = {
  /**
   * Display name for this configuration in CLI output and logs.
   * Useful when running multiple builds with `defineConfig` arrays.
   *
   * @example
   * ```ts
   * name: 'api-client'
   * ```
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
     *
     * All generated files will be written under this directory. Subdirectories can be created
     * by plugins based on grouping strategy (by tag, path, etc.).
     *
     * @example
     * ```ts
     * output: {
     *   path: './src/gen',  // generates ./src/gen/api.ts, ./src/gen/types.ts, etc.
     * }
     * ```
     */
    path: string
    /**
     * Remove all files from the output directory before starting the build.
     *
     * Useful to ensure old generated files aren't mixed with new ones.
     * Set to `true` for fresh builds, `false` to preserve manual edits in output dir.
     *
     * @default false
     * @example
     * ```ts
     * clean: true  // wipes ./src/gen/* before generating
     * ```
     */
    clean?: boolean
    /**
     * Persists generated files to the file system.
     *
     * @default true
     * @deprecated Use `storage` option to control where files are written instead.
     */
    write?: boolean
    /**
     * Auto-format generated files after code generation completes.
     *
     * Applies a code formatter to all generated files. Use `'auto'` to detect which formatter
     * is available on your system. Pass `false` to skip formatting (useful for CI or specific workflows).
     *
     * @default false
     * @example
     * ```ts
     * format: 'auto'        // auto-detect prettier, biome, or oxfmt
     * format: 'prettier'    // force prettier
     * format: false         // skip formatting
     * ```
     */
    format?: 'auto' | 'prettier' | 'biome' | 'oxfmt' | false
    /**
     * Auto-lint generated files after code generation completes.
     *
     * Analyzes all generated files for style/correctness issues. Use `'auto'` to detect which linter
     * is available on your system. Pass `false` to skip linting.
     *
     * @default false
     * @example
     * ```ts
     * lint: 'auto'      // auto-detect oxlint, biome, or eslint
     * lint: 'eslint'    // force eslint
     * lint: false       // skip linting
     * ```
     */
    lint?: 'auto' | 'eslint' | 'biome' | 'oxlint' | false
    /**
     * Map file extensions to different output extensions.
     *
     * Useful when you want generated `.ts` imports to reference `.js` files or vice versa (e.g., for ESM dual packages).
     * Keys are the original extension, values are the output extension. Use empty string `''` to omit extension.
     *
     * @default { '.ts': '.ts' }
     * @example
     * ```ts
     * extension: { '.ts': '.js' }      // generates import './api.js' instead of './api.ts'
     * extension: { '.ts': '', '.tsx': '.jsx' }
     * ```
     */
    extension?: Record<FileNode['extname'], FileNode['extname'] | ''>
    /**
     * Banner text prepended to every generated file.
     *
     * Useful for auto-generation notices or license headers. Choose a preset or write custom text.
     * Use `'simple'` for a basic Kubb banner, `'full'` for detailed metadata, or `false` to omit.
     *
     * @default 'simple'
     * @example
     * ```ts
     * defaultBanner: 'simple'   // "This file was autogenerated by Kubb"
     * defaultBanner: 'full'     // adds source, title, description, API version
     * defaultBanner: false      // no banner
     * ```
     */
    defaultBanner?: 'simple' | 'full' | false
    /**
     * When `true`, overwrites existing files. When `false`, skips generated files that already exist.
     *
     * Individual plugins can override this setting. This is useful for preventing accidental data loss
     * when re-generating while you have local edits in the output folder.
     *
     * @default false
     * @example
     * ```ts
     * override: true   // regenerate everything, even existing files
     * override: false  // skip files that already exist
     * ```
     */
    override?: boolean
  } & ExtractRegistryKey<Kubb.ConfigOptionsRegistry, 'output'>
  /**
   * Storage backend that controls where and how generated files are persisted.
   *
   * Defaults to `fsStorage()` which writes to the file system. Pass `memoryStorage()` to keep files in RAM,
   * or implement a custom `Storage` interface to write to cloud storage, databases, or other backends.
   *
   * @default fsStorage()
   * @example
   * ```ts
   * import { memoryStorage } from '@kubb/core'
   *
   * // Keep generated files in memory (useful for testing, CI pipelines)
   * storage: memoryStorage()
   *
   * // Use custom S3 storage
   * storage: myS3Storage()
   * ```
   *
   * @see {@link Storage} interface for implementing custom backends.
   */
  storage?: Storage
  /**
   * Plugins that execute during the build to generate code and transform the AST.
   *
   * Each plugin processes the AST produced by the adapter and can emit files for different
   * programming languages or formats (TypeScript, Zod schemas, Faker data, etc.).
   * Dependencies are enforced — an error is thrown if a plugin requires another plugin that isn't registered.
   *
   * Plugins can declare their own options via `PluginFactoryOptions`. See plugin documentation for details.
   *
   * @example
   * ```ts
   * import { pluginTs } from '@kubb/plugin-ts'
   * import { pluginZod } from '@kubb/plugin-zod'
   *
   * plugins: [
   *   pluginTs({ output: { path: './src/gen' } }),
   *   pluginZod({ output: { path: './src/gen' } }),
   * ]
   * ```
   */
  plugins: Array<Plugin>
  /**
   * Middleware instances that observe build events and post-process generated code.
   *
   * Middleware fires AFTER all plugins for each event. Perfect for tasks like:
   * - Auditing what was generated
   * - Adding barrel/index files
   * - Validating output
   * - Running custom transformations
   *
   * @example
   * ```ts
   * import { middlewareBarrel } from '@kubb/middleware-barrel'
   *
   * middleware: [middlewareBarrel()]
   * ```
   *
   * @see {@link defineMiddleware} to create custom middleware.
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
  /**
   * Renderer that converts generated AST nodes to code strings.
   *
   * By default, Kubb uses the JSX renderer (`rendererJsx`). Pass a custom renderer to support
   * different output formats (template engines, code generation DSLs, etc.).
   *
   * @default rendererJsx()  // from @kubb/renderer-jsx
   * @example
   * ```ts
   * import { rendererJsx } from '@kubb/renderer-jsx'
   * renderer: rendererJsx()
   * ```
   *
   * @see {@link Renderer} to implement a custom renderer.
   */
  renderer?: RendererFactory
  /**
   * Kubb Studio cloud integration settings.
   *
   * Kubb Studio (https://studio.kubb.dev) is a web-based IDE for managing API specs and generated code.
   * Set to `true` to enable with default settings, or pass an object to customize the Studio URL.
   *
   * @default false  // disabled by default
   * @example
   * ```ts
   * devtools: true                                   // use default Kubb Studio
   * devtools: { studioUrl: 'https://my-studio.dev' } // custom Studio instance
   * ```
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
   * Lifecycle hooks that execute during or after the build process.
   *
   * Hooks allow you to run external tools (prettier, eslint, custom scripts) based on build events.
   * Currently supports the `done` hook which fires after all plugins and middleware complete.
   *
   * @example
   * ```ts
   * hooks: {
   *   done: 'prettier --write "./src/gen"',      // auto-format generated files
   *   // or multiple commands:
   *   done: ['prettier --write "./src/gen"', 'eslint --fix "./src/gen"']
   * }
   * ```
   */
  hooks?: {
    /**
     * Command(s) to run after all plugins and middleware complete generation.
     *
     * Useful for post-processing: formatting, linting, copying files, or custom validation.
     * Pass a single command string or array of command strings to run sequentially.
     * Commands are executed relative to the `root` directory.
     *
     * @example
     * ```ts
     * done: 'prettier --write "./src/gen"'
     * done: ['prettier --write "./src/gen"', 'eslint --fix "./src/gen"']
     * ```
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
 *
 * `UserConfig` is what you pass to `defineConfig()`. It has optional `root`, `plugins`, `parsers`, and `adapter`
 * fields (which fall back to sensible defaults). All other Config options are available, including `output`, `input`,
 * `storage`, `middleware`, `renderer`, `devtools`, and `hooks`.
 *
 * @example
 * ```ts
 * export default defineConfig({
 *   input: { path: './petstore.yaml' },
 *   output: { path: './src/gen' },
 *   plugins: [pluginTs(), pluginZod()],
 * })
 * ```
 */
export type UserConfig<TInput = Input> = Omit<Config<TInput>, 'root' | 'plugins' | 'parsers' | 'adapter'> & {
  /**
   * Project root directory, absolute or relative to the config file location.
   *
   * Used as the base path for `root`-relative paths (e.g., `output.path`, file paths in hooks).
   *
   * @default process.cwd()
   * @example
   * ```ts
   * root: '/home/user/my-project'
   * root: './my-project'  // relative to config file
   * ```
   */
  root?: string
  /**
   * Custom parsers that convert generated AST nodes to strings (TypeScript, JSON, markdown, etc.).
   *
   * Each parser handles a specific file type. By default, Kubb uses `parserTs` from `@kubb/parser-ts` for TypeScript files.
   * Pass custom parsers to support additional languages or custom formats.
   *
   * @default [parserTs]  // from @kubb/parser-ts
   * @example
   * ```ts
   * import { parserTs } from '@kubb/parser-ts'
   * import { parserJsonSchema } from '@kubb/parser-json-schema'
   *
   * parsers: [parserTs(), parserJsonSchema()]
   * ```
   *
   * @see {@link Parser} to implement a custom parser.
   */
  parsers?: Array<Parser>
  /**
   * Adapter that parses your API specification (OpenAPI, GraphQL, AsyncAPI, etc.) into Kubb's universal AST.
   *
   * The adapter bridge between your input format and Kubb's internal representation. By default, uses the OAS adapter.
   * Pass an alternative adapter (or multiple configs with different adapters) to support different spec formats.
   *
   * @default new OasAdapter()  // from @kubb/adapter-oas
   * @example
   * ```ts
   * import { Oas } from '@kubb/adapter-oas'
   *
   * adapter: new Oas({ apiVersion: '3.0.0' })
   * ```
   *
   * @see {@link Adapter} to implement a custom adapter for GraphQL or other formats.
   */
  adapter?: Adapter
  /**
   * Plugins that execute during the build to generate code and transform the AST.
   *
   * Each plugin processes the AST produced by the adapter and can emit files for different
   * programming languages or formats (TypeScript, Zod schemas, Faker data, etc.).
   *
   * @default []  // no plugins (useful for setup/testing)
   * @example
   * ```ts
   * plugins: [
   *   pluginTs({ output: { path: './src/gen' } }),
   *   pluginZod({ output: { path: './src/gen' } }),
   * ]
   * ```
   *
   * @see {@link definePlugin} to create a custom plugin.
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
  /**
   * Filter by OpenAPI `tags` field. Matches one or more tags assigned to operations.
   */
  type: 'tag'
  /**
   * Tag name to match (case-sensitive). Can be a literal string or regex pattern.
   */
  pattern: string | RegExp
}

type ByOperationId = {
  /**
   * Filter by OpenAPI `operationId` field. Each operation (GET, POST, etc.) has a unique identifier.
   */
  type: 'operationId'
  /**
   * Operation ID to match (case-sensitive). Can be a literal string or regex pattern.
   */
  pattern: string | RegExp
}

type ByPath = {
  /**
   * Filter by OpenAPI `path` (URL endpoint). Useful to group or filter by service segments like `/pets`, `/users`, etc.
   */
  type: 'path'
  /**
   * URL path to match (case-sensitive). Can be a literal string or regex pattern. Matches against the full path.
   */
  pattern: string | RegExp
}

type ByMethod = {
  /**
   * Filter by HTTP method: `'get'`, `'post'`, `'put'`, `'delete'`, `'patch'`, `'head'`, `'options'`.
   */
  type: 'method'
  /**
   * HTTP method to match (case-insensitive when using string, or regex for dynamic matching).
   */
  pattern: HttpMethod | RegExp
}
// TODO implement as alternative for ByMethod
// type ByMethods = {
//   type: 'methods'
//   pattern: Array<HttpMethod>
// }

type BySchemaName = {
  /**
   * Filter by schema component name (TypeScript or JSON schema). Matches schemas in `#/components/schemas`.
   */
  type: 'schemaName'
  /**
   * Schema name to match (case-sensitive). Can be a literal string or regex pattern.
   */
  pattern: string | RegExp
}

type ByContentType = {
  /**
   * Filter by response or request content type: `'application/json'`, `'application/xml'`, etc.
   */
  type: 'contentType'
  /**
   * Content type to match (case-sensitive). Can be a literal string or regex pattern.
   */
  pattern: string | RegExp
}

/**
 * A pattern filter that prevents matching nodes from being generated.
 *
 * Use to skip code generation for specific operations or schemas. For example, exclude deprecated endpoints
 * or internal-only schemas. Can filter by tag, operationId, path, HTTP method, content type, or schema name.
 *
 * @example
 * ```ts
 * exclude: [
 *   { type: 'tag', pattern: 'internal' },          // skip "internal" tag
 *   { type: 'path', pattern: /^\/admin/ },          // skip all /admin endpoints
 *   { type: 'operationId', pattern: 'deprecated_*' }  // skip operationIds matching pattern
 * ]
 * ```
 */
export type Exclude = ByTag | ByOperationId | ByPath | ByMethod | ByContentType | BySchemaName

/**
 * A pattern filter that restricts generation to only matching nodes.
 *
 * Use to generate code for a subset of operations or schemas. For example, only generate for a specific service
 * tag or only for "production" endpoints. Can filter by tag, operationId, path, HTTP method, content type, or schema name.
 *
 * @example
 * ```ts
 * include: [
 *   { type: 'tag', pattern: 'public' },        // generate only "public" tag
 *   { type: 'path', pattern: /^\/api\/v1/ },   // generate only v1 endpoints
 * ]
 * ```
 */
export type Include = ByTag | ByOperationId | ByPath | ByMethod | ByContentType | BySchemaName

/**
 * A pattern filter paired with partial option overrides applied when the pattern matches.
 *
 * Use to customize generation for specific operations or schemas. For example, apply different output paths
 * for different tags, or use custom resolver functions per operation. Can filter by tag, operationId, path,
 * HTTP method, schema name, or content type.
 *
 * @example
 * ```ts
 * override: [
 *   {
 *     type: 'tag',
 *     pattern: 'admin',
 *     options: { output: { path: './src/gen/admin' } }  // admin APIs go to separate folder
 *   },
 *   {
 *     type: 'operationId',
 *     pattern: 'listPets',
 *     options: { exclude: true }  // skip this specific operation
 *   }
 * ]
 * ```
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
