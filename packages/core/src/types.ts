import type { AsyncEventEmitter, PossiblePromise } from '@internals/utils'
import type { Node, RootNode, SchemaNode, Visitor } from '@kubb/ast/types'
import type { FabricFile, Fabric as FabricType } from '@kubb/fabric-core/types'
import type { HttpMethod } from '@kubb/oas'
import type { DEFAULT_STUDIO_URL, logLevel } from './constants.ts'
import type { Storage } from './createStorage.ts'
import type { Generator } from './defineGenerator.ts'
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
 * - `TDocument` — type of the raw source document exposed by the adapter after `parse()`
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
  /**
   * Human-readable identifier, e.g. `'oas'`, `'drizzle'`, `'asyncapi'`.
   */
  name: TOptions['name']
  /**
   * Resolved options (after defaults have been applied).
   */
  options: TOptions['resolvedOptions']
  /**
   * The raw source document produced after the first `parse()` call.
   * `undefined` before parsing; typed by the adapter's `TDocument` generic.
   */
  document: TOptions['document'] | null
  rootNode: RootNode | null
  /**
   * Convert the raw source into a universal `RootNode`.
   */
  parse: (source: AdapterSource) => PossiblePromise<RootNode>
  /**
   * Extracts `FabricFile.Import` entries needed by a `SchemaNode` tree.
   * Populated after the first `parse()` call. Returns an empty array before that.
   *
   * The `resolve` callback receives the collision-corrected schema name and must
   * return the `{ name, path }` pair for the import, or `undefined` to skip it.
   */
  getImports: (node: SchemaNode, resolve: (schemaName: string) => { name: string; path: string }) => Array<FabricFile.Import>
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
     * Accepts any object implementing the {@link Storage} interface.
     * Keys are root-relative paths (e.g. `src/gen/api/getPets.ts`).
     * @default fsStorage()
     * @example
     * ```ts
     * import { memoryStorage } from '@kubb/core'
     * storage: memoryStorage()
     * ```
     */
    storage?: Storage
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
    extension?: Record<FabricFile.Extname, FabricFile.Extname | ''>
    /**
     * Configures how `index.ts` files are created, including disabling barrel file generation. Each plugin has its own `barrelType` option; this setting controls the root barrel file (e.g., `src/gen/index.ts`).
     * @default 'named'
     */
    barrelType?: 'all' | 'named' | false
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
  plugins: Array<Plugin>
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

/**
 * A type/string-pattern filter used for `include`, `exclude`, and `override` matching.
 */
type PatternFilter = {
  type: string
  pattern: string | RegExp
}

/**
 * A pattern filter paired with partial option overrides to apply when the pattern matches.
 */
type PatternOverride<TOptions> = PatternFilter & {
  options: Omit<Partial<TOptions>, 'override'>
}

/**
 * Context passed to `resolver.resolveOptions` to apply include/exclude/override filtering
 * for a given operation or schema node.
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
 * `default`, `resolveOptions`, `resolvePath`, and `resolveFile` are injected automatically
 * by `defineResolver` — plugin authors may override them but never need to implement them
 * from scratch.
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
  default(name: ResolveNameParams['name'], type?: ResolveNameParams['type']): string
  resolveOptions<TOptions>(node: Node, context: ResolveOptionsContext<TOptions>): TOptions | null
  resolvePath(params: ResolverPathParams, context: ResolverContext): FabricFile.Path
  resolveFile(params: ResolverFileParams, context: ResolverContext): FabricFile.File
  resolveBanner(node: RootNode | null, context: ResolveBannerContext): string | undefined
  resolveFooter(node: RootNode | null, context: ResolveBannerContext): string | undefined
}

/**
 * The user-facing subset of a `Resolver` — everything except the four methods injected by
 * `defineResolver` (`default`, `resolveOptions`, `resolvePath`, and `resolveFile`).
 *
 * All four injected methods can still be overridden by providing them explicitly in the builder.
 *
 * @example
 * ```ts
 * export const resolver = defineResolver<PluginTs>(() => ({
 *   name: 'default',
 *   resolveName(node) { return this.default(node.name, 'function') },
 * }))
 * ```
 */
export type UserResolver = Omit<Resolver, 'default' | 'resolveOptions' | 'resolvePath' | 'resolveFile' | 'resolveBanner' | 'resolveFooter'>

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
   * Resolver object that encapsulates the naming and path-resolution helpers used by this plugin.
   * Use `defineResolver` to define the resolver object and export it alongside the plugin.
   */
  TResolver extends Resolver = Resolver,
> = {
  name: TName
  options: TOptions
  resolvedOptions: TResolvedOptions
  context: TContext
  resolvePathOptions: TResolvePathOptions
  resolver: TResolver
}

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
   * The resolver for this plugin, accessible via `driver.getPluginByName(name)?.resolver`.
   */
  resolver?: TOptions['resolver']
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

type UnknownUserPlugin = UserPlugin<PluginFactoryOptions<string, object, object, unknown, object>>

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
  /**
   * The resolver for this plugin, accessible via `driver.getPluginByName(name)?.resolver`.
   */
  resolver: TOptions['resolver']

  install: (this: PluginContext<TOptions>, context: PluginContext<TOptions>) => PossiblePromise<void>
  /**
   * Defines a context that can be used by other plugins, see `PluginDriver` where we convert from `UserPlugin` to `Plugin` (used when calling `createPlugin`).
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
   * @deprecated this will be replaced by resolvers
   */
  resolvePath?: (
    this: PluginContext<TOptions>,
    baseName: FabricFile.BaseName,
    mode?: FabricFile.Mode,
    options?: TOptions['resolvePathOptions'],
  ) => FabricFile.Path
  /**
   * Resolve to a name based on a string.
   * Useful when converting to PascalCase or camelCase.
   * @type hookFirst
   * @example ('pet') => 'Pet'
   * @deprecated this will be replaced by resolvers
   */
  resolveName?: (this: PluginContext<TOptions>, name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string
}

