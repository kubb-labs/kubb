import path from 'node:path'
import type { LiteralUnion } from '@internals/utils'
import type { Enforce, FileNode, HttpMethod, InputMeta, OperationNode, SchemaNode, UserFileNode } from '@kubb/ast'
import type { Adapter } from './createAdapter.ts'
import type { ProblemDiagnostic } from './Diagnostics.ts'
import type { FileManager } from './FileManager.ts'
import type { Hookable } from './Hookable.ts'
import type { KubbDriver } from './KubbDriver.ts'
import { defineExtension } from './defineExtension.ts'
import type { ExtensionDependencies, ExtensionDependencyRecord, ExtensionFactory, ExtensionMeta, ExtensionNamed } from './defineExtension.ts'
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
 * Document metadata extended with per-file context, passed to a `banner`/`footer` function.
 *
 * @example Skip a directive on re-export files
 * `banner: (meta) => (meta.isBarrel || meta.isAggregation) ? '' : "'use server'"`
 */
export type BannerMeta = InputMeta & {
  /**
   * Full output path of the file being generated.
   */
  filePath: string
  /**
   * File name only, e.g. `'stocks.ts'`.
   */
  baseName: string
  /**
   * `true` for `index.ts` re-export barrels.
   */
  isBarrel: boolean
  /**
   * `true` for group `[dir]/[dir].ts` aggregation files.
   */
  isAggregation: boolean
}

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
   * - `'tag'` uses the first tag (`operation.getTags().at(0)?.name`), nested in the folders of its `parent` tags.
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

/**
 * Pattern filter on one operation or schema field: a literal string or a regex, matched case-sensitive.
 * `tag` matches any of an operation's OpenAPI `tags`, `operationId` its id, `path` its full URL path,
 * `contentType` a request body content type, and `schemaName` a `#/components/schemas` name.
 */
type ByPattern<T extends 'tag' | 'operationId' | 'path' | 'schemaName' | 'contentType'> = {
  /**
   * Field to match: `'tag'`, `'operationId'`, `'path'`, `'schemaName'`, or `'contentType'`.
   */
  type: T
  /**
   * Literal value or regular expression the field must match.
   */
  pattern: string | RegExp
}

/**
 * Filter by OpenAPI `tags`.
 */
type ByTag = ByPattern<'tag'>

/**
 * Filter by OpenAPI `operationId`.
 */
type ByOperationId = ByPattern<'operationId'>

/**
 * Filter by OpenAPI `path` (URL endpoint), matched against the full path.
 */
type ByPath = ByPattern<'path'>

type ByMethod = {
  /**
   * Filter by HTTP method: `'GET'`, `'POST'`, `'PUT'`, `'PATCH'`, `'DELETE'`, `'HEAD'`, `'OPTIONS'`, `'TRACE'`, `'QUERY'`.
   */
  type: 'method'
  /**
   * HTTP method to match, as one of the `HttpMethod` values (`'GET'`, `'POST'`, `'PUT'`,
   * `'PATCH'`, `'DELETE'`, `'HEAD'`, `'OPTIONS'`, `'TRACE'`, `'QUERY'`) or a regex. Matching ignores
   * case, so `'get'` and `/get/` work too.
   */
  pattern: HttpMethod | RegExp
}

/**
 * Filter by schema component name in `#/components/schemas`.
 */
type BySchemaName = ByPattern<'schemaName'>

/**
 * Filter by request content type, such as `'application/json'`.
 */
type ByContentType = ByPattern<'contentType'>

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

/** Options every generator plugin accepts. `TResolvedOptions` is the options object an `override` entry can set. */
export type PluginOptions<TResolvedOptions> = OutputOptions & {
  /** Skip operations matching at least one entry in the list. */
  exclude?: Array<Exclude>
  /** Restrict generation to operations matching at least one entry in the list. */
  include?: Array<Include>
  /** Apply a different options object to operations matching a pattern. */
  override?: Array<Override<TResolvedOptions>>
}

