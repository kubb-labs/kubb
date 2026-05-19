import { resolve } from 'node:path'
import { version as nodeVersion } from 'node:process'
import type { PossiblePromise } from '@internals/utils'
import { AsyncEventEmitter, BuildError, exists, formatMs, getElapsedMs, URLPath } from '@internals/utils'
import type { FileNode, InputNode, InputStreamNode, OperationNode, SchemaNode } from '@kubb/ast'
import { collectUsedSchemaNames, transform, walk } from '@kubb/ast'
import { version as KubbVersion } from '../package.json'
import { DEFAULT_BANNER, DEFAULT_EXTENSION, DEFAULT_STUDIO_URL, STREAM_FLUSH_EVERY, STREAM_SCHEMA_THRESHOLD } from './constants.ts'
import type { Adapter, AdapterSource } from './createAdapter.ts'
import type { RendererFactory } from './createRenderer.ts'
import { createStorage, type Storage } from './createStorage.ts'
import type { GeneratorContext, Generator } from './defineGenerator.ts'
import type { Middleware } from './defineMiddleware.ts'
import type { Parser } from './defineParser.ts'
import type { KubbPluginEndContext, KubbPluginSetupContext, KubbPluginStartContext, NormalizedPlugin, Plugin } from './definePlugin.ts'
import { FileProcessor } from './FileProcessor.ts'

function isPromise<T>(value: unknown): value is Promise<T> {
  return value instanceof Promise
}
import { applyHookResult, PluginDriver } from './PluginDriver.ts'
import { fsStorage } from './storages/fsStorage.ts'

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
export type UserConfig<TInput = Input> = Omit<Config<TInput>, 'root' | 'plugins' | 'parsers' | 'adapter' | 'storage'> & {
  /**
   * Project root directory, absolute or relative to the config file location.
   * @default process.cwd()
   */
  root?: string
  /**
   * Custom parsers that convert generated AST nodes to strings (TypeScript, JSON, markdown, etc.).
   * @default [parserTs]  // from `@kubb/parser-ts`
   */
  parsers?: Array<Parser>
  /**
   * Adapter that parses your API specification into Kubb's universal AST.
   * When omitted, Kubb runs in plugin-only mode.
   */
  adapter?: Adapter
  /**
   * Plugins that execute during the build to generate code and transform the AST.
   * @default []
   */
  plugins?: Array<Plugin>
  /**
   * Storage backend that controls where and how generated files are persisted.
   * @default fsStorage()
   */
  storage?: Storage
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
  'kubb:lifecycle:start': [ctx: KubbLifecycleStartContext]
  'kubb:lifecycle:end': []
  'kubb:config:start': []
  'kubb:config:end': [ctx: KubbConfigEndContext]
  'kubb:generation:start': [ctx: KubbGenerationStartContext]
  'kubb:generation:end': [ctx: KubbGenerationEndContext]
  'kubb:generation:summary': [ctx: KubbGenerationSummaryContext]
  'kubb:format:start': []
  'kubb:format:end': []
  'kubb:lint:start': []
  'kubb:lint:end': []
  'kubb:hooks:start': []
  'kubb:hooks:end': []
  'kubb:hook:start': [ctx: KubbHookStartContext]
  'kubb:hook:end': [ctx: KubbHookEndContext]
  'kubb:version:new': [ctx: KubbVersionNewContext]
  'kubb:info': [ctx: KubbInfoContext]
  'kubb:error': [ctx: KubbErrorContext]
  'kubb:success': [ctx: KubbSuccessContext]
  'kubb:warn': [ctx: KubbWarnContext]
  'kubb:debug': [ctx: KubbDebugContext]
  'kubb:files:processing:start': [ctx: KubbFilesProcessingStartContext]
  'kubb:file:processing:update': [ctx: KubbFileProcessingUpdateContext]
  'kubb:files:processing:end': [ctx: KubbFilesProcessingEndContext]
  'kubb:plugin:start': [ctx: KubbPluginStartContext]
  'kubb:plugin:end': [ctx: KubbPluginEndContext]
  'kubb:plugin:setup': [ctx: KubbPluginSetupContext]
  'kubb:build:start': [ctx: KubbBuildStartContext]
  'kubb:plugins:end': [ctx: KubbPluginsEndContext]
  'kubb:build:end': [ctx: KubbBuildEndContext]
  'kubb:generate:schema': [node: SchemaNode, ctx: GeneratorContext]
  'kubb:generate:operation': [node: OperationNode, ctx: GeneratorContext]
  'kubb:generate:operations': [nodes: Array<OperationNode>, ctx: GeneratorContext]
}

