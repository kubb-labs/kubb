import path from 'node:path'
import type { LiteralUnion } from '@internals/utils'
import type { Enforce, HttpMethod, Macro, UserFileNode } from '@kubb/ast'
import type { Generator } from './defineGenerator.ts'
import { defineExtension } from './defineExtension.ts'
import type { ExtensionDependencies, ExtensionDependencyRecord, ExtensionFactory, ExtensionMeta, ExtensionNamed } from './defineExtension.ts'
import type { BannerMeta, Resolver, ResolverPatch } from './Resolver.ts'
import { Diagnostics } from './Diagnostics.ts'
import type { Memo } from './memo.ts'
import type { Config, FilesContext, KubbHooks } from './types.ts'

/** Reads key `K` from a registry interface, or `{}` when no package has augmented it. @internal */
export type ExtractRegistryKey<T, K extends PropertyKey> = K extends keyof T ? T[K] : {}

/**
 * A plugin name as accepted by `getPlugin`/`requirePlugin`/`getResolver`. Registered names from
 * `Kubb.PluginRegistry` autocomplete, and any other string is still allowed.
 */
export type PluginName = LiteralUnion<keyof Kubb.PluginRegistry>

/**
 * Resolves a plugin name to its `PluginType`. A name registered in `Kubb.PluginRegistry`
 * maps to its exact factory options, any other string falls back to the generic options.
 */
export type ResolvePluginOptions<TName> = TName extends keyof Kubb.PluginRegistry ? Kubb.PluginRegistry[TName] : PluginType

/**
 * How a plugin consolidates its generated code into files.
 * - `'file'` writes everything into a single file.
 * - `'directory'` writes one file per operation or schema under `path`.
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
   * - `'file'` writes everything into a single file. The `path` must include the file extension.
   * - `'directory'` writes one file per operation or schema under `path`.
   *
   * Defaults to `'file'` when `path` carries an extension and `'directory'` when it does not.
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
   * `tag` groups, or the first path segment as written in the spec for `path` groups.
   */
  name?: (context: { group: string }) => string
}

/**
 * Couples `output.mode` with the plugin's `group` option at the type level.
 * - An explicit `mode: 'file'` forbids `group` (a single file has nothing to group).
 * - Omitting `mode`, or setting it to `'directory'`, allows an optional `group`.
 *
 * `mode` is normally inferred from `output.path` (an extension means `'file'`, anything
 * else `'directory'`), so `group` rarely needs `mode` spelled out alongside it. Set
 * `mode: 'directory'` explicitly only to override that inference, such as a directory
 * name that carries a dot (`path: 'clients.v2'`).
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
      output?: TOutput & { mode: 'file' }
      group?: never
    }

/**
 * Merges the `output.mode` default into the output config and validates the combination.
 * Throws `KUBB_INVALID_PLUGIN_OPTIONS` when `mode: 'file'` is paired with a `group` option,
 * since a single-file output has nothing to group.
 *
 * An omitted `mode` follows the shape of `path`: an extension means a single file, anything
 * else is a directory. Plugin defaults such as `path: 'types'` name a directory, so they
 * generate without the caller spelling out `mode`.
 */
export function normalizeOutput({ output, group, pluginName }: { output: Output; group?: Group | null; pluginName: string }): Output {
  const mode = output.mode ?? (path.extname(output.path) ? 'file' : 'directory')

  if (mode === 'file' && group) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.invalidPluginOptions,
      severity: 'error',
      message: `Plugin "${pluginName}" resolves \`output.mode\` to 'file' but also configures a \`group\` option.`,
      help: "A single-file output has nothing to group. Remove the `group` option, give `output.path` an extensionless directory name, or set `output.mode: 'directory'` explicitly.",
      location: { kind: 'config' },
      plugin: pluginName,
    })
  }

  return { ...output, mode }
}

