import { resolve } from 'node:path'
import type { PossiblePromise } from '@internals/utils'
import { AsyncEventEmitter, BuildError } from '@internals/utils'
import type { FileNode, InputMeta, OperationNode, SchemaNode } from '@kubb/ast'
import { HOOK_LISTENERS_PER_PLUGIN } from './constants.ts'
import type { Adapter } from './createAdapter.ts'
import { type Diagnostic, Diagnostics, type ProblemDiagnostic, type UpdateDiagnostic } from './diagnostics.ts'
import type { Cache } from './createCache.ts'
import { createStorage, type Storage } from './createStorage.ts'
import type { GeneratorContext } from './defineGenerator.ts'
import type { Middleware } from './defineMiddleware.ts'
import type { Parser } from './defineParser.ts'
import type { KubbPluginEndContext, KubbPluginSetupContext, KubbPluginStartContext, Plugin } from './definePlugin.ts'
import type { Reporter, ReporterName } from './createReporter.ts'

import { KubbDriver } from './KubbDriver.ts'
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
 * Path to an input file to generate from, absolute or relative to the config file. The adapter
 * parses it (e.g. an OpenAPI YAML or JSON spec) into the universal AST.
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
 * Inline spec to generate from, passed directly instead of read from a file. A string
 * (YAML/JSON) or a parsed object.
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
 * Resolved build configuration for a Kubb run: what to generate from (adapter, input), where to
 * write it (output), how (plugins, middleware), and the runtime pieces (parsers, storage). See
 * `UserConfig` for the relaxed form with defaults applied.
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
   * Project root directory, absolute or relative to the config file. Already
   * resolved on the `Config` instance (see `UserConfig` for the optional
   * form that defaults to `process.cwd()`).
   */
  root: string
  /**
   * Parsers that convert generated files into strings. Each parser handles a
   * set of file extensions, and a fallback parser handles anything else.
   *
   * Already resolved on the `Config` instance (see `UserConfig` for the
   * optional form that defaults to `[parserTs, parserTsx, parserMd]`).
   *
   * @example
   * ```ts
   * import { defineConfig } from 'kubb'
   * import { parserTs, parserTsx } from '@kubb/parser-ts'
   *
   * export default defineConfig({
   *   parsers: [parserTs, parserTsx],
   * })
   * ```
   */
  parsers: Array<Parser>
  /**
   * Adapter that parses input files into the universal AST representation.
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
   * Required when an adapter is configured. Omit it when running in plugin-only mode.
   */
  input?: TInput
  output: {
    /**
     * Output directory for generated files, absolute or relative to `root`. Plugins can nest
     * subdirectories under it by grouping strategy (tag, path).
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
     * Remove every file in the output directory before the build, so stale output isn't mixed
     * with new files. Leave `false` to preserve manual edits in the output directory.
     *
     * @default false
     * @example
     * ```ts
     * clean: true  // wipes ./src/gen/* before generating
     * ```
     */
    clean?: boolean
    /**
     * Format the generated files after generation. `'auto'` runs the first formatter it finds
     * (oxfmt, biome, or prettier), a named tool forces that one, and `false` skips formatting.
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
     * Lint the generated files after generation. `'auto'` runs the first linter it finds
     * (oxlint, biome, or eslint), a named tool forces that one, and `false` skips linting.
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
     * Rewrite import extensions in generated files, e.g. emit `.js` imports from `.ts` sources for
     * ESM dual packages. Keys are the source extension, values the output, and `''` drops it.
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
     * Banner prepended to every generated file. `'simple'` is the basic Kubb notice, `'full'` adds
     * source, title, description, and API version, and `false` omits it.
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
     * Overwrite existing files when `true`, skip files that already exist when `false`. Individual
     * plugins can override it. Keep `false` to avoid clobbering local edits in the output folder.
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
   * Where generated files are persisted. Defaults to `fsStorage()` (disk). Pass `memoryStorage()`
   * to keep files in RAM, or implement `Storage` for a custom backend such as cloud or a database.
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
   * Incremental build cache. Kubb fingerprints the inputs (spec content, config, plugin options,
   * versions) and, on an unchanged "hot" run, restores the previously generated output instead of
   * regenerating it. When only part of the spec changes, it regenerates just the affected schemas
   * and operations. Same idea as Nx's computation cache.
   *
   * `defineConfig` enables `fsCache()` (local disk under `node_modules/.cache/kubb`) by default.
   * Pass another backend to change where snapshots live, or `false` to turn caching off. A bare
   * `createKubb` leaves it off unless a cache is provided.
   *
   * @example
   * ```ts
   * import { fsCache } from '@kubb/core'
   *
   * cache: fsCache({ dir: '.kubb-cache' })
   * cache: false
   * ```
   *
   * @see {@link Cache} interface for implementing custom backends.
   */
  cache?: Cache
  /**
   * Plugins that run during the build to generate code and transform the AST. Each one processes
   * the adapter's AST and can emit files for a different target (TypeScript, Zod, Faker). A plugin
   * that depends on another throws when that plugin isn't registered.
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
  /**
   * The reporters available to the run, registered as instances. The host
   * (the CLI via `--reporter`) selects which ones to trigger by `name` with {@link selectReporters}.
   * `defineConfig` from the `kubb` package registers the built-in `cli`, `json`, and `file`
   * reporters by default.
   *
   * - `cli` writes the end-of-run summary to the terminal.
   * - `json` writes a machine-readable report to stdout, for CI.
   * - `file` writes a debug log to `.kubb/<name>-<timestamp>.log`.
   *
   * @example
   * ```ts
   * import { cliReporter, jsonReporter } from '@kubb/core'
   *
   * reporters: [cliReporter, jsonReporter, myReporter]
   * ```
   */
  reporters: Array<Reporter>
}

