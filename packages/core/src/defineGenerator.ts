import type { PossiblePromise } from '@internals/utils'
import type { FileNode, OperationNode, SchemaNode } from '@kubb/ast'
import type { RendererFactory } from './createRenderer.ts'
import type { GeneratorContext, PluginFactoryOptions } from './types.ts'

export type { GeneratorContext } from './types.ts'

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
