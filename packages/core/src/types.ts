import type { FileManager, KubbFile } from './FileManager.ts'
import type { OptionsPlugins, PluginUnion } from './index.ts'
import type { PluginManager } from './PluginManager.ts'
import type { Cache } from './utils/cache.ts'
import type { Logger, LogLevel } from './utils/logger.ts'

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
  plugins?: Array<Omit<KubbUserPlugin, 'api'> | KubbUnionPlugins | [name: string, options: object]>
}

export type InputPath = {
  /**
   * Path to be used as the input. This can be an absolute path or a path relative to the `root`.
   */
  path: string
}

export type InputData = {
  /**
   * `string` or `object` containing the data.
   */
  data: string | unknown
}

type Input = InputPath | InputData

/**
 * @private
 */
export type KubbConfig<TInput = Input> = {
  /**
   * Optional config name to show in CLI output
   */
  name?: string
  /**
   * Project root directory. Can be an absolute path, or a path relative from
   * the location of the config file itself.
   * @default process.cwd()
   */
  root: string
  input: TInput
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

export type KubbUnionPlugins = PluginUnion

export type KubbObjectPlugin = keyof OptionsPlugins

export type GetPluginFactoryOptions<TPlugin extends KubbUserPlugin> = TPlugin extends KubbUserPlugin<infer X> ? X : never

export type KubbUserPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions> =
  & {
    /**
     * Unique name used for the plugin
     * @example @kubb/typescript
     */
    name: TOptions['name']
    /**
     * Internal key used when a developer uses more than one of the same plugin
     * @private
     */
    key?: TOptions['key']
    /**
     * Options set for a specific plugin(see kubb.config.js), passthrough of options.
     */
    options: TOptions['options'] extends never ? undefined : TOptions['options']
  }
  & Partial<PluginLifecycle<TOptions>>
  & (TOptions['api'] extends never ? {
      api?: never
    }
    : {
      api: (this: TOptions['name'] extends 'core' ? null : Omit<PluginContext, 'addFile'>) => TOptions['api']
    })
  & (TOptions['kind'] extends never ? {
      kind?: never
    }
    : {
      /**
       * Kind/type for the plugin
       * Type 'schema' can be used for JSON schema's, TypeScript types, ...
       * Type 'controller' can be used to create generate API calls, React-Query hooks, Axios controllers, ...
       * @default undefined
       */
      kind: TOptions['kind']
    })

export type KubbPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions> =
  & {
    /**
     * Unique name used for the plugin
     * @example @kubb/typescript
     */
    name: TOptions['name']
    /**
     * Internal key used when a developer uses more than one of the same plugin
     * @private
     */
    key: TOptions['key']
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
  }
  & PluginLifecycle<TOptions>
  & (TOptions['api'] extends never ? {
      api?: never
    }
    : {
      api: TOptions['api']
    })

// use of type objects

export type PluginFactoryOptions<
  Name = string,
  Kind extends KubbPluginKind = KubbPluginKind | never,
  Options = unknown | never,
  Nested extends boolean = false,
  API = unknown | never,
  resolvePathOptions = Record<string, unknown>,
> = {
  name: Name
  kind: Kind
  /**
   * Same like `QueryKey` in `@tanstack/react-query`
   */
  key: [kind: Kind | undefined, name: Name, identifier?: string | number]
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
  validate?: (this: Omit<PluginContext, 'addFile'>, plugins: NonNullable<KubbConfig['plugins']>) => PossiblePromise<true>
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
  writeFile?: (this: Omit<PluginContext, 'addFile'>, source: string | undefined, path: KubbFile.Path) => PossiblePromise<string | void>
  /**
   * End of the plugin lifecycle.
   * @type hookParallel
   */
  buildEnd?: (this: PluginContext) => PossiblePromise<void>
}

export type PluginLifecycleHooks = keyof PluginLifecycle

export type PluginParameter<H extends PluginLifecycleHooks> = Parameters<Required<PluginLifecycle>[H]>

export type PluginCache = Record<string, [number, unknown]>

export type ResolvePathParams<TOptions = Record<string, unknown>> = {
  pluginKey?: KubbPlugin['key']
  baseName: string
  directory?: string | undefined
  /**
   * Options to be passed to 'resolvePath' 3th parameter
   */
  options?: TOptions
}

export type ResolveNameParams = {
  name: string
  pluginKey?: KubbPlugin['key']
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
  /**
   * All plugins
   */
  plugins: KubbPlugin[]
  /**
   * Current plugin
   */
  plugin: KubbPlugin
}

// null will mean clear the watcher for this key
export type TransformResult = string | null

export type AppMeta = { pluginManager: PluginManager }

// generic types

export type Prettify<T> =
  & {
    [K in keyof T]: T[K]
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  & {}

/**
 * TODO move to @kubb/types
 * @deprecated
 */
export type PossiblePromise<T> = Promise<T> | T

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never
type LastOf<T> = UnionToIntersection<T extends any ? () => T : never> extends () => infer R ? R : never

// TS4.0+
type Push<T extends any[], V> = [...T, V]

// TS4.1+
type TuplifyUnion<T, L = LastOf<T>, N = [T] extends [never] ? true : false> = true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>
/**
 * TODO move to @kubb/types
 * @deprecated
 */
export type ObjValueTuple<T, KS extends any[] = TuplifyUnion<keyof T>, R extends any[] = []> = KS extends [infer K, ...infer KT]
  ? ObjValueTuple<T, KT, [...R, [name: K & keyof T, options: T[K & keyof T]]]>
  : R
/**
 * TODO move to @kubb/types
 * @deprecated
 */
export type TupleToUnion<T> = T extends Array<infer ITEMS> ? ITEMS : never

/**
 * TODO move to @kubb/types
 * @deprecated
 */
type ArrayWithLength<T extends number, U extends any[] = []> = U['length'] extends T ? U : ArrayWithLength<T, [true, ...U]>
/**
 * TODO move to @kubb/types
 * @deprecated
 */
export type GreaterThan<T extends number, U extends number> = ArrayWithLength<U> extends [...ArrayWithLength<T>, ...infer _] ? false : true
