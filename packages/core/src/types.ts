import type { AsyncEventEmitter, PossiblePromise } from '@internals/utils'
import type { RootNode, SchemaNode } from '@kubb/ast/types'
import type { Fabric as FabricType, KubbFile } from '@kubb/fabric-core/types'
import type { DEFAULT_STUDIO_URL, logLevel } from './constants.ts'
import type { DefineStorage } from './defineStorage.ts'
import type { Naming } from './defineNaming.ts'
import type { KubbEvents } from './Kubb.ts'
import type { PluginDriver } from './PluginDriver.ts'

export type { Printer, PrinterFactoryOptions } from '@kubb/ast/types'

declare global {
  namespace Kubb {
    interface PluginContext {}
  }
}

/**
 * Config used in `kubb.config.ts`
 *
 * @example
 * import { defineConfig } from '@kubb/core'
 * export default defineConfig({
 * ...
 * })
 */
export type UserConfig<TInput = Input> = Omit<Config<TInput>, 'root' | 'plugins'> & {
  /**
   * The project root directory, which can be either an absolute path or a path relative to the location of your `kubb.config.ts` file.
   * @default process.cwd()
   */
  root?: string
  /**
   * An array of Kubb plugins used for generation. Each plugin may have additional configurable options (defined within the plugin itself). If a plugin relies on another plugin, an error will occur if the required dependency is missing. Refer to “pre” for more details.
   */
  // inject needs to be omitted because else we have a clash with the PluginDriver instance
  plugins?: Array<Omit<UnknownUserPlugin, 'inject'>>
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

type Input = InputPath | InputData | Array<InputPath>

/**
 * The raw source passed to an adapter's `parse` function.
 * Mirrors the shape of `Config['input']` with paths already resolved to absolute.
 */
export type AdapterSource = { type: 'path'; path: string } | { type: 'data'; data: string | unknown } | { type: 'paths'; paths: Array<string> }

/**
 * Type parameters for an adapter definition.
 *
 * Mirrors `PluginFactoryOptions` but scoped to the adapter lifecycle:
 * - `TName` — unique string identifier (e.g. `'oas'`, `'asyncapi'`)
 * - `TOptions` — raw user-facing options passed to the adapter factory
 * - `TResolvedOptions` — defaults applied; what the adapter stores as `options`
 */
export type AdapterFactoryOptions<TName extends string = string, TOptions extends object = object, TResolvedOptions extends object = TOptions> = {
  name: TName
  options: TOptions
  resolvedOptions: TResolvedOptions
}

/**
 * An adapter converts a source file or data into a `@kubb/ast` `RootNode`.
 *
 * Adapters are the single entry-point for different schema formats
 * (OpenAPI, AsyncAPI, Drizzle, …) and produce the universal `RootNode`
 * that all Kubb plugins consume.
 *
 * @example
 * ```ts
 * import { oasAdapter } from '@kubb/adapter-oas'
 *
 * export default defineConfig({
 *   adapter: adapterOas(),         // default — OpenAPI / Swagger
 *   input:   { path: './openapi.yaml' },
 *   plugins: [pluginTs(), pluginZod()],
 * })
 * ```
 */
export type Adapter<TOptions extends AdapterFactoryOptions = AdapterFactoryOptions> = {
  /** Human-readable identifier, e.g. `'oas'`, `'drizzle'`, `'asyncapi'`. */
  name: TOptions['name']
  /** Resolved options (after defaults have been applied). */
  options: TOptions['resolvedOptions']
  /** Convert the raw source into a universal `RootNode`. */
  parse: (source: AdapterSource) => PossiblePromise<RootNode>
  /**
   * Extracts `KubbFile.Import` entries needed by a `SchemaNode` tree.
   * Populated after the first `parse()` call. Returns an empty array before that.
   *
   * The `resolve` callback receives the collision-corrected schema name and must
   * return the `{ name, path }` pair for the import, or `undefined` to skip it.
   */
  getImports: (node: SchemaNode, resolve: (schemaName: string) => { name: string; path: string }) => Array<KubbFile.Import>
}

export type BarrelType = 'all' | 'named' | 'propagate'

export type DevtoolsOptions = {
  /**
   * Open the AST inspector view (`/ast`) in Kubb Studio.
   * When `false`, opens the main Studio page instead.
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
   * The project root directory, which can be either an absolute path or a path relative to the location of your `kubb.config.ts` file.
   * @default process.cwd()
   */
  root: string
  /**
   * Adapter that converts the input file into a `@kubb/ast` `RootNode` — the universal
   * intermediate representation consumed by all Kubb plugins.
   *
   * - Omit (or pass `undefined`) to use the built-in OpenAPI/Swagger adapter.
   * - Use `@kubb/adapter-oas` for explicit OpenAPI configuration (validate, contentType, …).
   * - Use `@kubb/adapter-drizzle` or `@kubb/adapter-asyncapi` for other formats.
   *
   * @example
   * ```ts
   * import { drizzleAdapter } from '@kubb/adapter-drizzle'
   * export default defineConfig({
   *   adapter: drizzleAdapter(),
   *   input: { path: './src/schema.ts' },
   * })
   * ```
   */
  adapter?: Adapter
  /**
   * You can use either `input.path` or `input.data`, depending on your specific needs.
   */
  input: TInput
  output: {
    /**
     * The path where all generated files receives exported.
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
     * @deprecated Use `storage` to control where files are written.
     */
    write?: boolean
    /**
     * Storage backend for generated files.
     * Defaults to `fsStorage()` — the built-in filesystem driver.
     * Accepts any object implementing the {@link DefineStorage} interface.
     * Keys are root-relative paths (e.g. `src/gen/api/getPets.ts`).
     * @default fsStorage()
     * @example
     * ```ts
     * import { defineStorage, fsStorage } from '@kubb/core'
     * storage: defineStorage(fsStorage())
     * ```
     */
    storage?: DefineStorage
    /**
     * Specifies the formatting tool to be used.
     * - 'auto' automatically detects and uses biome or prettier (in that order of preference).
     * - 'prettier' uses Prettier for code formatting.
     * - 'biome' uses Biome for code formatting.
     * - 'oxfmt' uses Oxfmt for code formatting.
     * - false disables code formatting.
     * @default 'prettier'
     */
    format?: 'auto' | 'prettier' | 'biome' | 'oxfmt' | false
    /**
     * Specifies the linter that should be used to analyze the code.
     * - 'auto' automatically detects and uses biome, oxlint, or eslint (in that order of preference).
     * - 'eslint' uses ESLint for linting.
     * - 'biome' uses Biome for linting.
     * - 'oxlint' uses Oxlint for linting.
     * - false disables linting.
     * @default 'auto'
     */
    lint?: 'auto' | 'eslint' | 'biome' | 'oxlint' | false
    /**
     * Overrides the extension for generated imports and exports. By default, each plugin adds an extension.
     * @default { '.ts': '.ts'}
     */
    extension?: Record<KubbFile.Extname, KubbFile.Extname | ''>
    /**
     * Configures how `index.ts` files are created, including disabling barrel file generation. Each plugin has its own `barrelType` option; this setting controls the root barrel file (e.g., `src/gen/index.ts`).
     * @default 'named'
     */
    barrelType?: Exclude<BarrelType, 'propagate'> | false
    /**
     * Adds a default banner to the start of every generated file indicating it was generated by Kubb.
     * - 'simple' adds banner with link to Kubb.
     * - 'full' adds source, title, description, and OpenAPI version.
     * - false disables banner generation.
     * @default 'simple'
     */
    defaultBanner?: 'simple' | 'full' | false
    /**
     * Whether to override existing external files if they already exist.
     * When setting the option in the global configuration, all plugins inherit the same behavior by default.
     * However, all plugins also have an `output.override` option, which can be used to override the behavior for a specific plugin.
     * @default false
     */
    override?: boolean
  }
  /**
   * An array of Kubb plugins that used in the generation.
   * Each plugin may include additional configurable options(defined in the plugin itself).
   * If a plugin depends on another plugin, an error is returned if the required dependency is missing. See pre for more details.
   */
  plugins?: Array<Plugin>
  /**
   * Devtools configuration for Kubb Studio integration.
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
   * Hooks triggered when a specific action occurs in Kubb.
   */
  hooks?: {
    /**
     * Hook that triggers at the end of all executions.
     * Useful for running Prettier or ESLint to format/lint your code.
     */
    done?: string | Array<string>
  }
}

// plugin

export type PluginFactoryOptions<
  /**
   * Name to be used for the plugin.
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
  TContext = unknown,
  /**
   * When calling `resolvePath` you can specify better types.
   */
  TResolvePathOptions extends object = object,
  /**
   * Naming object that encapsulates the exact naming conventions used by this plugin.
   * Use `defineNaming` to create the naming object and export it alongside the plugin.
   */
  TNaming extends Naming = Naming,
> = {
  name: TName
  options: TOptions
  resolvedOptions: TResolvedOptions
  context: TContext
  resolvePathOptions: TResolvePathOptions
  naming: TNaming
}

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
   * Specifies the preceding plugins for the current plugin. You can pass an array of preceding plugin names, and the current plugin is executed after these plugins.
   * Can be used to validate dependent plugins.
   */
  pre?: Array<string>
  /**
   * Specifies the succeeding plugins for the current plugin. You can pass an array of succeeding plugin names, and the current plugin is executed before these plugins.
   */
  post?: Array<string>
  inject?: (this: PluginContext<TOptions>, context: PluginContext<TOptions>) => TOptions['context']
}

