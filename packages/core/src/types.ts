import type * as KubbFile from '@kubb/fs/types'
import type { PossiblePromise } from '@kubb/types'
import type { FileManager } from './FileManager.ts'
import type { PluginManager } from './PluginManager.ts'
import type { Logger } from './logger.ts'

/**
 * Config used in `kubb.config.ts`
 *
 * @example
 * import { defineConfig } from '@kubb/core'
 * export default defineConfig({
 * ...
 * })
 */
export type UserConfig = Omit<Config, 'root' | 'plugins'> & {
  /**
   * The project root directory, which can be either an absolute path or a path relative to the location of your `kubb.config.ts` file.
   * @default process.cwd()
   */
  root?: string
  /**
   * An array of Kubb plugins used for generation. Each plugin may have additional configurable options (defined within the plugin itself). If a plugin relies on another plugin, an error will occur if the required dependency is missing. Refer to “pre” for more details.
   */
  plugins?: Array<Omit<UnknownUserPlugin, 'context'>>
}

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

export type BarrelType = 'all' | 'named' | 'propagate'

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
   * You can use either `input.path` or `input.data`, depending on your specific needs.
   */
  input: TInput
  output: {
    /**
     * The path where all generated files will be exported.
     * This can be an absolute path or a path relative to the specified root option.
     */
    path: string
    /**
     * Clean the output directory before each build.
     */
    clean?: boolean
    /**
     * Save files to the file system.
     * @default true
     */
    write?: boolean

    /**
     * Override the extension to the generated imports and exports, by default each plugin will add an extension
     * @default { '.ts': '.ts'}
     */
    extension?: Record<KubbFile.Extname, KubbFile.Extname>
    /**
     * Specify how `index.ts` files should be created. You can also disable the generation of barrel files here. While each plugin has its own `barrelType` option, this setting controls the creation of the root barrel file, such as` src/gen/index.ts`.
     * @default 'named'
     */
    barrelType?: Exclude<BarrelType, 'propagate'> | false
  }
  /**
   * An array of Kubb plugins that will be used in the generation.
   * Each plugin may include additional configurable options(defined in the plugin itself).
   * If a plugin depends on another plugin, an error will be returned if the required dependency is missing. See pre for more details.
   */
  plugins?: Array<Plugin>
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

// plugin

export type PluginFactoryOptions<
  /**
   * Name to be used for the plugin, this will also be used for they key.
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
  TContext = any,
  /**
   * When calling `resolvePath` you can specify better types.
   */
  TResolvePathOptions extends object = object,
> = {
  name: TName
  /**
   * Same behaviour like what has been done with `QueryKey` in `@tanstack/react-query`
   */
  key: PluginKey<TName | string>
  options: TOptions
  resolvedOptions: TResolvedOptions
  context: TContext
  resolvePathOptions: TResolvePathOptions
}

export type PluginKey<TName> = [name: TName, identifier?: string | number]

export type GetPluginFactoryOptions<TPlugin extends UserPlugin> = TPlugin extends UserPlugin<infer X> ? X : never

export type UserPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Unique name used for the plugin
   * The name of the plugin follows the format scope:foo-bar or foo-bar, adding scope: can avoid naming conflicts with other plugins.
   * @example @kubb/typescript
   */
  name: TOptions['name']
  /**
   * Options set for a specific plugin(see kubb.config.js), passthrough of options.
   */
  options: TOptions['resolvedOptions']
  /**
   * Specifies the preceding plugins for the current plugin. You can pass an array of preceding plugin names, and the current plugin will be executed after these plugins.
   * Can be used to validate dependent plugins.
   */
  pre?: Array<string>
  /**
   * Specifies the succeeding plugins for the current plugin. You can pass an array of succeeding plugin names, and the current plugin will be executed before these plugins.
   */
  post?: Array<string>
} & (TOptions['context'] extends never
  ? {
      context?: never
    }
  : {
      context: (this: TOptions['name'] extends 'core' ? null : Omit<PluginContext<TOptions>, 'addFile'>) => TOptions['context']
    })

export type UserPluginWithLifeCycle<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = UserPlugin<TOptions> & PluginLifecycle<TOptions>

type UnknownUserPlugin = UserPlugin<PluginFactoryOptions<any, any, any, any, any>>