export type KubbBuildStartContext = {
  config: Config
  adapter: Adapter
  inputNode: InputNode
  getPlugin<TName extends keyof Kubb.PluginRegistry>(name: TName): Plugin<Kubb.PluginRegistry[TName]> | undefined
  getPlugin(name: string): Plugin | undefined
  readonly files: ReadonlyArray<FileNode>
  upsertFile: (...files: Array<FileNode>) => void
}

export type KubbPluginsEndContext = {
  config: Config
  readonly files: ReadonlyArray<FileNode>
  upsertFile: (...files: Array<FileNode>) => void
}

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
  /**
   * Read-only view of the files Kubb wrote during this build.
   *
   * Keys are scoped to this run; files from earlier builds are not included.
   * Reads go directly to `config.storage`, so nothing is buffered in memory.
   *
   * @example Read a generated file
   * ```ts
   * const code = await storage.getItem('/src/gen/pet.ts')
   * ```
   *
   * @example Walk every generated file
   * ```ts
   * for (const path of await storage.getKeys()) {
   *   const code = await storage.getItem(path)
   * }
   * ```
   */
  storage: Storage
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
  processed: number
  total: number
  percentage: number
  source?: string
  file: FileNode
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

/**
 * CLI options derived from command-line flags.
 */
export type CLIOptions = {
  config?: string
  watch?: boolean
  /** @default 'silent' */
  logLevel?: 'silent' | 'info' | 'debug'
}

/**
 * All accepted forms of a Kubb configuration.
 * Accepts `Config`/`Config[]`/promise or a factory (optionally receiving `TCliOptions`.
 */
export type PossibleConfig<TCliOptions = undefined> =
  | PossiblePromise<Config | Config[]>
  | ((...args: [TCliOptions] extends [undefined] ? [] : [TCliOptions]) => PossiblePromise<Config | Config[]>)

type SetupOptions = {
  hooks?: AsyncEventEmitter<KubbHooks>
}

/**
 * Full output produced by a successful or failed build.
 */
export type BuildOutput = {
  /**
   * Plugins that threw during installation, paired with the caught error.
   */
  failedPlugins: Set<{ plugin: Plugin; error: Error }>
  files: Array<FileNode>
  driver: PluginDriver
  /**
   * Elapsed time in milliseconds for each plugin, keyed by plugin name.
   */
  pluginTimings: Map<string, number>
  error?: Error
  /**
   * Read-only view of every file written during this build.
   *
   * Keys are limited to this run. Reads go straight to `config.storage`,
   * so nothing extra is held in memory.
   *
   * @example Read a generated file
   * ```ts
   * const code = await buildOutput.storage.getItem('/src/gen/pet.ts')
   * ```
   *
   * @example List all generated file paths
   * ```ts
   * const paths = await buildOutput.storage.getKeys()
   * ```
   */
  storage: Storage
}

/**
 * Kubb code generation instance returned by {@link createKubb}.
 *
 * Use this when orchestrating multiple builds, inspecting plugin timings, or integrating Kubb into a larger toolchain.
 * For a single one-off build, chain directly: `await createKubb(config).build()`.
 */
export type Kubb = {
  /**
   * Shared event emitter for lifecycle and status events. Attach listeners before calling `setup()` or `build()`.
   */
  readonly hooks: AsyncEventEmitter<KubbHooks>
  /**
   * Read-only view of the files from the most recent `build()` or `safeBuild()` call.
   * Only populated after the build completes.
   *
   * Keys are scoped to the current run. Reads go straight to `config.storage`,
   * so nothing extra is held in memory.
   *
   * @example Read a generated file
   * ```ts
   * const { storage } = await kubb.safeBuild()
   * const code = await storage.getItem('/src/gen/pet.ts')
   * ```
   *
   * @example Walk every generated file
   * ```ts
   * for (const path of await kubb.storage.getKeys()) {
   *   const code = await kubb.storage.getItem(path)
   * }
   * ```
   */
  readonly storage: Storage
  /**
   * Plugin driver managing all plugins. Available after `setup()` completes.
   */
  readonly driver: PluginDriver
  /**
   * Resolved configuration with defaults applied. Available after `setup()` completes.
   */
  readonly config: Config
  /**
   * Resolves config and initializes the driver. `build()` calls this automatically.
   */
  setup(): Promise<void>
  /**
   * Runs the full pipeline and throws on any plugin error. Automatically calls `setup()` if needed.
   */
  build(): Promise<BuildOutput>
  /**
   * Runs the full pipeline and captures errors in `BuildOutput` instead of throwing. Automatically calls `setup()` if needed.
   */
  safeBuild(): Promise<BuildOutput>
}