export type UserPluginWithLifeCycle<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = UserPlugin<TOptions> & PluginLifecycle<TOptions>

export type UnknownUserPlugin = UserPlugin<PluginFactoryOptions<any, any, any, any, any>>

export type Plugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Unique name used for the plugin
   * @example @kubb/typescript
   */
  name: TOptions['name']
  /**
   * Specifies the preceding plugins for the current plugin. You can pass an array of preceding plugin names, and the current plugin is executed after these plugins.
   * Can be used to validate dependent plugins.
   */
  pre?: Array<string>
  /**
   * Specifies the succeeding plugins for the current plugin. You can pass an array of succeeding plugin names, and the current plugin is executed before these plugins.
   */
  post?: Array<string>
  /**
   * Options set for a specific plugin(see kubb.config.js), passthrough of options.
   */
  options: TOptions['resolvedOptions']

  install: (this: PluginContext<TOptions>, context: PluginContext<TOptions>) => PossiblePromise<void>
  /**
   * Define a context that can be used by other plugins, see `PluginDriver' where we convert from `UserPlugin` to `Plugin`(used when calling `definePlugin`).
   */
  inject: (this: PluginContext<TOptions>, context: PluginContext<TOptions>) => TOptions['context']
}

export type PluginWithLifeCycle<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = Plugin<TOptions> & PluginLifecycle<TOptions>

