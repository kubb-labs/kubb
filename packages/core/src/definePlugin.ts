import type { Enforce, FileNode, HttpMethod, Macro, UserFileNode } from '@kubb/ast'
import { diagnosticCode } from './constants.ts'
import type { Generator } from './defineGenerator.ts'
import type { BannerMeta, Resolver, ResolverPatch } from './Resolver.ts'
import { Diagnostics } from './Diagnostics.ts'
import type { Config, KubbHooks } from './types.ts'

type ExtractRegistryKey<T, K extends PropertyKey> = K extends keyof T ? T[K] : {}

/**
 * How a plugin consolidates its generated code into files.
 * - `'directory'` writes one file per operation or schema under `path`.
 * - `'file'` writes everything into a single file.
 */
export type OutputMode = 'directory' | 'file'

/**
 * Output configuration shared by every plugin. Each plugin extends this with
 * its own keys via the `Kubb.PluginOptionsRegistry.output` interface merge.
 */
export type Output = {
  /**
   * Directory where the plugin writes its generated code, resolved against the global
   * `output.path` set on `defineConfig`. With `mode: 'file'`, this is the full output file
   * path and must include the extension (e.g. `'types.ts'`, `'models.py'`).
   */
  path: string
  /**
   * How generated code is consolidated into files.
   * - `'directory'` writes one file per operation or schema under `path`.
   * - `'file'` writes everything into a single file. The `path` must include the file extension.
   *
   * @default 'directory'
   */
  mode?: OutputMode
  /**
   * Text prepended to every generated file. Useful for license headers,
   * lint disables, or `@ts-nocheck` directives.
   *
   * A string is applied to every file (including barrel and aggregation re-export files).
   * Pass a function to compute the banner from the file's `BannerMeta` document metadata
   * plus per-file context (`isBarrel`, `isAggregation`, `filePath`, `baseName`), so you can
   * skip the banner on specific files.
   *
   * @example Add a directive to source files but not re-export files
   * `banner: (meta) => (meta.isBarrel || meta.isAggregation) ? '' : "'use server'"`
   */
  banner?: string | ((meta: BannerMeta) => string)
  /**
   * Text appended at the end of every generated file. Mirror of `banner`.
   * Pass a function to compute the footer from the file's `BannerMeta`.
   */
  footer?: string | ((meta: BannerMeta) => string)
} & ExtractRegistryKey<Kubb.PluginOptionsRegistry, 'output'>

/**
 * Groups generated files into subdirectories based on an OpenAPI tag or path
 * segment.
 */
export type Group = {
  /**
   * Property used to assign each operation to a group.
   * - `'tag'` uses the first tag (`operation.getTags().at(0)?.name`).
   * - `'path'` uses the first segment of the operation's URL.
   */
  type: 'tag' | 'path'
  /**
   * Returns the subdirectory name from the group key. Defaults to the camelCased tag for
   * `tag` groups, or the camelCased first path segment for `path` groups.
   */
  name?: (context: { group: string }) => string
}

/**
 * Couples `output.mode` with the plugin's `group` option at the type level.
 * - `mode: 'file'` forbids `group` (a single file has nothing to group).
 * - `mode: 'directory'` (or no mode) allows an optional `group` to organize
 *   files into per-group subdirectories.
 *
 * Intersect into a plugin's `Options` type instead of declaring `output` and
 * `group` directly, since `mode` lives inside `output` while `group` is its sibling.
 * The generic keeps a plugin's extended `Output` shape intact.
 *
 * @example
 * ```ts
 * export type Options = OutputOptions & {
 *   exclude?: Array<Exclude>
 * }
 * ```
 */
export type OutputOptions<TOutput extends Output = Output> =
  | {
      output?: TOutput & { mode?: 'directory' }
      group?: Group
    }
  | {
      output: TOutput & { mode: 'file' }
      group?: never
    }

/**
 * Merges the `output.mode` default into the output config and validates the combination.
 * Throws `KUBB_INVALID_PLUGIN_OPTIONS` when `mode: 'file'` is paired with a `group` option,
 * since a single-file output has nothing to group.
 */