type SetupResult = {
  hooks: AsyncEventEmitter<KubbHooks>
  driver: PluginDriver
  storage: Storage
  config: Config
  dispose: () => void
  [Symbol.dispose](): void
}

/**
 * Builds a `Storage` view scoped to the file paths produced by the current build.
 *
 * Reads delegate to the underlying `storage` (typically `fsStorage()`) so source bytes
 * stay where they were written instead of being held in an extra in-memory map.
 * Writing via `setItem` stores the content in the underlying storage and registers the
 * key so subsequent reads and `getKeys` are scoped to this build's output.
 */
function createSourcesView(storage: Storage): Storage {
  const paths = new Set<string>()
  return createStorage(() => ({
    name: `${storage.name}:sources`,
    async hasItem(key: string) {
      return paths.has(key) && (await storage.hasItem(key))
    },
    async getItem(key: string) {
      return paths.has(key) ? storage.getItem(key) : null
    },
    async setItem(key: string, value: string) {
      paths.add(key)
      await storage.setItem(key, value)
    },
    async removeItem(key: string) {
      paths.delete(key)
      await storage.removeItem(key)
    },
    async getKeys(base?: string) {
      if (!base) return [...paths]
      const result: Array<string> = []
      for (const key of paths) {
        if (key.startsWith(base)) result.push(key)
      }
      return result
    },
    async clear() {
      paths.clear()
      await storage.clear()
    },
  }))()
}

async function setup(userConfig: UserConfig, options: SetupOptions = {}): Promise<SetupResult> {
  const hooks = options.hooks ?? new AsyncEventEmitter<KubbHooks>()
  const config: Config = {
    ...userConfig,
    root: userConfig.root || process.cwd(),
    parsers: userConfig.parsers ?? [],
    adapter: userConfig.adapter,
    output: {
      format: false,
      lint: false,
      extension: DEFAULT_EXTENSION,
      defaultBanner: DEFAULT_BANNER,
      ...userConfig.output,
    },
    storage: userConfig.storage ?? fsStorage(),
    devtools: userConfig.devtools
      ? {
          studioUrl: DEFAULT_STUDIO_URL,
          ...(typeof userConfig.devtools === 'boolean' ? {} : userConfig.devtools),
        }
      : undefined,
    plugins: (userConfig.plugins ?? []) as unknown as Config['plugins'],
  }
  const driver = new PluginDriver(config, {
    hooks,
  })
  const storage: Storage = createSourcesView(config.storage)
  const diagnosticInfo = getDiagnosticInfo()

  await hooks.emit('kubb:debug', {
    date: new Date(),
    logs: [
      'Configuration:',
      `  • Name: ${userConfig.name || 'unnamed'}`,
      `  • Root: ${userConfig.root || process.cwd()}`,
      `  • Output: ${userConfig.output?.path || 'not specified'}`,
      `  • Plugins: ${userConfig.plugins?.length || 0}`,
      'Output Settings:',
      `  • Storage: ${config.storage.name}`,
      `  • Formatter: ${userConfig.output?.format || 'none'}`,
      `  • Linter: ${userConfig.output?.lint || 'none'}`,
      'Environment:',
      Object.entries(diagnosticInfo)
        .map(([key, value]) => `  • ${key}: ${value}`)
        .join('\n'),
    ],
  })

  try {
    if (isInputPath(userConfig) && !new URLPath(userConfig.input.path).isURL) {
      await exists(userConfig.input.path)

      await hooks.emit('kubb:debug', {
        date: new Date(),
        logs: [`✓ Input file validated: ${userConfig.input.path}`],
      })
    }
  } catch (caughtError) {
    if (isInputPath(userConfig)) {
      const error = caughtError as Error

      throw new Error(
        `Cannot read file/URL defined in \`input.path\` or set with \`kubb generate PATH\` in the CLI of your Kubb config ${userConfig.input.path}`,
        {
          cause: error,
        },
      )
    }
  }

  if (config.output.clean) {
    await hooks.emit('kubb:debug', {
      date: new Date(),
      logs: ['Cleaning output directories', `  • Output: ${config.output.path}`],
    })
    await config.storage.clear(resolve(config.root, config.output.path))
  }

  // Register middleware hooks after all plugin hooks are registered.
  // Because AsyncEventEmitter calls listeners in registration order,
  // middleware hooks for any event fire after all plugin hooks for that event.
  // Handlers are tracked so they can be removed after each build (disposeMiddleware),
  // preventing accumulation when multiple configs share the same hooks instance.
  const middlewareListeners: Array<[keyof KubbHooks & string, (...args: never[]) => void | Promise<void>]> = []

  function registerMiddlewareHook<K extends keyof KubbHooks & string>(event: K, middlewareHooks: Middleware['hooks']) {
    const handler = middlewareHooks[event]
    if (handler) {
      hooks.on(event, handler)
      middlewareListeners.push([event, handler as (...args: never[]) => void | Promise<void>])
    }
  }

  for (const middleware of config.middleware ?? []) {
    for (const event of Object.keys(middleware.hooks) as Array<keyof KubbHooks & string>) {
      registerMiddlewareHook(event, middleware.hooks)
    }
  }

  if (config.adapter) {
    const source = inputToAdapterSource(config)

    await hooks.emit('kubb:debug', {
      date: new Date(),
      logs: [`Running adapter: ${config.adapter.name}`],
    })

    driver.adapter = config.adapter

    if (config.adapter.count && config.adapter.stream) {
      const { schemas: schemaCount, operations: operationCount } = await config.adapter.count(source)

      if (schemaCount > STREAM_SCHEMA_THRESHOLD) {
        driver.inputStreamNode = await config.adapter.stream(source)

        await hooks.emit('kubb:debug', {
          date: new Date(),
          logs: [
            `✓ Adapter '${config.adapter.name}' streaming InputStreamNode`,
            `  • Schemas: ${schemaCount} (threshold: ${STREAM_SCHEMA_THRESHOLD})`,
            `  • Operations: ${operationCount}`,
          ],
        })
      } else {
        driver.inputNode = await config.adapter.parse(source)

        await hooks.emit('kubb:debug', {
          date: new Date(),
          logs: [
            `✓ Adapter '${config.adapter.name}' resolved InputNode`,
            `  • Schemas: ${driver.inputNode.schemas.length}`,
            `  • Operations: ${driver.inputNode.operations.length}`,
          ],
        })
      }
    } else {
      driver.inputNode = await config.adapter.parse(source)

      await hooks.emit('kubb:debug', {
        date: new Date(),
        logs: [
          `✓ Adapter '${config.adapter.name}' resolved InputNode`,
          `  • Schemas: ${driver.inputNode.schemas.length}`,
          `  • Operations: ${driver.inputNode.operations.length}`,
        ],
      })
    }
  }

  return {
    config,
    hooks,
    driver,
    storage,
    dispose,
    [Symbol.dispose]: dispose,
  }

  function dispose() {
    driver.dispose()
    for (const [event, handler] of middlewareListeners) {
      hooks.off(event, handler as never)
    }
  }
}