/** Throws `KUBB_INVALID_PLUGIN_OPTIONS`, listing the allowed values, when `value` is not one of `allowed`. */
export function assertPluginOption({
  plugin,
  option,
  value,
  allowed,
}: {
  plugin: string
  option: string
  value: unknown
  allowed: ReadonlyArray<unknown>
}): void {
  if (allowed.includes(value)) return

  const format = (item: unknown) => (typeof item === 'string' ? JSON.stringify(item) : String(item))
  const expected = allowed.map(format).join(', ')
  throw new Diagnostics.Error({
    code: Diagnostics.code.invalidPluginOptions,
    severity: 'error',
    message: `Plugin "${plugin}" option \`${option}\` is ${format(value)}, but it must be one of ${expected}.`,
    help: `Set \`${option}\` to one of ${expected}.`,
    location: { kind: 'config' },
    plugin,
  })
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
   * Filter by HTTP method: `'GET'`, `'POST'`, `'PUT'`, `'PATCH'`, `'DELETE'`, `'HEAD'`, `'OPTIONS'`, `'TRACE'`, `'QUERY'`.
   */
  type: 'method'
  /**
   * HTTP method to match, as one of the `HttpMethod` values (`'GET'`, `'POST'`, `'PUT'`,
   * `'PATCH'`, `'DELETE'`, `'HEAD'`, `'OPTIONS'`, `'TRACE'`, `'QUERY'`) or a regex.
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

type ByExtension = {
  /** Filter operations by a vendor extension (`x-*` key) on the source operation. Does not apply to schemas. */
  type: 'extension'
  /** Extension key, including the `x-` prefix. */
  key: `x-${string}`
  /** Value the extension must strictly equal. When omitted, the key being present is enough. */
  value?: unknown
}

/**
 * Pattern filter for include, exclude, and override rules. Matches operations or schemas
 * by tag, operationId, path, method, content type, schema name, or vendor extension.
 */
export type Filter = ByTag | ByOperationId | ByPath | ByMethod | ByContentType | BySchemaName | ByExtension

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
 *   { type: 'extension', key: 'x-internal', value: true },
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

export type PluginType<
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
export type KubbPluginSetupContext<TFactory extends PluginType = PluginType> = {
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
   * generated folder, instead of building its content from `sources`.
   */
  injectFile(userFileNode: UserFileNode): void
  /** Returns a plugin this one needs, or fails the run with `KUBB_PLUGIN_NOT_FOUND` when the config lacks it. */
  requirePlugin<TName extends PluginName>(name: TName): Plugin<ResolvePluginOptions<TName>>
  /** Returns a value computed once per build and shared by every plugin, like `ctx.memo` in a generator. */
  memo: Memo
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
 * A plugin object produced by `defineExtension`. Its lifecycle handlers live under a single
 * `hooks` property rather than flat methods.
 */
export type Plugin<TFactory extends PluginType = PluginType> = ExtensionNamed & {
  /**
   * Plugins this one builds on. They run first when the config has them. An array only orders
   * plugins. A record also fails the run when a required entry is missing or out of range.
   */
  dependencies?: Array<PluginName> | ExtensionDependencies<TFactory['options']>
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
  /**
   * Runs before `kubb:plugin:setup`. Takes the user's options and returns the resolved options.
   */
  setup?(options: TFactory['options'], kubb: KubbPluginSetupContext<TFactory>): TFactory['resolvedOptions'] | Promise<TFactory['resolvedOptions']>
}

/**
 * The object passed to `defineExtension` with `kind: 'plugin'`.
 */
export type PluginDefinition<TFactory extends PluginType = PluginType> = Pick<Plugin<TFactory>, 'dependencies' | 'enforce' | 'setup'> & {
  meta: ExtensionMeta<TFactory['name']>
  hooks?: Plugin<TFactory>['hooks']
}

/**
 * The function `defineExtension` returns for a plugin. Call it with user options to get a `Plugin`.
 */
export type PluginFactory<TFactory extends PluginType = PluginType> = ExtensionFactory<'plugin', TFactory['options'], Plugin<TFactory>, TFactory['name']>

/**
 * Normalized plugin after setup, with runtime fields populated. Internal only. Plugins use the
 * public `Plugin` type.
 *
 * @internal
 */
export type NormalizedPlugin<TOptions extends PluginType = PluginType> = Plugin<TOptions> & {
  name: string
  meta: ExtensionMeta
  dependencies?: Array<PluginName> | ExtensionDependencyRecord
  options: TOptions['resolvedOptions'] & {
    output: Output
    include?: Array<Include>
    exclude: Array<Exclude>
    override: Array<Override<TOptions['resolvedOptions']>>
  }
  resolver: TOptions['resolver']
  macros?: Array<Macro>
  generators?: Array<Generator>
}

export type KubbPluginStartContext = {
  plugin: NormalizedPlugin
}

export type KubbPluginEndContext = FilesContext & {
  plugin: NormalizedPlugin
  duration: number
  success: boolean
  error?: Error
  config: Config
}

/**
 * Defines a plugin from one object and returns a factory that takes the user's options.
 *
 * @deprecated Use `defineExtension` with `kind: 'plugin'` instead.
 */
export function definePlugin<TFactory extends PluginType = PluginType>(definition: PluginDefinition<TFactory>): PluginFactory<TFactory> {
  return defineExtension({ kind: 'plugin', ...definition })
}