export function normalizeOutput({ output, group, pluginName }: { output: Output; group?: Group | null; pluginName: string }): Output {
  const mode = output.mode ?? 'directory'

  if (mode === 'file' && group) {
    throw new Diagnostics.Error({
      code: diagnosticCode.invalidPluginOptions,
      severity: 'error',
      message: `Plugin "${pluginName}" sets \`output.mode: 'file'\` but also configures a \`group\` option.`,
      help: "A single-file output has nothing to group. Remove the `group` option, or use `output.mode: 'directory'` to organize files into subdirectories.",
      location: { kind: 'config' },
      plugin: pluginName,
    })
  }

  return { ...output, mode }
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
   * Filter by HTTP method: `'GET'`, `'POST'`, `'PUT'`, `'PATCH'`, `'DELETE'`, `'HEAD'`, `'OPTIONS'`, `'TRACE'`.
   */
  type: 'method'
  /**
   * HTTP method to match, as one of the `HttpMethod` values (`'GET'`, `'POST'`, `'PUT'`,
   * `'PATCH'`, `'DELETE'`, `'HEAD'`, `'OPTIONS'`, `'TRACE'`) or a regex.
   */
  pattern: HttpMethod | RegExp
}

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
 * Pattern filter for include, exclude, and override rules. Matches operations or schemas
 * by tag, operationId, path, method, content type, or schema name.
 */
export type Filter = ByTag | ByOperationId | ByPath | ByMethod | ByContentType | BySchemaName

/**
 * Filter that skips matching operations or schemas during generation, for example
 * deprecated endpoints or internal-only schemas.
 *
 * @example
 * ```ts
 * exclude: [
 *   { type: 'tag', pattern: 'internal' },
 *   { type: 'path', pattern: /^\/admin/ },
 *   { type: 'operationId', pattern: /^deprecated_/ },
 * ]
 * ```
 */
export type Exclude = Filter

/**
 * Filter that restricts generation to operations or schemas matching at least
 * one entry. Useful for partial builds (one tag, one API version).
 *
 * @example
 * ```ts
 * include: [
 *   { type: 'tag', pattern: 'public' },
 *   { type: 'path', pattern: /^\/api\/v1/ },
 * ]
 * ```
 */
export type Include = Filter

/**
 * Filter paired with a partial options object. When the filter matches, the
 * options are merged on top of the plugin defaults for that operation only.
 * Useful for "this one tag goes to a different folder" rules.
 *
 * Entries are evaluated top to bottom. The first matching entry wins.
 *
 * @example
 * ```ts
 * override: [
 *   {
 *     type: 'tag',
 *     pattern: 'admin',
 *     options: { output: { path: './src/gen/admin' } },
 *   },
 *   {
 *     type: 'operationId',
 *     pattern: 'listPets',
 *     options: { enumType: 'literal' },
 *   },
 * ]
 * ```
 */
export type Override<TOptions> = Filter & {
  options: Omit<Partial<TOptions>, 'override'>
}

export type PluginFactoryOptions<
  /**
   * Unique plugin name.
   */
  TName extends string = string,
  /**
   * User-facing plugin options.
   */
  TOptions extends object = object,
  /**
   * Plugin options after defaults are applied.
   */
  TResolvedOptions extends object = TOptions,
  /**
   * Resolver that encapsulates naming and path-resolution helpers.
   * Define with `createResolver` and export alongside the plugin.
   */
  TResolver extends Resolver = Resolver,
> = {
  name: TName
  options: TOptions
  resolvedOptions: TResolvedOptions
  resolver: TResolver
}

/**
 * Context passed to a plugin's `kubb:plugin:setup` handler, where it registers generators and
 * sets its resolver, transformer, and options.
 */
export type KubbPluginSetupContext<TFactory extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Register one or more generators dynamically. Generators fire during the AST walk
   * (schema/operation/operations) just like generators declared statically on `createPlugin`.
   *
   * Pass generators as separate arguments. Spread an existing list to register it in one call.
   *
   * @example
   * ```ts
   * ctx.addGenerator(myGenerator)
   * ctx.addGenerator(schemaGenerator, operationGenerator)
   * ctx.addGenerator(...selectedGenerators)
   * ```
   */
  addGenerator<TElement = unknown>(...generators: Array<Generator<TFactory, TElement>>): void
  /**
   * Set or override the resolver for this plugin.
   * The resolver controls file naming and path resolution. Overrides merge over the built-in
   * defaults, so a partial `core` or a single namespace method replaces only what it names.
   */
  setResolver(resolver: ResolverPatch<TFactory['resolver']> | TFactory['resolver']): void
  /**
   * Add a macro that rewrites AST nodes before they reach generators. Macros run in the order they
   * are added, after any macros from earlier `addMacro` calls.
   */
  addMacro(macro: Macro): void
  /**
   * Replace this plugin's macros with `macros`.
   */
  setMacros(macros: ReadonlyArray<Macro>): void
  /**
   * Set resolved options merged into the normalized plugin's `options`.
   * Call this in `kubb:plugin:setup` to provide options generators need.
   */
  setOptions(options: TFactory['resolvedOptions']): void
  /**
   * Inject a raw file into the build output, bypassing the generation pipeline.
   *
   * Pass `copy` with an absolute path to emit a real source file (a shipped template) into the
   * generated folder verbatim, instead of building its content from `sources`.
   */
  injectFile(userFileNode: UserFileNode): void
  /**
   * Merge a partial config update into the current build configuration.
   */
  updateConfig(config: Partial<Config>): void
  /**
   * The resolved build configuration at setup time.
   */
  config: Config
  /**
   * The plugin's user-provided options.
   */
  options: TFactory['options']
}