/**
 * Walks the AST and dispatches nodes to a plugin's direct AST hooks
 * (`schema`, `operation`, `operations`).
 *
 * When `include` contains only operation-scoped filters (`tag`, `operationId`, `path`,
 * `method`, `contentType`) and no `schemaName` filter, the function pre-computes the set
 * of top-level schema names transitively reachable from the included operations and skips
 * schemas that fall outside that set. This ensures that component schemas referenced
 * exclusively by excluded operations are not generated.
 */
type PluginStreamEntry = {
  plugin: NormalizedPlugin
  context: GeneratorContext
  hrStart: ReturnType<typeof process.hrtime>
}

/**
 * Single-pass fan-out for streaming mode.
 *
 * Iterates `inputStreamNode.schemas` and `.operations` exactly once, distributing each
 * node to every plugin in parallel. This replaces the N-pass-per-plugin pattern (where
 * each plugin got its own `for await` iterator) with a single parse pass fanned to all
 * plugins — eliminating the N×parse-time overhead for multi-plugin builds.
 *
 * Each plugin still gets independent `plugin:start` / `plugin:end` events and its own
 * timing, but the schema and operation nodes are parsed only once total.
 */
async function runPluginStreamHooks(
  inputStreamNode: InputStreamNode,
  entries: PluginStreamEntry[],
  driver: PluginDriver,
  hooks: AsyncEventEmitter<KubbHooks>,
  config: Config,
  pluginTimings: Map<string, number>,
  failedPlugins: Set<{ plugin: Plugin; error: Error }>,
  flushPendingFiles: () => Promise<void>,
): Promise<void> {
  type PluginState = {
    plugin: NormalizedPlugin
    generatorContext: GeneratorContext
    generators: Generator[]
    hrStart: ReturnType<typeof process.hrtime>
    failed: boolean
    error: Error | undefined
    /**
     * `true` when the plugin's options have no `include`, `exclude`, or `override`
     * filters. The per-node `resolveOptions` call always returns the same `options`
     * reference in that case, so the inner loop can skip it entirely.
     */
    optionsAreStatic: boolean
  }

  function resolveRendererFor(gen: Generator, state: PluginState): RendererFactory | undefined {
    return gen.renderer === null ? undefined : (gen.renderer ?? state.plugin.renderer ?? state.generatorContext.config.renderer)
  }

  const states: PluginState[] = entries.map(({ plugin, context, hrStart }) => {
    const { exclude, include, override } = plugin.options
    const hasExclude = Array.isArray(exclude) && exclude.length > 0
    const hasInclude = Array.isArray(include) && include.length > 0
    const hasOverride = Array.isArray(override) && override.length > 0
    return {
      plugin,
      generatorContext: { ...context, resolver: driver.getResolver(plugin.name) },
      generators: plugin.generators ?? [],
      hrStart,
      failed: false,
      error: undefined,
      optionsAreStatic: !hasExclude && !hasInclude && !hasOverride,
    }
  })

  async function dispatchSchema(state: PluginState, node: SchemaNode): Promise<void> {
    if (state.failed) return
    try {
      const { plugin, generatorContext, generators } = state
      const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node
      let options: typeof plugin.options | null
      if (state.optionsAreStatic) {
        options = plugin.options
      } else {
        const { exclude, include, override } = plugin.options
        options = generatorContext.resolver.resolveOptions(transformedNode, { options: plugin.options, exclude, include, override })
        if (options === null) return
      }

      const ctx = { ...generatorContext, options }
      for (const gen of generators) {
        if (!gen.schema) continue
        const raw = gen.schema(transformedNode, ctx)
        const result = isPromise(raw) ? await raw : raw
        const applied = applyHookResult(result, driver, resolveRendererFor(gen, state))
        if (isPromise(applied)) await applied
      }
      const emit = driver.hooks.emit('kubb:generate:schema', transformedNode, ctx)
      if (emit) await emit
    } catch (caughtError) {
      state.failed = true
      state.error = caughtError as Error
    }
  }

  async function dispatchOperation(state: PluginState, node: OperationNode): Promise<void> {
    if (state.failed) return
    try {
      const { plugin, generatorContext, generators } = state
      const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node
      let options: typeof plugin.options | null
      if (state.optionsAreStatic) {
        options = plugin.options
      } else {
        const { exclude, include, override } = plugin.options
        options = generatorContext.resolver.resolveOptions(transformedNode, { options: plugin.options, exclude, include, override })
        if (options === null) return
      }

      const ctx = { ...generatorContext, options }
      for (const gen of generators) {
        if (!gen.operation) continue
        const raw = gen.operation(transformedNode, ctx)
        const result = isPromise(raw) ? await raw : raw
        const applied = applyHookResult(result, driver, resolveRendererFor(gen, state))
        if (isPromise(applied)) await applied
      }
      const emit = driver.hooks.emit('kubb:generate:operation', transformedNode, ctx)
      if (emit) await emit
    } catch (caughtError) {
      state.failed = true
      state.error = caughtError as Error
    }
  }

  let schemasProcessed = 0
  for await (const node of inputStreamNode.schemas) {
    // Plugins are dispatched concurrently; per-plugin work (the inner generator
    // loop) stays sequential so `FileManager.upsert` ordering for any single
    // plugin chain remains deterministic.
    await Promise.all(states.map((state) => dispatchSchema(state, node)))
    schemasProcessed++
    if (schemasProcessed % STREAM_FLUSH_EVERY === 0) {
      await flushPendingFiles()
    }
  }

  const collectedOperations: OperationNode[] = []
  for await (const node of inputStreamNode.operations) {
    collectedOperations.push(node)
    await Promise.all(states.map((state) => dispatchOperation(state, node)))
  }

  // After stream: gen.operations for each plugin, then emit plugin:end
  for (const state of states) {
    if (!state.failed) {
      try {
        const { plugin, generatorContext, generators } = state
        const ctx = { ...generatorContext, options: plugin.options }
        for (const gen of generators) {
          if (!gen.operations) continue
          const result = await gen.operations(collectedOperations, ctx)
          await applyHookResult(result, driver, resolveRendererFor(gen, state))
        }
        await driver.hooks.emit('kubb:generate:operations', collectedOperations, ctx)
      } catch (caughtError) {
        state.failed = true
        state.error = caughtError as Error
      }
    }

    const duration = getElapsedMs(state.hrStart)
    pluginTimings.set(state.plugin.name, duration)

    await hooks.emit('kubb:plugin:end', {
      plugin: state.plugin,
      duration,
      success: !state.failed,
      ...(state.failed && state.error ? { error: state.error } : {}),
      config,
      get files() {
        return driver.fileManager.files
      },
      upsertFile: (...files) => driver.fileManager.upsert(...files),
    })

    if (state.failed && state.error) {
      failedPlugins.add({ plugin: state.plugin, error: state.error })
    }

    await hooks.emit('kubb:debug', {
      date: new Date(),
      logs: [state.failed ? '✗ Plugin start failed' : `✓ Plugin started successfully (${formatMs(duration)})`],
    })
  }

  await flushPendingFiles()
}

