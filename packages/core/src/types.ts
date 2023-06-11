/* eslint-disable @typescript-eslint/no-empty-interface */
import type { File, FileManager } from './managers/fileManager/index.ts'
import type { PluginManager, SafeParseResult } from './managers/index.ts'
import type { Cache } from './utils/cache.ts'

export interface Register {}

export type MaybePromise<T> = Promise<T> | T

/**
 * Config used in `kubb.config.js`
 *
 * @example import { defineConfig } from '@kubb/core'
 * export default defineConfig({
 * ...
 * })
 */
export type KubbUserConfig = Omit<KubbConfig, 'root' | 'plugins'> & {
  /**
   * Project root directory. Can be an absolute path, or a path relative from
   * the location of the config file itself.
   * @default process.cwd()
   */
  root?: string
  /**
   * Plugin type can be KubbJSONPlugin or KubbPlugin
   * Example: ['@kubb/swagger', { output: false }]
   * Or: createSwagger({ output: false })
   */
  plugins?: KubbPlugin[] | KubbJSONPlugins[] | KubbObjectPlugins
}

/**
 * Global/internal config used through out the full generation.
 */
export type KubbConfig = {
  /**
   * Project root directory. Can be an absolute path, or a path relative from
   * the location of the config file itself.
   * @default process.cwd()
   */
  root: string
  input: {
    /**
     * Path to be used as the input. Can be an absolute path, or a path relative from
     * the defined root option.
     */
    path: string
  }
  output: {
    /**
     * Path to be used to export all generated files. Can be an absolute path, or a path relative based of the defined root option.
     */
    path: string
    /**
     * Remove previous generated files and folders.
     */
    clean?: boolean
    /**
     * Enabled or disable the writing to the filesystem. This is being used for the playground.
     * @default true
     */
    write?: boolean
  }
  /**
   * Array of Kubb plugins to use.
   * The plugin/package can forsee some options that you need to pass through.
   * Sometimes a plugin is depended on another plugin, if that's the case you will get an error back from the plugin you installed.
   */
  plugins?: KubbPlugin[]
  /**
   * Hooks that will be called when a specific action is triggered in Kubb.
   */
  hooks?: {
    /**
     * Hook that will be triggerend at the end of all executions.
     * Useful for running Prettier or ESLint to use your own linting structure.
     */
    done?: string | string[]
  }
  /**
   * Log level to report when using the CLI
   * Under construction, only info is implemented.
   * @default `silent`
   */
  logLevel?: LogLevel
}

export type CLIOptions = {
  /**
   * Path to `kubb.config.js`
   */
  config?: string
  /**
   * Enable debug mode
   */
  debug?: boolean
  /**
   * Watch changes on input
   */
  watch?: string
  /**
   * Override `input` defined in `kubb.config.js`
   */
  input?: string

  /**
   * Override `logLevel` defined in `kubb.config.js`
   * @default `'silent'`
   */
  logLevel?: LogLevel
  init?: unknown
}

export type BuildOutput = {
  files: FileManager['files']
  pluginManager: PluginManager
}

// plugin

export type KubbPluginKind = 'schema' | 'controller'

export type KubbJSONPlugins = [plugin: keyof Register | string, options: Register[keyof Register] | object]

export type KubbObjectPlugins = {
  [K in keyof Register]: Register[K] | object
}

export type KubbPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Unique name used for the plugin
   * @example @kubb/typescript
   */
  name: string
  /**
   * Options set for a specific plugin(see kubb.config.js), passthrough of options.
   */
  options: TOptions['options']
  /**
   * Kind/type for the plugin
   * Type 'schema' can be used for JSON schema's, TypeScript types, ...
   * Type 'controller' can be used to create generate API calls, React-Query hooks, Axios controllers, ...
   * @default undefined
   */
  kind?: KubbPluginKind
  /**
   * Defined an api that can be used by other plugins
   */
  api?: TOptions['api']
} & Partial<PluginLifecycle<TOptions>>

// use of type objects
export type PluginFactoryOptions<Options = unknown, Nested extends boolean = false, API = any, resolvePathOptions = Record<string, any>> = {
  options: Options
  nested: Nested
  api: API
  resolvePathOptions: resolvePathOptions
}

export type PluginLifecycle<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Valdiate all plugins to see if their depended plugins are installed and configured.
   * @type hookParallel
   */
  validate: (this: Omit<PluginContext, 'addFile'>, plugins: KubbPlugin[]) => MaybePromise<true>
  /**
   * Start of the lifecycle of a plugin.
   * @type hookParallel
   */
  buildStart: (this: PluginContext, kubbConfig: KubbConfig) => MaybePromise<void>
  /**
   * Resolve to a Path based on a fileName(example: `./Pet.ts`) and directory(example: `./models`).
   * Options can als be included.
   * @type hookFirst
   * @example ('./Pet.ts', './src/gen/') => '/src/gen/Pet.ts'
   */
  resolvePath: (this: PluginContext, fileName: string, directory?: string, options?: TOptions['resolvePathOptions']) => OptionalPath
  /**
   * Resolve to a name based on a string.
   * Useful when converting to PascalCase or camelCase.
   * @type hookFirst
   * @example ('pet') => 'Pet'
   */
  resolveName: (this: PluginContext, name: string) => string
  /**
   * Makes it possible to run async logic to override the path defined previously by `resolvePath`.
   * @type hookFirst
   */
  load: (this: Omit<PluginContext, 'addFile'>, path: Path) => MaybePromise<TransformResult | null>
  /**
   * Transform the source-code.
   * @type hookReduceArg0
   */
  transform: (this: Omit<PluginContext, 'addFile'>, source: string, path: Path) => MaybePromise<TransformResult>
  /**
   * Write the result to the file-system based on the id(defined by `resolvePath` or changed by `load`).
   * @type hookParallel
   */
  writeFile: (this: Omit<PluginContext, 'addFile'>, source: string | undefined, path: Path) => MaybePromise<void>
  /**
   * End of the plugin lifecycle.
   * @type hookParallel
   */
  buildEnd: (this: PluginContext) => MaybePromise<void>
}

export type PluginLifecycleHooks = keyof PluginLifecycle

export type ResolvePathParams<TOptions = Record<string, any>> = {
  /**
   * When set, resolvePath will only call resolvePath of the name of the plugin set here.
   * If not defined it will fall back on the resolvePath of the core plugin.
   */
  pluginName?: string
  fileName: string
  directory?: string | undefined
  /**
   * Options to be passed to 'resolvePath' 3th parameter
   */
  options?: TOptions
}

export type ResolveNameParams = {
  /**
   * When set, resolvePath will only call resolvePath of the name of the plugin set here.
   * If not defined it will fall back on the resolvePath of the core plugin.
   */
  pluginName?: string
  name: string
}

export type PluginContext<TOptions = Record<string, any>> = {
  config: KubbConfig
  cache: Cache
  fileManager: FileManager
  addFile: (...file: File[]) => Promise<File[]>
  resolvePath: (params: ResolvePathParams<TOptions>) => OptionalPath
  resolveName: (params: ResolveNameParams) => string | null | undefined
  load: (id: string) => Promise<SafeParseResult<'load'>>
}

// null will mean clear the watcher for this key
export type TransformResult = string | null

/**
 * @description Computing the name of a file or directory together with its position in relation to other directories traced back in a line to the root
 */
export type Path = string
export type OptionalPath = Path | null | undefined
export type FileName = string | null | undefined

export type LogLevel = 'error' | 'info' | 'silent'
