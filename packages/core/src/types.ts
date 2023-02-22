import type { FileManager, File } from './managers/fileManager'
import type { Cache } from './utils/cache'

export type MaybePromise<T> = Promise<T> | T

export type KubbUserConfig = Omit<KubbConfig, 'root'> & {
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
  plugins?: Array<unknown>
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
     * Write output to the fileSystem
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
     */
    done?: string | string[]
  }
  /**
   * Log level to report when using the CLI
   */
  logLevel?: LogLevel
}

export type CLIOptions = {
  config?: string
  mode?: 'development' | 'production'
  debug?: boolean
  watch?: string
}

// plugin

export type KubbPluginKind = 'schema' | 'controller'

export type KubbJSONPlugin = [string, Record<string, any>]

export type KubbPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Unique name used for the plugin
   * @example @kubb/typescript
   */
  name: string
  /**
   * Kind/type for the plugin
   * Type 'schema' can be used for JSON schema's, Typescript types, ...
   * Type 'controller' can be used to create generate API calls, React-Query hooks, Axios controllers, ...
   * @default undefined
   */
  kind?: KubbPluginKind
  /**
   * Defined an api that can be used by other plugins
   */
  api?: TOptions['api']
  /**
   * Options set for a specific plugin(see kubb.config.ts)
   */
  options?: TOptions['options']
} & Partial<PluginLifecycle>

// use of type objects
export type PluginFactoryOptions<Options = unknown, Nested extends boolean = false, Api = any> = {
  options: Options
  nested: Nested
  api: Api
}

export type PluginLifecycle = {
  /**
   * Valdiate all plugins to see if their depended plugins are installed and configured.
   * @type hookParallel
   */
  validate: (this: PluginContext, plugins: KubbPlugin[]) => MaybePromise<true>
  /**
   * Start of the lifecycle of a plugin.
   * @type hookParallel
   */
  buildStart: (this: PluginContext, kubbConfig: KubbConfig) => MaybePromise<void>
  /**
   * Resolve to an id based on importee(example: `./Pet.ts`) and directory(example: `./models`).
   * @type hookFirst
   * @example ('./Pet.ts', './src/gen/')
   */
  resolveId: (this: PluginContext, fileName: string, directory?: string, options?: Record<string, any>) => OptionalPath
  /**
   * Makes it possible to run async logic to override the path defined previously by `resolveId`.
   * @type hookFirst
   */
  load: (this: PluginContext, path: Path) => MaybePromise<TransformResult | null>
  /**
   * Transform the source-code.
   * @type hookReduceArg0
   */
  transform: (this: PluginContext, source: string, path: Path) => MaybePromise<TransformResult>
  /**
   * Write the result to the file-system based on the id(defined by `resolveId` or changed by `load`).
   * @type hookParallel
   */
  writeFile: (this: PluginContext, source: string | undefined, path: Path) => MaybePromise<void>
  /**
   * End of the plugin lifecycle.
   * @type hookParallel
   */
  buildEnd: (this: PluginContext) => MaybePromise<void>
}

export type PluginLifecycleHooks = keyof PluginLifecycle

export type ResolveIdParams = {
  fileName: string
  directory?: string | undefined
  /**
   * When set, resolveId will only call resolveId of the name of the plugin set here.
   * If not defined it will fall back on the resolveId of the core plugin.
   */
  pluginName?: string
  /**
   * Options to be passed to 'resolveId' 3th parameter
   */
  options?: Record<string, any>
}

export type PluginContext = {
  config: KubbConfig
  cache: Cache
  fileManager: FileManager
  addFile: (file: File) => Promise<File>
  resolveId: (params: ResolveIdParams) => MaybePromise<OptionalPath>
  load: (id: string) => MaybePromise<TransformResult | void>
}

// null will mean clear the watcher for this key
export type TransformResult = string | null

/**
 * @description Computing the name of a file or directory together with its position in relation to other directories traced back in a line to the root
 */
export type Path = string
export type OptionalPath = Path | null | undefined
export type FileName = string | null | undefined

export type LogType = 'error' | 'warn' | 'info'
export type LogLevel = LogType | 'silent'