async function runPluginAstHooks(plugin: NormalizedPlugin, context: GeneratorContext): Promise<void> {
  const { adapter, inputNode, resolver, driver } = context
  const { exclude, include, override } = plugin.options

  if (!adapter || !inputNode) {
    throw new Error(`[${plugin.name}] No adapter found. Add an OAS adapter (e.g. adapterOas()) before this plugin in your Kubb config.`)
  }

  function resolveRenderer(gen: Generator): RendererFactory | undefined {
    return gen.renderer === null ? undefined : (gen.renderer ?? plugin.renderer ?? context.config.renderer)
  }

  const generators = plugin.generators ?? []
  const collectedOperations: Array<OperationNode> = []

  const generatorContext = {
    ...context,
    resolver: driver.getResolver(plugin.name),
  }

  // ── BATCH PATH ────────────────────────────────────────────────────────────
  // When `include` has operation-based filters (tag, operationId, path, method, contentType)
  // but no schema-level filters (schemaName), pre-compute the set of top-level schema names
  // that are transitively referenced by the included operations. Schemas outside that set are
  // skipped so that types belonging exclusively to excluded operations are not generated.
  const operationFilterTypes = new Set(['tag', 'operationId', 'path', 'method', 'contentType'])
  const hasOperationBasedIncludes = include?.some(({ type }) => operationFilterTypes.has(type)) ?? false
  const hasSchemaNameIncludes = include?.some(({ type }) => type === 'schemaName') ?? false

  let allowedSchemaNames: Set<string> | undefined
  if (hasOperationBasedIncludes && !hasSchemaNameIncludes) {
    const includedOps = inputNode!.operations.filter((op) => resolver.resolveOptions(op, { options: plugin.options, exclude, include, override }) !== null)
    allowedSchemaNames = collectUsedSchemaNames(includedOps, inputNode!.schemas)
  }

  await walk(inputNode!, {
    depth: 'shallow',
    async schema(node) {
      const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node

      // Skip named top-level schemas that are not reachable from any included operation.
      if (allowedSchemaNames !== undefined && transformedNode.name && !allowedSchemaNames.has(transformedNode.name)) {
        return
      }

      const options = resolver.resolveOptions(transformedNode, {
        options: plugin.options,
        exclude,
        include,
        override,
      })
      if (options === null) return

      const ctx = { ...generatorContext, options }

      await Promise.all(
        generators
          .filter((gen) => gen.schema)
          .map(async (gen) => {
            const result = await gen.schema!(transformedNode, ctx)
            return applyHookResult(result, driver, resolveRenderer(gen))
          }),
      )

      await driver.hooks.emit('kubb:generate:schema', transformedNode, ctx)
    },
    async operation(node) {
      const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node
      const options = resolver.resolveOptions(transformedNode, {
        options: plugin.options,
        exclude,
        include,
        override,
      })
      if (options !== null) {
        collectedOperations.push(transformedNode)

        const ctx = { ...generatorContext, options }

        await Promise.all(
          generators
            .filter((gen) => gen.operation)
            .map(async (gen) => {
              const result = await gen.operation!(transformedNode, ctx)
              return applyHookResult(result, driver, resolveRenderer(gen))
            }),
        )

        await driver.hooks.emit('kubb:generate:operation', transformedNode, ctx)
      }
    },
  })

  if (collectedOperations.length > 0) {
    const ctx = { ...generatorContext, options: plugin.options }

    for (const gen of generators) {
      if (!gen.operations) continue
      const result = await gen.operations(collectedOperations, ctx)
      await applyHookResult(result, driver, resolveRenderer(gen))
    }

    await driver.hooks.emit('kubb:generate:operations', collectedOperations, ctx)
  }
}

