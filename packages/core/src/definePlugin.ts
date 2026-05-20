import { extname } from 'node:path'
import type { FileNode, HttpMethod, InputMeta, UserFileNode, Visitor } from '@kubb/ast'
import type { RendererFactory } from './createRenderer.ts'
import type { Generator } from './defineGenerator.ts'
import type { Resolver } from './defineResolver.ts'
import type { Config, KubbHooks } from './types.ts'

/**
 * Safely extracts a type from a registry, returning `{}` if the key doesn't exist.
 * Enables optional interface augmentation for `Kubb.ConfigOptionsRegistry` and `Kubb.PluginOptionsRegistry`
 * without requiring changes to core.
 *
 * @internal
 */
type ExtractRegistryKey<T, K extends PropertyKey> = K extends keyof T ? T[K] : {}

/**
 * Output configuration for generated files.
 */
export type Output<_TOptions = unknown> = {
  /**
   * Output folder or file path for generated code.
   */
  path: string
  /**
   * Text or function prepended to every generated file.
   * When a function, receives the document metadata and returns a string.
   */
  banner?: string | ((meta?: InputMeta) => string)
  /**
   * Text or function appended to every generated file.
   * When a function, receives the document metadata and returns a string.
   */
  footer?: string | ((meta?: InputMeta) => string)
  /**
   * Whether to override existing external files if they already exist.
   * @default false
   */
  override?: boolean
} & ExtractRegistryKey<Kubb.PluginOptionsRegistry, 'output'>

export type Group = {
  /**
   * How to group files into subdirectories.
   * - `'tag'` — group by OpenAPI tags
   * - `'path'` — group by OpenAPI paths
   */
  type: 'tag' | 'path'
  /**
   * Function that returns the subdirectory name for a group value.
   * Defaults to `${camelCase(group)}Controller` for tags, first path segment for paths.
   */
  name?: (context: { group: string }) => string
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
   * Filter by HTTP method: `'get'`, `'post'`, `'put'`, `'delete'`, `'patch'`, `'head'`, `'options'`.
   */
  type: 'method'
  /**
   * HTTP method to match (case-insensitive when using string, or regex for dynamic matching).
   */
  pattern: HttpMethod | RegExp
}
// TODO implement as alternative for ByMethod
// type ByMethods = {
//   type: 'methods'
//   pattern: Array<HttpMethod>
// }

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
 * A pattern filter that prevents matching nodes from being generated.
 *
 * Use to skip code generation for specific operations or schemas. For example, exclude deprecated endpoints
 * or internal-only schemas. Can filter by tag, operationId, path, HTTP method, content type, or schema name.
 *
 * @example
 * ```ts
 * exclude: [
 *   { type: 'tag', pattern: 'internal' },          // skip "internal" tag
 *   { type: 'path', pattern: /^\/admin/ },          // skip all /admin endpoints
 *   { type: 'operationId', pattern: 'deprecated_*' }  // skip operationIds matching pattern
 * ]
 * ```
 */
export type Exclude = ByTag | ByOperationId | ByPath | ByMethod | ByContentType | BySchemaName

/**
 * A pattern filter that restricts generation to only matching nodes.
 *
 * Use to generate code for a subset of operations or schemas. For example, only generate for a specific service
 * tag or only for "production" endpoints. Can filter by tag, operationId, path, HTTP method, content type, or schema name.
 *
 * @example
 * ```ts
 * include: [
 *   { type: 'tag', pattern: 'public' },        // generate only "public" tag
 *   { type: 'path', pattern: /^\/api\/v1/ },   // generate only v1 endpoints
 * ]
 * ```
 */
export type Include = ByTag | ByOperationId | ByPath | ByMethod | ByContentType | BySchemaName

/**
 * A pattern filter paired with partial option overrides applied when the pattern matches.
 *
 * Use to customize generation for specific operations or schemas. For example, apply different output paths
 * for different tags, or use custom resolver functions per operation. Can filter by tag, operationId, path,
 * HTTP method, schema name, or content type.
 *
 * @example
 * ```ts
 * override: [
 *   {
 *     type: 'tag',
 *     pattern: 'admin',
 *     options: { output: { path: './src/gen/admin' } }  // admin APIs go to separate folder
 *   },
 *   {
 *     type: 'operationId',
 *     pattern: 'listPets',
 *     options: { exclude: true }  // skip this specific operation
 *   }
 * ]
 * ```
 */