export type PluginLifecycleHooks = keyof PluginLifecycle

export type PluginParameter<H extends PluginLifecycleHooks> = Parameters<Required<PluginLifecycle>[H]>

export type ResolvePathParams<TOptions = object> = {
  pluginName?: string
  baseName: FabricFile.BaseName
  mode?: FabricFile.Mode
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
  getPlugin: PluginDriver['getPlugin']
  /**
   * Only add when the file does not exist yet
   */
  addFile: (...file: Array<FabricFile.File>) => Promise<void>
  /**
   * merging multiple sources into the same output file
   */
  upsertFile: (...file: Array<FabricFile.File>) => Promise<void>
  events: AsyncEventEmitter<KubbEvents>
  /**
   * Current plugin
   */
  plugin: Plugin<TOptions>
  /**
   * Resolver for the current plugin. Shorthand for `plugin.resolver`.
   */
  resolver: TOptions['resolver']

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
export type Output<_TOptions = unknown> = {
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
  banner?: string | ((node: RootNode) => string)
  /**
   * Add a footer text in the beginning of every file
   */
  footer?: string | ((node: RootNode) => string)
  /**
   * Whether to override existing external files if they already exist.
   * @default false
   */
  override?: boolean
}

export type UserGroup = {
  /**
   * Defines the type where to group the files.
   * - 'tag' groups files by OpenAPI tags.
   * - 'path' groups files by OpenAPI paths.
   * @default undefined
   */
  type: 'tag' | 'path'
  /**
   * Return the name of a group based on the group name, this is used for the file and name generation.
   */
  name?: (context: { group: string }) => string
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
   * Return the name of a group based on the group name, this is used for the file and name generation.
   */
  name: (context: { group: string }) => string
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
export type LoggerContext = AsyncEventEmitter<KubbEvents>

export type Logger<TOptions extends LoggerOptions = LoggerOptions> = {
  name: string
  install: (context: LoggerContext, options?: TOptions) => void | Promise<void>
}

export type UserLogger<TOptions extends LoggerOptions = LoggerOptions> = Logger<TOptions>

/**
 * Compatibility preset for code generation tools.
 * - `'default'` – no compatibility adjustments (default behavior).
 * - `'kubbV4'` – align generated names and structures with Kubb v4 output.
 */
export type CompatibilityPreset = 'default' | 'kubbV4'

export type { Storage } from './createStorage.ts'
export type { CoreGeneratorV2, Generator, ReactGeneratorV2 } from './defineGenerator.ts'
export type { KubbEvents } from './Kubb.ts'

/**
 * A preset bundles a name, one or more resolvers, optional AST transformers,
 * and optional generators into a single reusable configuration object.
 *
 * @template TResolver - The concrete resolver type for this preset.
 */
export type Preset<TResolver extends Resolver = Resolver> = {
  /**
   * Unique identifier for this preset.
   */
  name: string
  /**
   * Ordered list of resolvers applied by this preset (last entry wins on merge).
   */
  resolvers: Array<TResolver>
  /**
   * Optional AST visitors / transformers applied after resolving.
   */
  transformers?: Array<Visitor>
  /**
   * Optional generators used by this preset. Plugin implementations cast this
   * to their concrete generator type.
   */
  generators?: Array<Generator<any>>
}

/**
 * A named registry of presets, keyed by preset name.
 *
 * @template TResolver - The concrete resolver type shared by all presets in this registry.
 * @template TName - The union of valid preset name keys.
 */
export type Presets<TResolver extends Resolver = Resolver> = Record<CompatibilityPreset, Preset<TResolver>>

type ByTag = {
  type: 'tag'
  pattern: string | RegExp
}

type ByOperationId = {
  type: 'operationId'
  pattern: string | RegExp
}

type ByPath = {
  type: 'path'
  pattern: string | RegExp
}

type ByMethod = {
  type: 'method'
  pattern: HttpMethod | RegExp
}
// TODO implement as alternative for ByMethod
// type ByMethods = {
//   type: 'methods'
//   pattern: Array<HttpMethod>
// }

type BySchemaName = {
  type: 'schemaName'
  pattern: string | RegExp
}

type ByContentType = {
  type: 'contentType'
  pattern: string | RegExp
}

export type Exclude = ByTag | ByOperationId | ByPath | ByMethod | ByContentType | BySchemaName
export type Include = ByTag | ByOperationId | ByPath | ByMethod | ByContentType | BySchemaName

export type Override<TOptions> = (ByTag | ByOperationId | ByPath | ByMethod | BySchemaName | ByContentType) & {
  //TODO should be options: Omit<Partial<TOptions>, 'override'>
  options: Partial<TOptions>
}

export type ResolvePathOptions = {
  pluginName?: string
  group?: {
    tag?: string
    path?: string
  }
  type?: ResolveNameParams['type']
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
  baseName: FabricFile.BaseName
  pathMode?: FabricFile.Mode
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
  extname: FabricFile.Extname
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
 * resolver.resolveBanner(rootNode, { output: { banner: '// generated' }, config })
 * // → '// generated'
 * ```
 */
export type ResolveBannerContext = {
  output?: Pick<Output, 'banner' | 'footer'>
  config: Config
}