async function safeBuild(setupResult: SetupResult): Promise<BuildOutput> {
  using _cleanup = setupResult
  const { driver, hooks, storage } = setupResult

  const failedPlugins = new Set<{ plugin: Plugin; error: Error }>()
  const pluginTimings = new Map<string, number>()
  const config = driver.config
  const writtenPaths = new Set<string>()
  const parsersMap = new Map<FileNode['extname'], Parser>()
  for (const parser of config.parsers) {
    if (parser.extNames) {
      for (const extname of parser.extNames) {
        parsersMap.set(extname, parser)
      }
    }
  }
  const fileProcessor = new FileProcessor()

  async function flushPendingFiles(snapshot?: ReadonlySet<string>): Promise<void> {
    const files = driver.fileManager.files.filter((f) => !writtenPaths.has(f.path) && (!snapshot || !snapshot.has(f.path)))
    if (files.length === 0) {
      return
    }

    await hooks.emit('kubb:debug', {
      date: new Date(),
      logs: [`Writing ${files.length} files...`],
    })

    await hooks.emit('kubb:files:processing:start', { files })

    const stream = fileProcessor.stream(files, { parsers: parsersMap, extension: config.output.extension })

    for await (const { file, source, processed, total, percentage } of stream) {
      await hooks.emit('kubb:file:processing:update', { file, source, processed, total, percentage, config })
      if (source) {
        await storage.setItem(file.path, source)
      }
      writtenPaths.add(file.path)
    }

    await hooks.emit('kubb:files:processing:end', { files })
    await hooks.emit('kubb:debug', {
      date: new Date(),
      logs: [`✓ File write process completed for ${files.length} files`],
    })
  }

  try {
    await driver.emitSetupHooks()

    if (driver.adapter && (driver.inputNode || driver.inputStreamNode)) {
      await hooks.emit('kubb:build:start', {
        config,
        adapter: driver.adapter,
        inputNode: driver.inputNode ?? { kind: 'Input' as const, schemas: [], operations: [], meta: driver.inputStreamNode?.meta },
        getPlugin: driver.getPlugin.bind(driver),
        get files() {
          return driver.fileManager.files
        },
        upsertFile: (...files) => driver.fileManager.upsert(...files),
      })
    }

    const inputStreamNode = driver.inputStreamNode
    if (inputStreamNode) {
      // ── STREAMING: fan-out single-pass ────────────────────────────────────
      // Emit plugin:start for all plugins up front, collect generator-plugins
      // for the fan-out pass, then handle non-generator plugins immediately.
      const streamPluginEntries: PluginStreamEntry[] = []

      for (const plugin of driver.plugins.values()) {
        const context = driver.getContext(plugin)
        const hrStart = process.hrtime()

        await hooks.emit('kubb:plugin:start', { plugin })
        await hooks.emit('kubb:debug', {
          date: new Date(),
          logs: ['Starting plugin...', `  • Plugin Name: ${plugin.name}`],
        })

        if (plugin.generators?.length || driver.hasRegisteredGenerators(plugin.name)) {
          streamPluginEntries.push({ plugin, context, hrStart })
        } else {
          // No generators: plugin ran via setup hooks; finish it now.
          const duration = getElapsedMs(hrStart)
          pluginTimings.set(plugin.name, duration)
          await hooks.emit('kubb:plugin:end', {
            plugin,
            duration,
            success: true,
            config,
            get files() {
              return driver.fileManager.files
            },
            upsertFile: (...files) => driver.fileManager.upsert(...files),
          })
          await hooks.emit('kubb:debug', {
            date: new Date(),
            logs: [`✓ Plugin started successfully (${formatMs(duration)})`],
          })
        }
      }

      if (streamPluginEntries.length > 0) {
        await runPluginStreamHooks(inputStreamNode, streamPluginEntries, driver, hooks, config, pluginTimings, failedPlugins, flushPendingFiles)
      }
    } else {
      // ── BATCH: existing per-plugin sequential loop ────────────────────────
      for (const plugin of driver.plugins.values()) {
        const context = driver.getContext(plugin)
        const hrStart = process.hrtime()

        try {
          const timestamp = new Date()

          await hooks.emit('kubb:plugin:start', { plugin })
          await hooks.emit('kubb:debug', {
            date: timestamp,
            logs: ['Starting plugin...', `  • Plugin Name: ${plugin.name}`],
          })

          if (plugin.generators?.length || driver.hasRegisteredGenerators(plugin.name)) {
            await runPluginAstHooks(plugin, context)
          }

          const duration = getElapsedMs(hrStart)
          pluginTimings.set(plugin.name, duration)

          await hooks.emit('kubb:plugin:end', {
            plugin,
            duration,
            success: true,
            config,
            get files() {
              return driver.fileManager.files
            },
            upsertFile: (...files) => driver.fileManager.upsert(...files),
          })

          await hooks.emit('kubb:debug', {
            date: new Date(),
            logs: [`✓ Plugin started successfully (${formatMs(duration)})`],
          })
        } catch (caughtError) {
          const error = caughtError as Error
          const errorTimestamp = new Date()
          const duration = getElapsedMs(hrStart)

          await hooks.emit('kubb:plugin:end', {
            plugin,
            duration,
            success: false,
            error,
            config,
            get files() {
              return driver.fileManager.files
            },
            upsertFile: (...files) => driver.fileManager.upsert(...files),
          })

          await hooks.emit('kubb:debug', {
            date: errorTimestamp,
            logs: [
              '✗ Plugin start failed',
              `  • Plugin Name: ${plugin.name}`,
              `  • Error: ${error.constructor.name} - ${error.message}`,
              '  • Stack Trace:',
              error.stack || 'No stack trace available',
            ],
          })

          failedPlugins.add({ plugin, error })
        }
        await flushPendingFiles()
      }
    }

    await hooks.emit('kubb:plugins:end', {
      config,
      get files() {
        return driver.fileManager.files
      },
      upsertFile: (...files) => driver.fileManager.upsert(...files),
    })

    await flushPendingFiles()

    const files = driver.fileManager.files

    await hooks.emit('kubb:build:end', {
      files,
      config,
      outputDir: resolve(config.root, config.output.path),
    })

    return {
      failedPlugins,
      files,
      driver,
      pluginTimings,
      storage,
    }
  } catch (error) {
    return {
      failedPlugins,
      files: [],
      driver,
      pluginTimings,
      error: error as Error,
      storage,
    }
  }
}

