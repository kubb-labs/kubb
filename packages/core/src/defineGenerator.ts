import type { AsyncEventEmitter, PossiblePromise } from '@internals/utils'
import type { FileNode, InputMeta, OperationNode, SchemaNode, Visitor } from '@kubb/ast'
import type { Adapter } from './createAdapter.ts'
import type { RendererFactory } from './createRenderer.ts'
import type { KubbHooks } from './types.ts'
import type { KubbDriver } from './KubbDriver.ts'
import type { Plugin, PluginFactoryOptions } from './definePlugin.ts'
import type { Resolver } from './defineResolver.ts'
import type { Config } from './types.ts'

/**
 * Context object passed to generator `schema`, `operation`, and `operations` methods.
 *
 * The adapter is always defined (guaranteed by `runPluginAstHooks`) so no runtime checks
 * are needed. `ctx.options` carries resolved per-node options after exclude/include/override
 * filtering for individual schema/operation calls, or plugin-level options for operations.
 */
export type GeneratorContext<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  /**
   * The resolved Kubb config for this build, including `root`, `input`, `output`, and the
   * full plugin list.
   */
  config: Config
  /**
   * Absolute path to the current plugin's output directory.
   */
  root: string
  /**
   * The driver running this build. Most generators never need it. Prefer the scoped helpers
   * on this context (`getPlugin`, `getResolver`, `upsertFile`) over reaching into the driver.
   */
  driver: KubbDriver
  /**
   * Get a plugin by name, typed via `Kubb.PluginRegistry` when registered.
   */
  getPlugin<TName extends keyof Kubb.PluginRegistry>(name: TName): Plugin<Kubb.PluginRegistry[TName]> | undefined
  getPlugin(name: string): Plugin | undefined
  /**
   * Get a plugin by name, throws an error if not found.
   */
  requirePlugin<TName extends keyof Kubb.PluginRegistry>(name: TName): Plugin<Kubb.PluginRegistry[TName]>
  requirePlugin(name: string): Plugin
  /**
   * Get a resolver by plugin name, typed via `Kubb.PluginRegistry` when registered.
   */
  getResolver<TName extends keyof Kubb.PluginRegistry>(name: TName): Kubb.PluginRegistry[TName]['resolver']
  getResolver(name: string): Resolver
  /**
   * Add files only if they don't exist.
   */
  addFile: (...file: Array<FileNode>) => Promise<void>
  /**
   * Merge sources into the same output file.
   */
  upsertFile: (...file: Array<FileNode>) => Promise<void>
  /**
   * The build's event bus. Emit or listen to any `KubbHooks` event, for example to react to
   * `kubb:build:end` from inside a generator.
   */
  hooks: AsyncEventEmitter<KubbHooks>
  /**
   * The current plugin instance.
   */
  plugin: Plugin<TOptions>
  /**
   * The current plugin's resolver. It decides what every generated symbol and file path is
   * called. Kubb picks a `setResolver` registration first, then the plugin's static
   * `resolver`, then the built-in default.
   *
   * @example Resolve a type name
   * `ctx.resolver.default('pet', 'type') // 'Pet'`
   *
   * @example Resolve an output file
   * `ctx.resolver.resolveFile({ name: 'pet', extname: '.ts' }, { root, output })`
   */
  resolver: TOptions['resolver']
  /**
   * The AST visitor this plugin registered through `setTransformer` during
   * `kubb:plugin:setup`, or `undefined` when it never registered one. The driver already
   * applies the visitor to every schema and operation node before a generator sees it, so
   * read it here only to inspect or re-run the transformation.
   */
  transformer: Visitor | undefined
  /**
   * Report a warning. Collected as a `warning` diagnostic attributed to the current
   * plugin. It surfaces in the run summary but does not fail the build. For a structured
   * diagnostic with a code and source location, use `Diagnostics.report` or throw a
   * `Diagnostics.Error` directly.
   */
  warn: (message: string) => void
  /**
   * Report an error. Collected as an `error` diagnostic attributed to the current
   * plugin, which fails the build.
   */
  error: (error: string | Error) => void
  /**
   * Report an informational message. Collected as an `info` diagnostic attributed to
   * the current plugin.
   */
  info: (message: string) => void
  /**
   * The configured adapter instance.
   */
  adapter: Adapter
  /**
   * Document metadata from the adapter: title, version, base URL, and pre-computed
   * schema index fields (`circularNames`, `enumNames`).
   */
  meta: InputMeta
  /**
   * Resolved options after exclude/include/override filtering.
   */
  options: TOptions['resolvedOptions']
}