/**
 * A plugin object produced by `definePlugin`. Its lifecycle handlers live under a single
 * `hooks` property rather than flat methods.
 */
export type Plugin<TFactory extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Unique name for the plugin, following the same naming convention as `createPlugin`.
   */
  name: string
  /**
   * Plugins that must be registered before this plugin executes.
   * An error is thrown at startup when any listed dependency is missing.
   */
  dependencies?: Array<string>
  /**
   * Controls the execution order of this plugin relative to others.
   *
   * - `'pre'` runs before all normal plugins.
   * - `'post'` runs after all normal plugins.
   * - `undefined` (default) runs in declaration order among normal plugins.
   *
   * Dependency constraints always take precedence over `enforce`.
   */
  enforce?: Enforce
  /**
   * The options passed by the user when calling the plugin factory.
   */
  options?: TFactory['options']
  /**
   * Lifecycle hook handlers for this plugin.
   * Any hook from the global `KubbHooks` map can be subscribed to here.
   */
  hooks: {
    [K in keyof KubbHooks as K extends 'kubb:plugin:setup' ? never : K]?: (...args: KubbHooks[K]) => void | Promise<void>
  } & {
    'kubb:plugin:setup'?(ctx: KubbPluginSetupContext<TFactory>): void | Promise<void>
  }
}

/**
 * Normalized plugin after setup, with runtime fields populated. Internal only. Plugins use the
 * public `Plugin` type.
 *
 * @internal
 */
export type NormalizedPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = Plugin<TOptions> & {
  options: TOptions['resolvedOptions'] & {
    output: Output
    include?: Array<Include>
    exclude: Array<Exclude>
    override: Array<Override<TOptions['resolvedOptions']>>
  }
  resolver: TOptions['resolver']
  macros?: Array<Macro>
  generators?: Array<Generator>
  /**
   * Set by the driver when the plugin registers a generator via `addGenerator()` in
   * `kubb:plugin:setup`. Drives whether the build walks the AST for this plugin.
   */
  hasHookGenerators?: boolean
  apply?: (config: Config) => boolean
  version?: string
}

export type KubbPluginStartContext = {
  plugin: NormalizedPlugin
}

export type KubbPluginEndContext = {
  plugin: NormalizedPlugin
  duration: number
  success: boolean
  error?: Error
  config: Config
  /**
   * Returns all files currently in the file manager (lazy snapshot).
   * Includes files added by plugins that have already run.
   */
  readonly files: ReadonlyArray<FileNode>
  /**
   * Upsert one or more files into the file manager.
   */
  upsertFile: (...files: Array<FileNode>) => void
}

/**
 * Wraps a plugin factory and returns a function that accepts user options and
 * yields a typed `Plugin`. Lifecycle handlers go inside a single `hooks` object.
 *
 * Pass a `PluginFactoryOptions` type parameter to get a typed `ctx` inside
 * `kubb:plugin:setup`. Plugin names should follow the `plugin-<feature>`
 * convention (`plugin-react-query`, `plugin-zod`, ...).
 *
 * @example
 * ```ts
 * import { definePlugin } from '@kubb/core'
 *
 * export const pluginTs = definePlugin((options: { prefix?: string } = {}) => ({
 *   name: 'plugin-ts',
 *   hooks: {
 *     'kubb:plugin:setup'(ctx) {
 *       ctx.setResolver(resolverTs)
 *     },
 *   },
 * }))
 * ```
 */
export function definePlugin<TFactory extends PluginFactoryOptions = PluginFactoryOptions>(
  factory: (options: TFactory['options']) => Plugin<TFactory>,
): (options?: TFactory['options']) => Plugin<TFactory> {
  return (options) => factory(options ?? ({} as TFactory['options']))
}