/** The `PluginOptions` keys after a plugin applies its defaults. An interface, so a plugin's `ResolvedOptions` can pass itself as `TResolvedOptions`. */
export interface ResolvedPluginOptions<TResolvedOptions> {
  output: Output
  exclude: Array<Exclude>
  include: Array<Include> | undefined
  override: Array<Override<TResolvedOptions>>
  group: Group | null
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
> = {
  name: TName
  options: TOptions
  resolvedOptions: TResolvedOptions
}

/**
 * Context passed to a plugin's `setup` and `kubb:plugin:setup` handlers, where it sets its options.
 */
export type KubbPluginSetupContext<TFactory extends PluginType = PluginType> = {
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
  /**
   * Returns a value computed once per build and shared by every plugin, like `ctx.memo` in a generator.
   */
  memo: Memo
  /**
   * The name and meta of the plugin being set up.
   */
  plugin: Pick<NormalizedPlugin, 'name' | 'meta'>
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
 * Context the driver passes to a plugin's visit hooks for the whole walk. `@kubb/kit` adds the
 * resolver and per-node options on top of it for generators.
 *
 * The driver sets `adapter` before the walk, so hooks can read it without a null check.
 */
export type PluginVisitContext<TOptions extends PluginType = PluginType> = {
  /** Stops cooperative generation work at the next safe checkpoint. */
  signal?: AbortSignal
  /** The resolved Kubb config for this build, including `root`, `input`, `output`, and the full plugin list. */
  config: Config
  /**
   * Absolute path to the build's output directory: `config.output.path` resolved against `config.root`.
   * It is the same for every plugin. A plugin's own `output.path` is relative to it.
   */
  root: string
  /**
   * @deprecated Use `schemas`, `getPlugin` and `memo` instead. Removed in the next major version.
   */
  driver: KubbDriver
  /** Get a plugin by name, typed via `Kubb.PluginRegistry` when registered. */
  getPlugin<TName extends PluginName>(name: TName): Plugin<ResolvePluginOptions<TName>> | undefined
  /** Get a plugin by name, throws an error if not found. */
  requirePlugin<TName extends PluginName>(name: TName): Plugin<ResolvePluginOptions<TName>>
  /** Add files only if they don't exist. */
  addFile: (...file: Array<FileNode>) => Promise<void>
  /** Merge sources into the same output file. */
  upsertFile: (...file: Array<FileNode>) => Promise<void>
  /**
   * The file at `path` as the build holds it now, such as one an earlier plugin wrote.
   */
  getFile: (path: string) => FileNode | undefined
  /** The build's hook bus. Emit or listen to any `KubbHooks` hook, for example to react to `kubb:build:end` from inside a generator. */
  hooks: Hookable<KubbHooks>
  /** The current plugin instance. */
  plugin: Plugin<TOptions> & { name: string; meta: ExtensionMeta }
  /**
   * Report a warning. Collected as a `warning` diagnostic attributed to the current
   * plugin. It surfaces in the run summary but does not fail the build. Pass `options` to set
   * the `code`, the `help` text, or the source `location`.
   *
   * @example
   * `ctx.warn('Enum has no values', { help: 'Add values to the enum.', location: { kind: 'schema', pointer: '#/components/schemas/Status' } })`
   */
  warn: (message: string, options?: Partial<Pick<ProblemDiagnostic, 'code' | 'help' | 'location'>>) => void
  /**
   * Report an error. Collected as an `error` diagnostic attributed to the current
   * plugin, which fails the build. A `Diagnostics.Error` keeps its own code, help, and location.
   * Pass `options` to set them for a plain message or error.
   */
  error: (error: string | Error, options?: Partial<Pick<ProblemDiagnostic, 'code' | 'help' | 'location'>>) => void
  /**
   * Report an informational message. Collected as an `info` diagnostic attributed to
   * the current plugin. Pass `options` to set the `code`, the `help` text, or the source `location`.
   */
  info: (message: string, options?: Partial<Pick<ProblemDiagnostic, 'code' | 'help' | 'location'>>) => void
  /** The configured adapter instance. */
  adapter: Adapter
  /**
   * Document metadata from the adapter: title, version, base URL, servers, and security schemes.
   * Derive schema indexes such as circular or enum names with `memo`.
   */
  meta: InputMeta
  /** Every schema in the spec, in the order the adapter returns them. Empty before the adapter parses the input. */
  schemas: ReadonlyArray<SchemaNode>
  /** Every operation in the spec, in the order the adapter returns them. Empty before the adapter parses the input. */
  operations: ReadonlyArray<OperationNode>
  /** Adds a generator result to the build: files as they are, or elements through `renderer`. A `pointer` is set on each source that carries none. */
  dispatch: FileManager['dispatch']
  /**
   * Cache for the whole build, shared by every plugin, where `resolver.memo` is one plugin. Prefix a
   * key with the plugin name unless every plugin wants the same value, and name the node for
   * node-derived work, such as `plugin-ts:imports:${node.operationId}`.
   */
  memo: Memo
}

/**
 * Hooks the driver calls for one plugin while it walks the input: `start`, then every schema, then
 * every operation, then `end`. They never reach the shared hooks bus. Each runs through `withContext`, so
 * `this`, `ctx` and `useKubb()` are the same plugin visit context.
 */
export type PluginVisitHooks<TFactory extends PluginType = PluginType> = {
  'kubb:plugin:visit:start'?(this: PluginVisitContext<TFactory>, ctx: PluginVisitContext<TFactory>): void | Promise<void>
  'kubb:plugin:visit:schema'?(this: PluginVisitContext<TFactory>, node: SchemaNode, ctx: PluginVisitContext<TFactory>): void | Promise<void>
  'kubb:plugin:visit:operation'?(this: PluginVisitContext<TFactory>, node: OperationNode, ctx: PluginVisitContext<TFactory>): void | Promise<void>
  'kubb:plugin:visit:end'?(this: PluginVisitContext<TFactory>, ctx: PluginVisitContext<TFactory>): void | Promise<void>
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
  } & PluginVisitHooks<TFactory>
  /**
   * Runs before `kubb:plugin:setup`. Takes the user's options and returns the resolved options.
   */
  setup?(options: TFactory['options'], kubb: KubbPluginSetupContext<TFactory>): TFactory['resolvedOptions'] | Promise<TFactory['resolvedOptions']>
}

/**
 * The object passed to `defineExtension` with `kind: 'plugin'`.
 */
export type PluginDefinition<TFactory extends PluginType = PluginType> = Pick<Plugin<TFactory>, 'dependencies' | 'enforce'> & {
  meta: ExtensionMeta<TFactory['name']>
  // `this` is declared here, not on `Plugin`, so code that calls `plugin.setup(options, ctx)` directly still type-checks.
  hooks?: Omit<Plugin<TFactory>['hooks'], 'kubb:plugin:setup'> & {
    'kubb:plugin:setup'?(this: KubbPluginSetupContext<TFactory>, ctx: KubbPluginSetupContext<TFactory>): void | Promise<void>
  }
  setup?(
    this: KubbPluginSetupContext<TFactory>,
    options: TFactory['options'],
    kubb: KubbPluginSetupContext<TFactory>,
  ): TFactory['resolvedOptions'] | Promise<TFactory['resolvedOptions']>
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
