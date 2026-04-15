import type { PossiblePromise } from '@internals/utils'
import type { FileNode, OperationNode, SchemaNode } from '@kubb/ast/types'
import type { RendererFactory } from './createRenderer.ts'
import type { GeneratorContext, PluginFactoryOptions } from './types.ts'

export type { GeneratorContext } from './types.ts'

type GeneratorMethodContext<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = GeneratorContext<TOptions> & GeneratorContext<TOptions>['options']
/**
 * Compatibility parameter shape for generator handlers.
 * Merges runtime generator context fields (`adapter`, `resolver`, `plugin`, etc.)
 * with resolved plugin option fields so both legacy `options.*` and new `ctx.options.*`
 * access patterns can coexist during migration.
 */

/**
 * A generator is a named object with optional `schema`, `operation`, and `operations`
 * methods. Each method receives a parameter-based context (`ctx`) as the second argument.
 *
 * Generators that return renderer elements (e.g. JSX) must declare a `renderer`
 * factory so that core knows how to process the output without coupling core
 * to any specific renderer package.
 *
 * Return a renderer element, an array of `FileNode`, or `void` to handle file
 * writing manually via `ctx.upsertFile`.
 *
 * @example
 * ```ts
 * import { jsxRenderer } from '@kubb/renderer-jsx'
 *
 * export const typeGenerator = defineGenerator<PluginTs>({
 *   name: 'typescript',
 *   renderer: jsxRenderer,
 *   schema(node, ctx) {
 *     const { adapter, resolver, root, options } = ctx
 *     return <File ...><Type node={node} resolver={resolver} /></File>
 *   },
 *   operation(node, ctx) {
 *     const { options } = ctx
 *     return <File ...><OperationType node={node} /></File>
 *   },
 * })
 * ```
 */
export type Generator<TOptions extends PluginFactoryOptions = PluginFactoryOptions, TElement = unknown> = {
  /** Used in diagnostic messages and debug output. */
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
   * Supports both `schema(node, ctx)` and legacy `schema(node, options)` usage.
   * `this` is set to `GeneratorContext` and the second argument includes
   * both context fields and resolved option fields for compatibility.
   */
  schema?: (
    node: SchemaNode,
    ctx: GeneratorMethodContext<TOptions>,
  ) => PossiblePromise<TElement | Array<FileNode> | void>
  /**
   * Called for each operation node in the AST walk.
   * Supports both `operation(node, ctx)` and legacy `operation(node, options)` usage.
   * `this` is set to `GeneratorContext` and the second argument includes
   * both context fields and resolved option fields for compatibility.
   */
  operation?: (
    node: OperationNode,
    ctx: GeneratorMethodContext<TOptions>,
  ) => PossiblePromise<TElement | Array<FileNode> | void>
  /**
   * Called once after all operations have been walked.
   * Supports both `operations(nodes, ctx)` and legacy `operations(nodes, options)` usage.
   * `this` is set to `GeneratorContext` and the second argument includes
   * both context fields and resolved option fields for compatibility.
   */
  operations?: (
    nodes: Array<OperationNode>,
    ctx: GeneratorMethodContext<TOptions>,
  ) => PossiblePromise<TElement | Array<FileNode> | void>
} & ThisType<GeneratorContext<TOptions>>

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
