import type { FileManager } from './managers/fileManager/index.ts'
import type { KubbFile, PluginManager } from './managers/index.ts'
import type { Cache } from './utils/cache.ts'
import type { Logger } from './utils/logger.ts'

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
  plugins?: Array<KubbPlugin> | Array<KubbJSONPlugins> | KubbObjectPlugins
}

type InputPath = {
  /**
   * Path to be used as the input. This can be an absolute path or a path relative to the `root`.
   */
  path: string
}

type InputData = {
  /**
   * `string` or `object` containing the data.
   */
  data: string | unknown
}

type Input = InputPath | InputData

/**
 * @private
 */
export type KubbConfig = {
  /**
   * Project root directory. Can be an absolute path, or a path relative from
   * the location of the config file itself.
   * @default process.cwd()
   */
  root: string
  input: Input
  output: {
    /**
     * Path to be used to export all generated files.
     * This can be an absolute path, or a path relative based of the defined `root` option.
     */
    path: string
    /**
     * Clean output directory before each build.
     */
    clean?: boolean
    /**
     * Write files to the fileSystem
     * This is being used for the playground.
     * @default true
     */
    write?: boolean
  }
  /**
   * Array of Kubb plugins to use.
   * The plugin/package can forsee some options that you need to pass through.
   * Sometimes a plugin is depended on another plugin, if that's the case you will get an error back from the plugin you installed.
   */
  plugins?: Array<KubbPlugin>
  /**
   * Hooks that will be called when a specific action is triggered in Kubb.
   */
  hooks?: {
    /**
     * Hook that will be triggered at the end of all executions.
     * Useful for running Prettier or ESLint to format/lint your code.
     */
    done?: string | Array<string>
  }
}

export type CLIOptions = {
  /**
   * Path to `kubb.config.js`
   */
  config?: string
  /**
   * Watch changes on input
   */
  watch?: string

  /**
   * Log level to report when using the CLI
   *
   * `silent` will hide all information that is not relevant
   *
   * `info` will show all information possible(not related to the PluginManager)
   *
   * `debug` will show all information possible(related to the PluginManager), handy for seeing logs
   * @default `silent`
   */
  logLevel?: LogLevel
}

export type BuildOutput = {
  files: FileManager['files']
  pluginManager: PluginManager
}

// plugin

export type KubbPluginKind = 'schema' | 'controller'

// eslint-disable-next-line @typescript-eslint/ban-types
export type KubbJSONPlugins = [plugin: keyof Kubb.OptionsPlugins | (string & {}), options: Kubb.OptionsPlugins[keyof Kubb.OptionsPlugins]]

export type KubbObjectPlugin = keyof Kubb.OptionsPlugins
export type KubbObjectPlugins = {
  [K in keyof Kubb.OptionsPlugins]: Kubb.OptionsPlugins[K] | object
}

export type KubbUserPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions> =
  & {
    /**
     * Unique name used for the plugin
     * @example @kubb/typescript
     */
    name: PluginFactoryOptions['name']
    /**
     * Options set for a specific plugin(see kubb.config.js), passthrough of options.
     */
    options: TOptions['options'] extends never ? undefined : TOptions['options']
    /**
     * Kind/type for the plugin
     * Type 'schema' can be used for JSON schema's, TypeScript types, ...
     * Type 'controller' can be used to create generate API calls, React-Query hooks, Axios controllers, ...
     * @default undefined
     */
    kind?: KubbPluginKind
  }
  & Partial<PluginLifecycle<TOptions>>
  & (TOptions['api'] extends never
  ? {
     api?:never
    }
  :  {
    api: (this: Omit<PluginContext, 'addFile'>) => TOptions['api']
  }
  )


export type KubbPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Unique name used for the plugin
   * @example @kubb/typescript
   */
  name: PluginFactoryOptions['name']
  /*
  Internal key used when a developer uses more than one of the same plugin
    */
  key: [kind: KubbPluginKind | undefined, name: PluginFactoryOptions['name'], identifier: string]
  /**
   * Options set for a specific plugin(see kubb.config.js), passthrough of options.
   */
  options: TOptions['options'] extends never ? undefined : TOptions['options']
  /**
   * Kind/type for the plugin
   * Type 'schema' can be used for JSON schema's, TypeScript types, ...
   * Type 'controller' can be used to create generate API calls, React-Query hooks, Axios controllers, ...
   * @default undefined
   */
  kind?: KubbPluginKind
  /**
   * Define an api that can be used by other plugins, see `PluginManager' where we convert from `KubbUserPlugin` to `KubbPlugin`(used when calling `createPlugin`).
   */
} & PluginLifecycle<TOptions>
& (TOptions['api'] extends never
? {
   api?:never
  }
:  {
  api: TOptions['api']
}
)