/**
 * Declares a named generator unit that walks the AST and emits files.
 *
 * Each method (`schema`, `operation`, `operations`) is called for the matching node type.
 * Each method returns `TElement | Array<FileNode> | undefined | null`. JSX-based generators require a `renderer` factory.
 * Return `Array<FileNode>` directly or call `ctx.upsertFile()` manually and return `undefined` or `null` to bypass rendering.
 *
 * @note Generators are consumed by plugins and registered via `ctx.addGenerator()` in `kubb:plugin:setup`.
 *
 * @example
 * ```ts
 * import { defineGenerator } from '@kubb/core'
 * import { jsxRenderer } from '@kubb/renderer-jsx'
 *
 * export const typeGenerator = defineGenerator({
 *   name: 'typescript',
 *   renderer: jsxRenderer,
 *   schema(node, ctx) {
 *     const { adapter, resolver, root, options } = ctx
 *     return <File ...><Type node={node} resolver={resolver} /></File>
 *   },
 * })
 * ```
 */
export type Generator<TOptions extends PluginFactoryOptions = PluginFactoryOptions, TElement = unknown> = {
  /**
   * Used in diagnostic messages and debug output.
   */
  name: string
  /**
   * Optional renderer factory that produces a {@link Renderer} for each render cycle.
   *
   * Generators that return renderer elements (e.g. JSX via `@kubb/renderer-jsx`) must set this
   * to the matching renderer factory (e.g. `jsxRenderer` from `@kubb/renderer-jsx`).
   *
   * Generators that only return `Array<FileNode>` or `void` do not need to set this.
   *
   * Leave it unset or set `renderer: null` to opt out of rendering.
   *
   * @example
   * ```ts
   * import { jsxRenderer } from '@kubb/renderer-jsx'
   * export const myGenerator = defineGenerator<PluginTs>({
   *   renderer: jsxRenderer,
   *   schema(node, ctx) { return <File ...>...</File> },
   * })
   * ```
   */
  renderer?: RendererFactory<TElement> | null
  /**
   * Called for each schema node in the AST walk.
   * `ctx` carries the plugin context with `adapter` and `meta` (document metadata),
   * plus `ctx.options` with the per-node resolved options (after exclude/include/override).
   */
  schema?: (node: SchemaNode, ctx: GeneratorContext<TOptions>) => PossiblePromise<TElement | Array<FileNode> | undefined | null>
  /**
   * Called for each operation node in the AST walk.
   * `ctx` carries the plugin context with `adapter` and `meta` (document metadata),
   * plus `ctx.options` with the per-node resolved options (after exclude/include/override).
   */
  operation?: (node: OperationNode, ctx: GeneratorContext<TOptions>) => PossiblePromise<TElement | Array<FileNode> | undefined | null>
  /**
   * Called once after all operations have been walked.
   * `ctx` carries the plugin context with `adapter` and `meta` (document metadata),
   * plus `ctx.options` with the plugin-level options for the batch call.
   */
  operations?: (nodes: Array<OperationNode>, ctx: GeneratorContext<TOptions>) => PossiblePromise<TElement | Array<FileNode> | undefined | null>
}

/**
 * Defines a generator: a unit of work that runs during the plugin's AST walk
 * and produces files. Plugins register generators via `ctx.addGenerator()`
 * inside `kubb:plugin:setup`.
 *
 * The returned object is the input as-is, but with `this` types preserved so
 * `schema`/`operation`/`operations` methods are correctly typed against the
 * plugin's `PluginFactoryOptions`. Renderer elements and `FileNode[]` returns
 * are both handled by the runtime, so pick whichever style fits.
 *
 * @example JSX-based schema generator
 * ```tsx
 * import { defineGenerator } from '@kubb/core'
 * import { jsxRenderer } from '@kubb/renderer-jsx'
 *
 * export const typeGenerator = defineGenerator({
 *   name: 'typescript',
 *   renderer: jsxRenderer,
 *   schema(node, ctx) {
 *     return (
 *       <File path={`${ctx.root}/${node.name}.ts`}>
 *         <Type node={node} resolver={ctx.resolver} />
 *       </File>
 *     )
 *   },
 * })
 * ```
 */
export function defineGenerator<TOptions extends PluginFactoryOptions = PluginFactoryOptions, TElement = unknown>(
  generator: Generator<TOptions, TElement>,
): Generator<TOptions, TElement> {
  return generator
}
