import type { PossiblePromise } from '@internals/utils'
import type { FileNode, HttpMethod, InputNode, OperationNode, SchemaNode } from '@kubb/ast'
import type { DEFAULT_STUDIO_URL } from './constants.ts'
import type { Adapter } from './createAdapter.ts'
import type { RendererFactory } from './createRenderer.ts'
import type { Storage } from './createStorage.ts'
import type { GeneratorContext } from './defineGenerator.ts'
import type { Middleware } from './defineMiddleware.ts'
import type { Parser } from './defineParser.ts'
import type { KubbPluginEndContext, KubbPluginSetupContext, KubbPluginStartContext, Plugin } from './definePlugin.ts'

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
   * When omitted, Kubb runs in plugin-only mode: `kubb:plugin:setup` fires and files
   * injected via `injectFile` are written, but no AST walk occurs and generator hooks
   * (`kubb:generate:schema`, `kubb:generate:operation`) are never emitted.
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
  adapter?: Adapter
  /**
   * Source file or data to generate code from.
   * Use `input.path` for a file path or `input.data` for inline data.
   * Required when an adapter is configured; omit when running in plugin-only mode.
   */
  input?: TInput
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
  storage: Storage
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
   * Kubb Studio (https://kubb.studio) is a web-based IDE for managing API specs and generated code.
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
         * @default 'https://kubb.studio'
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
export type UserConfig<TInput = Input> = Omit<Config<TInput>, 'root' | 'plugins' | 'parsers' | 'adapter'| 'storage'> & {
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
   * @default [parserTs]  // from `@kubb/parser-ts`
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
   * Pass an adapter to support different spec formats. When omitted, Kubb runs in plugin-only mode —
   * `kubb:plugin:setup` fires and `injectFile` works, but no AST walk occurs and generator hooks
   * (`kubb:generate:schema`, `kubb:generate:operation`) are never emitted.
   *
   * @example
   * ```ts
   * import { adapterOas } from '@kubb/adapter-oas'
   *
   * adapter: adapterOas()
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

/**
 * Lifecycle events emitted during Kubb code generation.
 * Use these for logging, progress tracking, and custom integrations.
 *
 * @example
 * ```typescript
 * import type { AsyncEventEmitter } from '@internals/utils'
 * import type { KubbHooks } from '@kubb/core'
 *
 * const hooks: AsyncEventEmitter<KubbHooks> = new AsyncEventEmitter()
 *
 * hooks.on('kubb:lifecycle:start', () => {
 *   console.log('Starting Kubb generation')
 * })
 *
 * hooks.on('kubb:plugin:end', ({ plugin, duration }) => {
 *   console.log(`Plugin ${plugin.name} completed in ${duration}ms`)
 * })
 * ```
 */
export interface KubbHooks {
  /**
   * Fires at the start of the Kubb lifecycle, before code generation begins.
   */
  'kubb:lifecycle:start': [ctx: KubbLifecycleStartContext]
  /**
   * Fires at the end of the Kubb lifecycle, after all code generation completes.
   */
  'kubb:lifecycle:end': []

  /**
   * Fires when configuration loading starts.
   */
  'kubb:config:start': []
  /**
   * Fires when configuration loading completes.
   */
  'kubb:config:end': [ctx: KubbConfigEndContext]

  /**
   * Fires when code generation starts.
   */
  'kubb:generation:start': [ctx: KubbGenerationStartContext]
  /**
   * Fires when code generation completes.
   */
  'kubb:generation:end': [ctx: KubbGenerationEndContext]
  /**
   * Fires with a generation summary including summary lines, title, and success status.
   */
  'kubb:generation:summary': [ctx: KubbGenerationSummaryContext]

  /**
   * Fires when code formatting starts (e.g., Biome or Prettier).
   */
  'kubb:format:start': []
  /**
   * Fires when code formatting completes.
   */
  'kubb:format:end': []

  /**
   * Fires when linting starts.
   */
  'kubb:lint:start': []
  /**
   * Fires when linting completes.
   */
  'kubb:lint:end': []

  /**
   * Fires when plugin hooks execution starts.
   */
  'kubb:hooks:start': []
  /**
   * Fires when plugin hooks execution completes.
   */
  'kubb:hooks:end': []

  /**
   * Fires when a single hook executes (e.g., format or lint). The callback is invoked when the command finishes.
   */
  'kubb:hook:start': [ctx: KubbHookStartContext]
  /**
   * Fires when a single hook execution completes.
   */
  'kubb:hook:end': [ctx: KubbHookEndContext]

  /**
   * Fires when a new Kubb version is available.
   */
  'kubb:version:new': [ctx: KubbVersionNewContext]

  /**
   * Informational message event.
   */
  'kubb:info': [ctx: KubbInfoContext]
  /**
   * Error event, fired when an error occurs during generation.
   */
  'kubb:error': [ctx: KubbErrorContext]
  /**
   * Success message event.
   */
  'kubb:success': [ctx: KubbSuccessContext]
  /**
   * Warning message event.
   */
  'kubb:warn': [ctx: KubbWarnContext]
  /**
   * Debug event for detailed logging with timestamp and optional filename.
   */
  'kubb:debug': [ctx: KubbDebugContext]

  /**
   * Fires when file processing starts with the list of files to process.
   */
  'kubb:files:processing:start': [ctx: KubbFilesProcessingStartContext]
  /**
   * Fires for each file with progress updates: processed count, total, percentage, and file details.
   */
  'kubb:file:processing:update': [ctx: KubbFileProcessingUpdateContext]
  /**
   * Fires when file processing completes with the list of processed files.
   */
  'kubb:files:processing:end': [ctx: KubbFilesProcessingEndContext]

  /**
   * Fires when a plugin starts execution.
   */
  'kubb:plugin:start': [ctx: KubbPluginStartContext]
  /**
   * Fires when a plugin completes execution. Duration measured in milliseconds.
   */
  'kubb:plugin:end': [ctx: KubbPluginEndContext]

  /**
   * Fires once before plugins execute — allowing plugins to register generators, configure resolvers/transformers/renderers, or inject files.
   */
  'kubb:plugin:setup': [ctx: KubbPluginSetupContext]
  /**
   * Fires before the plugin execution loop begins. The adapter has already parsed the source and `inputNode` is available.
   */
  'kubb:build:start': [ctx: KubbBuildStartContext]
  /**
   * Fires after all plugins run and per-plugin barrels generate, but before files write to disk.
   * Use this to inject final files that must persist in the same write pass as plugin output.
   */
  'kubb:plugins:end': [ctx: KubbPluginsEndContext]
  /**
   * Fires after all files write to disk.
   */
  'kubb:build:end': [ctx: KubbBuildEndContext]

  /**
   * Fires for each schema node during AST traversal. Generator listeners respond to this.
   */
  'kubb:generate:schema': [node: SchemaNode, ctx: GeneratorContext]
  /**
   * Fires for each operation node during AST traversal. Generator listeners respond to this.
   */
  'kubb:generate:operation': [node: OperationNode, ctx: GeneratorContext]
  /**
   * Fires once after all operations traverse with the full collected array. Batch generator listeners respond to this.
   */
  'kubb:generate:operations': [nodes: Array<OperationNode>, ctx: GeneratorContext]
}

declare global {
  namespace Kubb {
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

    /**
     * Extension point for root `Config['output']` options.
     * Augment the `output` key in middleware or plugin packages to add extra fields
     * to the global output configuration without touching core types.
     *
     * @example
     * ```ts
     * // packages/middleware-barrel/src/types.ts
     * declare global {
     *   namespace Kubb {
     *     interface ConfigOptionsRegistry {
     *       output: {
     *         barrel?: import('./types.ts').BarrelConfig | false
     *       }
     *     }
     *   }
     * }
     * ```
     */
    interface ConfigOptionsRegistry {}

    /**
     * Extension point for per-plugin `Output` options.
     * Augment the `output` key in middleware or plugin packages to add extra fields
     * to the per-plugin output configuration without touching core types.
     *
     * @example
     * ```ts
     * // packages/middleware-barrel/src/types.ts
     * declare global {
     *   namespace Kubb {
     *     interface PluginOptionsRegistry {
     *       output: {
     *         barrel?: import('./types.ts').PluginBarrelConfig | false
     *       }
     *     }
     *   }
     * }
     * ```
     */
    interface PluginOptionsRegistry {}
  }
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

export type { Adapter, AdapterFactoryOptions, AdapterSource } from './createAdapter.ts'
export type { BuildOutput, Kubb } from './createKubb.ts'
export type { Renderer, RendererFactory } from './createRenderer.ts'
export type { Storage } from './createStorage.ts'
export type { Generator, GeneratorContext } from './defineGenerator.ts'
export type { Logger, LoggerContext, LoggerOptions, UserLogger } from './defineLogger.ts'
export type { Middleware } from './defineMiddleware.ts'
export type { Parser } from './defineParser.ts'
export type { KubbPluginEndContext, KubbPluginSetupContext, KubbPluginStartContext, NormalizedPlugin, Plugin, PluginFactoryOptions } from './definePlugin.ts'
export type { ResolveBannerContext, ResolveOptionsContext, Resolver, ResolverContext, ResolverFileParams, ResolverPathParams } from './defineResolver.ts'