// use of type objects

export type PluginFactoryOptions<
  Name = string,
  Options = unknown | never,
  Nested extends boolean = false,
  API = unknown | never,
  resolvePathOptions = Record<string, unknown>,
> = {
  name: Name
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
  validate?: (this: Omit<PluginContext, 'addFile'>, plugins: NonNullable<KubbConfig["plugins"]>) => PossiblePromise<true>
  /**
   * Start of the lifecycle of a plugin.
   * @type hookParallel
   */
  buildStart?: (this: PluginContext, kubbConfig: KubbConfig) => PossiblePromise<void>
  /**
   * Resolve to a Path based on a baseName(example: `./Pet.ts`) and directory(example: `./models`).
   * Options can als be included.
   * @type hookFirst
   * @example ('./Pet.ts', './src/gen/') => '/src/gen/Pet.ts'
   */
  resolvePath?: (this: PluginContext, baseName: string, directory?: string, options?: TOptions['resolvePathOptions']) => KubbFile.OptionalPath
  /**
   * Resolve to a name based on a string.
   * Useful when converting to PascalCase or camelCase.
   * @type hookFirst
   * @example ('pet') => 'Pet'
   */
  resolveName?: (this: PluginContext, name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
  /**
   * Makes it possible to run async logic to override the path defined previously by `resolvePath`.
   * @type hookFirst
   */
  load?: (this: Omit<PluginContext, 'addFile'>, path: KubbFile.Path) => PossiblePromise<TransformResult | null>
  /**
   * Transform the source-code.
   * @type hookReduceArg0
   */
  transform?: (this: Omit<PluginContext, 'addFile'>, source: string, path: KubbFile.Path) => PossiblePromise<TransformResult>
  /**
   * Write the result to the file-system based on the id(defined by `resolvePath` or changed by `load`).
   * @type hookParallel
   */
  writeFile?: (this: Omit<PluginContext, 'addFile'>, source: string | undefined, path: KubbFile.Path) => PossiblePromise<void>
  /**
   * End of the plugin lifecycle.
   * @type hookParallel
   */
  buildEnd?: (this: PluginContext) => PossiblePromise<void>
}

export type PluginLifecycleHooks = keyof PluginLifecycle

export type PluginCache = Record<string, [number, unknown]>

export type ResolvePathParams<TOptions = Record<string, unknown>> = {
  /**
   * When set, resolvePath will only call resolvePath of the name of the plugin set here.
   * If not defined it will fall back on the resolvePath of the core plugin.
   */
  pluginName?: string
  baseName: string
  directory?: string | undefined
  /**
   * Options to be passed to 'resolvePath' 3th parameter
   */
  options?: TOptions
}

export type ResolveNameParams = {
  name: string
  /**
   * When set, resolvePath will only call resolvePath of the name of the plugin set here.
   * If not defined it will fall back on the resolvePath of the core plugin.
   */
  pluginName?: string
  type?: 'file' | 'function'
}

export type PluginContext<TOptions = Record<string, unknown>> = {
  config: KubbConfig
  cache: Cache<PluginCache>
  fileManager: FileManager
  pluginManager: PluginManager
  addFile: (...file: Array<KubbFile.File>) => Promise<Array<KubbFile.File>>
  resolvePath: (params: ResolvePathParams<TOptions>) => KubbFile.OptionalPath
  resolveName: (params: ResolveNameParams) => string
  logger: Logger
  plugins: KubbPlugin[]
}

// null will mean clear the watcher for this key
export type TransformResult = string | null

export const LogLevel = {
  silent: 'silent',
  info: 'info',
  debug: 'debug',
} as const

export type LogLevel = keyof typeof LogLevel

export type AppMeta = { pluginManager: PluginManager }

// generic types

export type Prettify<T> =
  & {
    [K in keyof T]: T[K]
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  & {}

export type PossiblePromise<T> = Promise<T> | T