/**
 * Partial `Config` for user-facing entry points with sensible defaults.
 *
 * `UserConfig` is what you pass to `defineConfig()`. It has optional `root`, `plugins`, `parsers`, and `adapter`
 * fields (which fall back to sensible defaults). All other Config options are available, including `output`, `input`,
 * `storage`, `middleware`, and `hooks`.
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
export type UserConfig<TInput = Input> = Omit<Config<TInput>, 'root' | 'plugins' | 'parsers' | 'adapter' | 'storage' | 'reporters' | 'cache'> & {
  /**
   * Incremental build cache. Defaults to `fsCache()` (local disk). Pass another {@link Cache}
   * backend, or `false` to turn caching off.
   */
  cache?: Cache | false
  /**
   * Project root directory, absolute or relative to the config file location.
   * @default process.cwd()
   */
  root?: string
  /**
   * Custom parsers that convert generated AST nodes to strings (TypeScript, JSON, markdown, etc.).
   * @default [parserTs, parserTsx, parserMd]  // applied by `defineConfig` from the `kubb` package
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
  /**
   * Reporters available to the run. `defineConfig` registers the built-in `cli`, `json`, and
   * `file` reporters when omitted.
   * @default [cliReporter, jsonReporter, fileReporter]  // applied by `defineConfig` from the `kubb` package
   */
  reporters?: Array<Reporter>
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
 * Attach listeners before calling `setup()` or `build()` to observe and react to build progress.
 *
 * @example
 * ```ts
 * kubb.hooks.on('kubb:lifecycle:start', () => {
 *   console.log('Starting Kubb generation')
 * })
 *
 * kubb.hooks.on('kubb:plugin:end', ({ plugin, duration }) => {
 *   console.log(`${plugin.name} completed in ${duration}ms`)
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
  'kubb:format:start': []
  'kubb:format:end': []
  'kubb:lint:start': []
  'kubb:lint:end': []
  'kubb:hooks:start': []
  'kubb:hooks:end': []
  'kubb:hook:start': [ctx: KubbHookStartContext]
  'kubb:hook:line': [ctx: KubbHookLineContext]
  'kubb:hook:end': [ctx: KubbHookEndContext]
  'kubb:info': [ctx: KubbInfoContext]
  'kubb:error': [ctx: KubbErrorContext]
  'kubb:success': [ctx: KubbSuccessContext]
  'kubb:warn': [ctx: KubbWarnContext]
  'kubb:diagnostic': [ctx: KubbDiagnosticContext]
  'kubb:files:processing:start': [ctx: KubbFilesProcessingStartContext]
  'kubb:files:processing:update': [ctx: KubbFilesProcessingUpdateContext]
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
  /**
   * Resolved configuration for this build.
   */
  config: Config
  /**
   * Adapter that parsed the input into the universal AST.
   */
  adapter: Adapter
  /**
   * Metadata about the parsed document (title, version, base URL, circular schema names, enum names).
   * To observe individual schemas and operations use the `kubb:generate:schema` / `kubb:generate:operation` hooks.
   */
  meta: InputMeta | undefined
  /**
   * Looks up a registered plugin by name, typed by the plugin registry.
   */
  getPlugin<TName extends keyof Kubb.PluginRegistry>(name: TName): Plugin<Kubb.PluginRegistry[TName]> | undefined
  getPlugin(name: string): Plugin | undefined
  /**
   * Snapshot of all files accumulated so far.
   */
  readonly files: ReadonlyArray<FileNode>
  /**
   * Adds or merges one or more files into the file manager.
   */
  upsertFile: (...files: Array<FileNode>) => void
}

export type KubbPluginsEndContext = {
  /**
   * Resolved configuration for this build.
   */
  config: Config
  /**
   * Snapshot of all files accumulated across all plugins.
   */
  readonly files: ReadonlyArray<FileNode>
  /**
   * Adds or merges one or more files into the file manager.
   */
  upsertFile: (...files: Array<FileNode>) => void
}

export type KubbBuildEndContext = {
  /**
   * All files generated during this build.
   */
  files: Array<FileNode>
  /**
   * Resolved configuration for this build.
   */
  config: Config
  /**
   * Absolute path to the output directory.
   */
  outputDir: string
}

export type KubbLifecycleStartContext = {
  /**
   * Current Kubb version string.
   */
  version: string
}

export type KubbConfigEndContext = {
  /**
   * All resolved configs after defaults are applied.
   */
  configs: Array<Config>
}

export type KubbGenerationStartContext = {
  /**
   * Resolved configuration for this generation run.
   */
  config: Config
}

export type KubbGenerationEndContext = {
  /**
   * Resolved configuration for this generation run.
   */
  config: Config
  /**
   * Read-only view of the files written during this build.
   * Reads go directly to `config.storage`, nothing extra is held in memory.
   *
   * @example Read a generated file
   * `const code = await storage.getItem('/src/gen/pet.ts')`
   *
   * @example Walk every generated file
   * ```ts
   * for (const path of await storage.getKeys()) {
   *   const code = await storage.getItem(path)
   * }
   * ```
   */
  storage: Storage
  /**
   * Diagnostics collected during the build: error/warning/info problems plus a
   * `timing` diagnostic per plugin. The end-of-run summary derives its failure counts
   * and per-plugin timings from these. Set by the CLI runner, omitted by other callers.
   */
  diagnostics?: Array<Diagnostic>
  /**
   * `'success'` when all plugins completed without errors, `'failed'` otherwise.
   */
  status?: 'success' | 'failed'
  /**
   * High-resolution start time from `process.hrtime()`, used to compute the elapsed time.
   */
  hrStart?: [number, number]
  /**
   * Total number of files created during this run.
   */
  filesCreated?: number
}

export type KubbInfoContext = {
  /**
   * Human-readable info message.
   */
  message: string
  /**
   * Optional supplementary detail.
   */
  info?: string
}

export type KubbErrorContext = {
  /**
   * The caught error.
   */
  error: Error
  /**
   * Optional structured metadata for additional context.
   */
  meta?: Record<string, unknown>
}

export type KubbSuccessContext = {
  /**
   * Human-readable success message.
   */
  message: string
  /**
   * Optional supplementary detail.
   */
  info?: string
}

export type KubbWarnContext = {
  /**
   * Human-readable warning message.
   */
  message: string
  /**
   * Optional supplementary detail.
   */
  info?: string
}

export type KubbDiagnosticContext = {
  /**
   * The structured diagnostic to render: a build problem or a version-update notice.
   */
  diagnostic: ProblemDiagnostic | UpdateDiagnostic
}

export type KubbFilesProcessingStartContext = {
  /**
   * Files about to be serialised and written.
   */
  files: Array<FileNode>
}

export type KubbFileProcessingUpdate = {
  /**
   * Number of files processed so far in this batch.
   */
  processed: number
  /**
   * Total number of files in this batch.
   */
  total: number
  /**
   * Completion percentage, `0` to `100`.
   */
  percentage: number
  /**
   * Serialised file content, or `undefined` when the file produced no output.
   */
  source?: string
  /**
   * The file that was just processed.
   */
  file: FileNode
  /**
   * Resolved configuration for this build.
   */
  config: Config
}

export type KubbFilesProcessingUpdateContext = {
  /**
   * All files processed in this flush chunk.
   */
  files: Array<KubbFileProcessingUpdate>
}

export type KubbFilesProcessingEndContext = {
  /**
   * All files that were serialised in this batch.
   */
  files: Array<FileNode>
}

export type KubbHookStartContext = {
  /**
   * Optional identifier for correlating start/end events.
   */
  id?: string
  /**
   * The shell command that is about to run.
   */
  command: string
  /**
   * Parsed argument list, when available.
   */
  args?: ReadonlyArray<string>
}

/**
 * Emitted for each line streamed from a hook's stdout while it runs.
 * A logger correlates the line to its active UI element via `id`.
 */
export type KubbHookLineContext = {
  /**
   * Identifier matching the corresponding `kubb:hook:start` event.
   */
  id: string
  /**
   * A single streamed stdout line, without its trailing newline.
   */
  line: string
}

export type KubbHookEndContext = {
  /**
   * Optional identifier matching the corresponding `kubb:hook:start` event.
   */
  id?: string
  /**
   * The shell command that ran.
   */
  command: string
  /**
   * Parsed argument list, when available.
   */
  args?: ReadonlyArray<string>
  /**
   * `true` when the command exited with code `0`.
   */
  success: boolean
  /**
   * Error thrown by the command, or `null` on success.
   */
  error: Error | null
  /**
   * Captured stdout from the process, populated when it exits non-zero.
   */
  stdout?: string
  /**
   * Captured stderr from the process, populated when it exits non-zero.
   */
  stderr?: string
}

/**
 * CLI options derived from command-line flags.
 */
export type CLIOptions = {
  /**
   * Path to the Kubb config file.
   */
  config?: string
  /**
   * OpenAPI input path passed as the positional argument to `kubb generate`.
   * Overrides `config.input.path` when set.
   */
  input?: string
  /**
   * Re-run generation whenever input files change.
   */
  watch?: boolean
  /**
   * Controls how much output the CLI prints.
   *
   * @default 'info'
   */
  logLevel?: 'silent' | 'info' | 'verbose'
  /**
   * Reporters selected on the CLI via `--reporter`, overriding `config.reporters`.
   */
  reporters?: Array<ReporterName>
}

/**
 * All accepted forms of a Kubb configuration.
 * Accepts `Config`/`Config[]`/promise or a factory (optionally receiving `TCliOptions`.
 */
export type PossibleConfig<TCliOptions = undefined> =
  | PossiblePromise<Config | Array<Config>>
  | ((...args: [TCliOptions] extends [undefined] ? [] : [TCliOptions]) => PossiblePromise<Config | Array<Config>>)

/**
 * Full output produced by a successful or failed build.
 */
export type BuildOutput = {
  /**
   * Structured diagnostics collected during the build: error/warning/info problems
   * (each with a code, severity, and where known a JSON-pointer location) plus a
   * `timing` diagnostic per plugin. Includes a top-level diagnostic when the build
   * threw before completing. Use {@link Diagnostics.hasError} to test for failure.
   */
  diagnostics: Array<Diagnostic>
  /**
   * All files generated during this build.
   */
  files: Array<FileNode>
  /**
   * The plugin driver that orchestrated this build.
   */
  driver: KubbDriver
  /**
   * Read-only view of every file written during this build.
   * Reads go straight to `config.storage`, nothing extra is held in memory.
   *
   * @example Read a generated file
   * `const code = await buildOutput.storage.getItem('/src/gen/pet.ts')`
   *
   * @example List all generated file paths
   * `const paths = await buildOutput.storage.getKeys()`
   */
  storage: Storage
}

/**
 * Builds a `Storage` view scoped to the file paths produced by the current build.
 * Reads delegate to the underlying `storage` so source bytes stay where they were
 * written. Writes register the key so subsequent reads and `getKeys` are scoped
 * to this build's output.
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

function resolveConfig(userConfig: UserConfig): Config {
  return {
    ...userConfig,
    root: userConfig.root || process.cwd(),
    parsers: userConfig.parsers ?? [],
    output: {
      format: false,
      lint: false,
      extension: { '.ts': '.ts' },
      defaultBanner: 'simple',
      ...userConfig.output,
    },
    storage: userConfig.storage ?? fsStorage(),
    // Resolve `false` to "no cache". The default `fsCache()` is applied by `defineConfig`, not here,
    // so a raw `createKubb` stays deterministic (no surprise on-disk cache) unless a cache is passed.
    cache: userConfig.cache === false ? undefined : userConfig.cache,
    reporters: userConfig.reporters ?? [],
    plugins: userConfig.plugins ?? [],
  }
}

type CreateKubbOptions = {
  hooks?: AsyncEventEmitter<KubbHooks>
}

/**
 * Kubb code-generation instance bound to a single config entry. Resolves the user
 * config during `setup()` and shares `hooks`, `storage`, `driver`, and `config` across
 * the `setup → build` lifecycle.
 *
 * Attach event listeners to `.hooks` before calling `setup()` or `build()`.
 *
 * @example
 * ```ts
 * const kubb = createKubb(userConfig)
 * kubb.hooks.on('kubb:plugin:end', ({ plugin, duration }) => console.log(plugin.name, duration))
 * const { files, diagnostics } = await kubb.safeBuild()
 * ```
 */
export class Kubb {
  readonly hooks: AsyncEventEmitter<KubbHooks>
  readonly #userConfig: UserConfig
  #config: Config | null = null
  #driver: KubbDriver | null = null
  #storage: Storage | null = null

  constructor(userConfig: UserConfig, options: CreateKubbOptions = {}) {
    this.#userConfig = userConfig
    this.hooks = options.hooks ?? new AsyncEventEmitter<KubbHooks>()
  }

  get storage(): Storage {
    if (!this.#storage) throw new Error('[kubb] setup() must be called before accessing storage')
    return this.#storage
  }

  get driver(): KubbDriver {
    if (!this.#driver) throw new Error('[kubb] setup() must be called before accessing driver')
    return this.#driver
  }

  get config(): Config {
    if (!this.#config) throw new Error('[kubb] setup() must be called before accessing config')
    return this.#config
  }

  /**
   * Resolves config and initializes the driver. `build()` calls this automatically.
   */
  async setup(): Promise<void> {
    const config = resolveConfig(this.#userConfig)
    const driver = new KubbDriver(config, { hooks: this.hooks })
    const storage = createSourcesView(config.storage)

    // Each generator a plugin registers adds a listener to the shared hooks emitter, so size the
    // ceiling to the plugin count. Without this, a multi-generator plugin set trips Node's
    // EventEmitter leak warning at the default 10.
    this.hooks.setMaxListeners(Math.max(10, config.plugins.length * HOOK_LISTENERS_PER_PLUGIN))

    if (config.output.clean) {
      await config.storage.clear(resolve(config.root, config.output.path))
    }

    await driver.setup()

    this.#config = config
    this.#driver = driver
    this.#storage = storage
  }

  /**
   * Runs the full pipeline and throws on any plugin error.
   * Automatically calls `setup()` if needed.
   */
  async build(): Promise<BuildOutput> {
    const out = await this.safeBuild()
    if (Diagnostics.hasError(out.diagnostics)) {
      const errors = out.diagnostics
        .filter(Diagnostics.isProblem)
        .filter((diagnostic) => diagnostic.severity === 'error')
        .map((diagnostic) => diagnostic.cause ?? new Diagnostics.Error(diagnostic))
      throw new BuildError(`Build failed with ${errors.length} ${errors.length === 1 ? 'error' : 'errors'}`, { errors })
    }
    return out
  }

  /**
   * Runs the full pipeline and captures errors in `BuildOutput` instead of throwing.
   * Automatically calls `setup()` if needed.
   */
  async safeBuild(): Promise<BuildOutput> {
    if (!this.#driver) await this.setup()
    using cleanup = this
    const driver = cleanup.driver
    const storage = cleanup.storage
    const { diagnostics } = await driver.run({ storage })

    return { diagnostics, files: driver.fileManager.files, driver, storage }
  }

  dispose(): void {
    this.#driver?.dispose()
  }

  [Symbol.dispose](): void {
    this.dispose()
  }
}

/**
 * Constructs a {@link Kubb} build orchestrator from a user config. Equivalent
 * to `new Kubb(userConfig, options)` and the canonical public entry point.
 *
 * @example
 * ```ts
 * import { createKubb } from '@kubb/core'
 * import { adapterOas } from '@kubb/adapter-oas'
 * import { pluginTs } from '@kubb/plugin-ts'
 *
 * const kubb = createKubb({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   adapter: adapterOas(),
 *   plugins: [pluginTs()],
 * })
 *
 * await kubb.build()
 * ```
 */
export function createKubb(userConfig: UserConfig, options: CreateKubbOptions = {}): Kubb {
  return new Kubb(userConfig, options)
}
