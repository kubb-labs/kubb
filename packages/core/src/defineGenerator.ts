import type { AsyncEventEmitter, PossiblePromise } from '@internals/utils'
import type { FileNode, InputNode, OperationNode, SchemaNode, Visitor } from '@kubb/ast'
import type { Adapter } from './createAdapter.ts'
import type { RendererFactory } from './createRenderer.ts'
import type { KubbHooks } from './types.ts'
import type { PluginDriver } from './PluginDriver.ts'
import type { Plugin, PluginFactoryOptions } from './definePlugin.ts'
import type { Resolver } from './defineResolver.ts'
import type { Config, DevtoolsOptions } from './types.ts'

/**
 * Context object passed to generator `schema`, `operation`, and `operations` methods.
 *
 * The adapter is always defined (guaranteed by `runPluginAstHooks`) so no runtime checks
 * are needed. `ctx.options` carries resolved per-node options after exclude/include/override
 * filtering for individual schema/operation calls, or plugin-level options for operations.
 */
export type GeneratorContext<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  config: Config
  /**
   * Absolute path to the current plugin's output directory.
   */
  root: string
  /**
   * Determine output mode based on the output config.
   * Returns `'single'` when `output.path` is a file, `'split'` for a directory.
   */
  getMode: (output: { path: string }) => 'single' | 'split'
  driver: PluginDriver
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
  hooks: AsyncEventEmitter<KubbHooks>
  /**
   * The current plugin instance.
   */
  plugin: Plugin<TOptions>
  /**
   * The current plugin's resolver.
   */
  resolver: TOptions['resolver']
  /**
   * The current plugin's transformer.
   */
  transformer: Visitor | undefined
  /**
   * Emit a warning.
   */
  warn: (message: string) => void
  /**
   * Emit an error.
   */
  error: (error: string | Error) => void
  /**
   * Emit an info message.
   */
  info: (message: string) => void
  /**
   * Open the current input node in Kubb Studio.
   */
  openInStudio: (options?: DevtoolsOptions) => Promise<void>
  /**
   * The configured adapter instance.
   */
  adapter: Adapter
  /**
   * The universal `InputNode` produced by the adapter.
   */
  inputNode: InputNode
  /**
   * Resolved options after exclude/include/override filtering.
   */
  options: TOptions['resolvedOptions']
}

/**
 * Declares a named generator unit that walks the AST and emits files.
 *
 * Each method (`schema`, `operation`, `operations`) is called for the matching node type.
 * Each method returns `TElement | Array<FileNode> | void`. JSX-based generators require a `renderer` factory.
 * Return `Array<FileNode>` directly or call `ctx.upsertFile()` manually and return `void` to bypass rendering.
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
   * Set `renderer: null` to explicitly opt out of rendering even when the parent plugin
   * declares a `renderer` (overrides the plugin-level fallback).
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
   * `ctx` carries the plugin context with `adapter` and `inputNode` guaranteed present,
   * plus `ctx.options` with the per-node resolved options (after exclude/include/override).
   */
  schema?: (node: SchemaNode, ctx: GeneratorContext<TOptions>) => PossiblePromise<TElement | Array<FileNode> | void>
  /**
   * Called for each operation node in the AST walk.
   * `ctx` carries the plugin context with `adapter` and `inputNode` guaranteed present,
   * plus `ctx.options` with the per-node resolved options (after exclude/include/override).
   */
  operation?: (node: OperationNode, ctx: GeneratorContext<TOptions>) => PossiblePromise<TElement | Array<FileNode> | void>
  /**
   * Called once after all operations have been walked.
   * `ctx` carries the plugin context with `adapter` and `inputNode` guaranteed present,
   * plus `ctx.options` with the plugin-level options for the batch call.
   */
  operations?: (nodes: Array<OperationNode>, ctx: GeneratorContext<TOptions>) => PossiblePromise<TElement | Array<FileNode> | void>
}

/**
 * Defines a generator. Returns the object as-is with correct `this` typings.
 * `applyHookResult` handles renderer elements and `File[]` uniformly using
 * the generator's declared `renderer` factory.
 */
export function defineGenerator<TOptions extends PluginFactoryOptions = PluginFactoryOptions, TElement = unknown>(
  generator: Generator<TOptions, TElement>,
): Generator<TOptions, TElement> {
  return generator
}