async function build(setupResult: SetupResult): Promise<BuildOutput> {
  const { files, driver, failedPlugins, pluginTimings, error, storage } = await safeBuild(setupResult)

  if (error) {
    throw error
  }

  if (failedPlugins.size > 0) {
    const errors = [...failedPlugins].map(({ error }) => error)

    throw new BuildError(`Build Error with ${failedPlugins.size} failed plugins`, { errors })
  }

  return {
    failedPlugins,
    files,
    driver,
    pluginTimings,
    error: undefined,
    storage,
  }
}

/**
 * Returns a snapshot of the current runtime environment.
 *
 * Useful for attaching context to debug logs and error reports so that
 * issues can be reproduced without manual information gathering.
 */
export function getDiagnosticInfo() {
  return {
    nodeVersion,
    KubbVersion,
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd(),
  } as const
}

/**
 * Type guard to check if a given config has an `input.path`.
 */
export function isInputPath(config: UserConfig | undefined): config is UserConfig<InputPath> & { input: InputPath }
export function isInputPath(config: Config | undefined): config is Config<InputPath> & { input: InputPath }
export function isInputPath(config: Config | UserConfig | undefined): config is (Config<InputPath> | UserConfig<InputPath>) & { input: InputPath } {
  return typeof config?.input === 'object' && config.input !== null && 'path' in config.input
}