export type Plugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
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
   * Specifies the preceding plugins for the current plugin. You can pass an array of preceding plugin names, and the current plugin will be executed after these plugins.
   * Can be used to validate dependent plugins.
   */
  pre?: Array<string>
  /**
   * Specifies the succeeding plugins for the current plugin. You can pass an array of succeeding plugin names, and the current plugin will be executed before these plugins.
   */
  post?: Array<string>
  /**
   * Options set for a specific plugin(see kubb.config.js), passthrough of options.
   */
  options: TOptions['resolvedOptions']
  /**
   * Define a context that can be used by other plugins, see `PluginManager' where we convert from `UserPlugin` to `Plugin`(used when calling `createPlugin`).
   */
} & (TOptions['context'] extends never
  ? {
      context?: never
    }
  : {
      context: TOptions['context']
    })

export type PluginWithLifeCycle<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = Plugin<TOptions> & PluginLifecycle<TOptions>

export type PluginLifecycle<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Start of the lifecycle of a plugin.
   * @type hookParallel
   */
  buildStart?: (this: PluginContext<TOptions>, Config: Config) => PossiblePromise<void>
  /**
   * Resolve to a Path based on a baseName(example: `./Pet.ts`) and directory(example: `./models`).
   * Options can als be included.
   * @type hookFirst
   * @example ('./Pet.ts', './src/gen/') => '/src/gen/Pet.ts'
   */
  resolvePath?: (
    this: PluginContext<TOptions>,
    baseName: KubbFile.BaseName,
    mode?: KubbFile.Mode,
    options?: TOptions['resolvePathOptions'],
  ) => KubbFile.OptionalPath
  /**
   * Resolve to a name based on a string.
   * Useful when converting to PascalCase or camelCase.
   * @type hookFirst
   * @example ('pet') => 'Pet'
   */
  resolveName?: (this: PluginContext<TOptions>, name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
  /**
   * End of the plugin lifecycle.
   * @type hookParallel
   */
  buildEnd?: (this: PluginContext<TOptions>) => PossiblePromise<void>
}

export type PluginLifecycleHooks = keyof PluginLifecycle

export type PluginParameter<H extends PluginLifecycleHooks> = Parameters<Required<PluginLifecycle>[H]>

export type ResolvePathParams<TOptions = object> = {
  pluginKey?: Plugin['key']
  baseName: KubbFile.BaseName
  mode?: KubbFile.Mode
  /**
   * Options to be passed to 'resolvePath' 3th parameter
   */
  options?: TOptions
}

export type ResolveNameParams = {
  name: string
  pluginKey?: Plugin['key']
  /**
   * `file` will be used to customize the name of the created file(use of camelCase)
   * `function` can be used to customize the exported functions(use of camelCase)
   * `type` is a special type for TypeScript(use of PascalCase)
   * `const` can be used for variables(use of camelCase)
   */
  type?: 'file' | 'function' | 'type' | 'const'
}

export type PluginContext<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  config: Config
  fileManager: FileManager
  pluginManager: PluginManager
  addFile: (...file: Array<KubbFile.File>) => Promise<Array<KubbFile.ResolvedFile>>
  resolvePath: (params: ResolvePathParams<TOptions['resolvePathOptions']>) => KubbFile.OptionalPath
  resolveName: (params: ResolveNameParams) => string
  logger: Logger
  /**
   * All plugins
   */
  plugins: Plugin[]
  /**
   * Current plugin
   */
  plugin: Plugin<TOptions>
}
/**
 * Specify the export location for the files and define the behavior of the output
 */
export type Output = {
  /**
   * Path to the output folder or file that will contain the generated code
   */
  path: string
  /**
   * Define what needs to be exported, here you can also disable the export of barrel files
   * @default 'named'
   */
  barrelType?: BarrelType | false
  /**
   * Add a banner text in the beginning of every file
   */
  banner?: string
  /**
   * Add a footer text in the beginning of every file
   */
  footer?: string
}

type GroupContext = {
  group: string
}

export type Group = {
  /**
   * Define a type where to group the files on
   */
  type: 'tag'
  /**
   * Return the name of a group based on the group name, this will be used for the file and name generation
   */
  name?: (context: GroupContext) => string
}