export type PluginLifecycle<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Start of the lifecycle of a plugin.
   * @type hookParallel
   */
  install?: (this: PluginContext<TOptions>, context: PluginContext<TOptions>) => PossiblePromise<void>
  /**
   * Resolve to a Path based on a baseName(example: `./Pet.ts`) and directory(example: `./models`).
   * Options can als be included.
   * @type hookFirst
   * @example ('./Pet.ts', './src/gen/') => '/src/gen/Pet.ts'
   */
  resolvePath?: (this: PluginContext<TOptions>, baseName: KubbFile.BaseName, mode?: KubbFile.Mode, options?: TOptions['resolvePathOptions']) => KubbFile.Path
  /**
   * Resolve to a name based on a string.
   * Useful when converting to PascalCase or camelCase.
   * @type hookFirst
   * @example ('pet') => 'Pet'
   */
  resolveName?: (this: PluginContext<TOptions>, name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
}

export type PluginLifecycleHooks = keyof PluginLifecycle

export type PluginParameter<H extends PluginLifecycleHooks> = Parameters<Required<PluginLifecycle>[H]>

export type ResolvePathParams<TOptions = object> = {
  pluginName?: string
  baseName: KubbFile.BaseName
  mode?: KubbFile.Mode
  /**
   * Options to be passed to 'resolvePath' 3th parameter
   */
  options?: TOptions
}