function inputToAdapterSource(config: Config): AdapterSource {
  const input = config.input
  if (!input) {
    throw new Error('[kubb] input is required when using an adapter. Provide input.path or input.data in your config.')
  }

  if ('data' in input) {
    return { type: 'data', data: input.data }
  }

  if (new URLPath(input.path).isURL) {
    return { type: 'path', path: input.path }
  }

  const resolved = resolve(config.root, input.path)

  return { type: 'path', path: resolved }
}

type CreateKubbOptions = {
  hooks?: AsyncEventEmitter<KubbHooks>
}

/**
 * Creates a Kubb instance bound to a single config entry.
 *
 * Accepts a user-facing config shape and resolves it to a full {@link Config} during
 * `setup()`. The instance then holds shared state (`hooks`, `storage`, `driver`, `config`)
 * across the `setup → build` lifecycle. Attach event listeners to `kubb.hooks` before
 * calling `setup()` or `build()`.
 *
 * @example
 * ```ts
 * const kubb = createKubb(userConfig)
 *
 * kubb.hooks.on('kubb:plugin:end', ({ plugin, duration }) => {
 *   console.log(`${plugin.name} completed in ${duration}ms`)
 * })
 *
 * const { files, failedPlugins } = await kubb.safeBuild()
 * ```
 */
export function createKubb(userConfig: UserConfig, options: CreateKubbOptions = {}): Kubb {
  const hooks = options.hooks ?? new AsyncEventEmitter<KubbHooks>()
  let setupResult: SetupResult | undefined

  const instance: Kubb = {
    get hooks() {
      return hooks
    },
    get storage() {
      if (!setupResult) {
        throw new Error('[kubb] setup() must be called before accessing storage')
      }
      return setupResult.storage
    },
    get driver() {
      if (!setupResult) {
        throw new Error('[kubb] setup() must be called before accessing driver')
      }
      return setupResult.driver
    },
    get config() {
      if (!setupResult) {
        throw new Error('[kubb] setup() must be called before accessing config')
      }
      return setupResult.config
    },
    async setup() {
      setupResult = await setup(userConfig, { hooks })
    },
    async build() {
      if (!setupResult) {
        await instance.setup()
      }
      return build(setupResult!)
    },
    async safeBuild() {
      if (!setupResult) {
        await instance.setup()
      }
      return safeBuild(setupResult!)
    },
  }

  return instance
}