export type Override<TOptions> = (ByTag | ByOperationId | ByPath | ByMethod | BySchemaName | ByContentType) & {
  //TODO should be options: Omit<Partial<TOptions>, 'override'>
  options: Partial<TOptions>
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
   * Define with `defineResolver` and export alongside the plugin.
   */
  TResolver extends Resolver = Resolver,
> = {
  name: TName
  options: TOptions
  resolvedOptions: TResolvedOptions
  resolver: TResolver
}

/**
 * Context for hook-style plugin `kubb:plugin:setup` handler.
 * Provides methods to register generators, configure resolvers, transformers, and renderers.
 */
export type KubbPluginSetupContext<TFactory extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * Register a generator dynamically. Generators fire during the AST walk (schema/operation/operations)
   * just like generators declared statically on `createPlugin`.
   */
  addGenerator<TElement = unknown>(generator: Generator<TFactory, TElement>): void
  /**
   * Set or override the resolver for this plugin.
   * The resolver controls file naming and path resolution.
   */
  setResolver(resolver: Partial<TFactory['resolver']>): void
  /**
   * Set the AST transformer to pre-process nodes before they reach generators.
   */
  setTransformer(visitor: Visitor): void
  /**
   * Set the renderer factory to process JSX elements from generators.
   */
  setRenderer(renderer: RendererFactory): void
  /**
   * Set resolved options merged into the normalized plugin's `options`.
   * Call this in `kubb:plugin:setup` to provide options generators need.
   */
  setOptions(options: TFactory['resolvedOptions']): void
  /**
   * Inject a raw file into the build output, bypassing the generation pipeline.
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
 * A plugin object produced by `definePlugin`.
 * Instead of flat lifecycle methods, it groups all handlers under a `hooks:` property
 * (matching Astro's integration naming convention).
 *
 * @template TFactory - The plugin's `PluginFactoryOptions` type.
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
   * - `'pre'`  — runs before all normal plugins.
   * - `'post'` — runs after all normal plugins.
   * - `undefined` (default) — runs in declaration order among normal plugins.
   *
   * Dependency constraints always take precedence over `enforce`.
   */
  enforce?: 'pre' | 'post'
  /**
   * The options passed by the user when calling the plugin factory.
   */
  options?: TFactory['options']
  /**
   * Lifecycle event handlers for this plugin.
   * Any event from the global `KubbHooks` map can be subscribed to here.
   */
  hooks: {
    [K in keyof KubbHooks as K extends 'kubb:plugin:setup' ? never : K]?: (...args: KubbHooks[K]) => void | Promise<void>
  } & {
    'kubb:plugin:setup'?(ctx: KubbPluginSetupContext<TFactory>): void | Promise<void>
  }
}

/**
 * Normalized plugin after setup, with runtime fields populated.
 * For internal use only — plugins use the public `Plugin` type externally.
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
  transformer?: Visitor
  renderer?: RendererFactory
  generators?: Array<Generator>
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
 * Wraps a factory function and returns a typed `Plugin` with lifecycle handlers grouped under `hooks`.
 *
 * Handlers live in a single `hooks` object (inspired by Astro integrations).
 * All lifecycle events from `KubbHooks` are available for subscription.
 *
 * @note For real plugins, use a `PluginFactoryOptions` type parameter to get type-safe context in `kubb:plugin:setup`.
 * Plugin names should follow the convention `plugin-<feature>` (e.g., `plugin-react-query`, `plugin-zod`).
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

/**
 * Returns `'single'` when `fileOrFolder` has a file extension, `'split'` otherwise.
 * Used to determine whether an output path targets a single file or a directory.
 */
export function getMode(fileOrFolder: string | undefined | null): 'single' | 'split' {
  if (!fileOrFolder) return 'split'
  return extname(fileOrFolder) ? 'single' : 'split'
}