export type ResolveNameParams = {
  name: string
  pluginName?: string
  /**
   * Specifies the type of entity being named.
   * - 'file' customizes the name of the created file (uses camelCase).
   * - 'function' customizes the exported function names (uses camelCase).
   * - 'type' customizes TypeScript types (uses PascalCase).
   * - 'const' customizes variable names (uses camelCase).
   * @default undefined
   */
  type?: 'file' | 'function' | 'type' | 'const'
}

export type PluginContext<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  fabric: FabricType
  config: Config
  driver: PluginDriver
  /**
   * Only add when the file does not exist yet
   */
  addFile: (...file: Array<KubbFile.File>) => Promise<void>
  /**
   * merging multiple sources into the same output file
   */
  upsertFile: (...file: Array<KubbFile.File>) => Promise<void>
  events: AsyncEventEmitter<KubbEvents>
  mode: KubbFile.Mode
  /**
   * Current plugin
   */
  plugin: Plugin<TOptions>

  /**
   * Opens the Kubb Studio URL for the current `rootNode` in the default browser.
   * Falls back to printing the URL if the browser cannot be launched.
   * No-ops silently when no adapter has set a `rootNode`.
   */
  openInStudio: (options?: DevtoolsOptions) => Promise<void>
} & (
  | {
      /**
       * Returns the universal `@kubb/ast` `RootNode` produced by the configured adapter.
       * Returns `undefined` when no adapter was set (legacy OAS-only usage).
       */
      rootNode: RootNode
      /**
       * Return the adapter from `@kubb/ast`
       */
      adapter: Adapter
    }
  | {
      rootNode?: never
      adapter?: never
    }
) &
  Kubb.PluginContext
/**
 * Specify the export location for the files and define the behavior of the output
 */
export type Output<TOptions> = {
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
  banner?: string | ((options: TOptions) => string)
  /**
   * Add a footer text in the beginning of every file
   */
  footer?: string | ((options: TOptions) => string)
  /**
   * Whether to override existing external files if they already exist.
   * @default false
   */
  override?: boolean
}

type GroupContext = {
  group: string
}

export type Group = {
  /**
   * Defines the type where to group the files.
   * - 'tag' groups files by OpenAPI tags.
   * - 'path' groups files by OpenAPI paths.
   * @default undefined
   */
  type: 'tag' | 'path'
  /**
   * Return the name of a group based on the group name, this used for the file and name generation
   */
  name?: (context: GroupContext) => string
}

export type LoggerOptions = {
  /**
   * @default 3
   */
  logLevel: (typeof logLevel)[keyof typeof logLevel]
}

/**
 * Shared context passed to all plugins, parsers, and Fabric internals.
 */
export interface LoggerContext extends AsyncEventEmitter<KubbEvents> {}

type Install<TOptions = unknown> = (context: LoggerContext, options?: TOptions) => void | Promise<void>

export type Logger<TOptions extends LoggerOptions = LoggerOptions> = {
  name: string
  install: Install<TOptions>
}

export type UserLogger<TOptions extends LoggerOptions = LoggerOptions> = Omit<Logger<TOptions>, 'logLevel'>

export type { CoreGeneratorV2, Generator, ReactGeneratorV2 } from './defineGenerator.ts'
export type { DefineStorage } from './defineStorage.ts'
export type { KubbEvents } from './Kubb.ts'
