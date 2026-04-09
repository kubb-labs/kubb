import type { PossiblePromise } from '@internals/utils'
import type { FileNode, OperationNode, SchemaNode } from '@kubb/ast/types'
import type { RendererFactory } from './createRenderer.ts'
import { applyHookResult } from './renderNode.ts'
import type { GeneratorContext, PluginFactoryOptions } from './types.ts'

export type { GeneratorContext } from './types.ts'

/**
 * A generator is a named object with optional `schema`, `operation`, and `operations`
 * methods. Each method is called with `this = PluginContext` of the parent plugin,
 * giving full access to `this.config`, `this.resolver`, `this.adapter`,
 * `this.driver`, etc.
 *
 * Generators that return renderer elements (e.g. JSX) must declare a `renderer`
 * factory so that core knows how to process the output without coupling core
 * to any specific renderer package.
 *
 * Return a renderer element, an array of `FileNode`, or `void` to handle file
 * writing manually via `this.upsertFile`.
 *
 * @example
 * ```ts
 * import { jsxRenderer } from '@kubb/renderer-jsx'
 *
 * export const typeGenerator = defineGenerator<PluginTs>({
 *   name: 'typescript',
 *   renderer: jsxRenderer,
 *   schema(node, options) {
 *     const { adapter, resolver, root } = this
 *     return <File ...><Type node={node} resolver={resolver} /></File>
 *   },
 *   operation(node, options) {
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
   *   schema(node, options) { return <File ...>...</File> },
   * })
   * ```
   */
  renderer?: RendererFactory<TElement> | null
  /**
   * Called for each schema node in the AST walk.
   * `this` is the parent plugin's context with `adapter` and `inputNode` guaranteed present.
   * `options` contains the per-node resolved options (after exclude/include/override).
   */
  schema?: (this: GeneratorContext<TOptions>, node: SchemaNode, options: TOptions['resolvedOptions']) => PossiblePromise<TElement | Array<FileNode> | void>
  /**
   * Called for each operation node in the AST walk.
   * `this` is the parent plugin's context with `adapter` and `inputNode` guaranteed present.
   */
  operation?: (
    this: GeneratorContext<TOptions>,
    node: OperationNode,
    options: TOptions['resolvedOptions'],
  ) => PossiblePromise<TElement | Array<FileNode> | void>
  /**
   * Called once after all operations have been walked.
   * `this` is the parent plugin's context with `adapter` and `inputNode` guaranteed present.
   */
  operations?: (
    this: GeneratorContext<TOptions>,
    nodes: Array<OperationNode>,
    options: TOptions['resolvedOptions'],
  ) => PossiblePromise<TElement | Array<FileNode> | void>
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

/**
 * Merges an array of generators into a single generator.
 *
 * The merged generator's `schema`, `operation`, and `operations` methods run
 * the corresponding method from each input generator in sequence, applying each
 * result via `applyHookResult` with the generator's declared `renderer`. This
 * eliminates the need to write the loop manually in each plugin.
 *
 * @param generators - Array of generators to merge into a single generator.
 *
 * @example
 * ```ts
 * const merged = mergeGenerators(generators)
 *
 * return {
 *   name: pluginName,
 *   schema: merged.schema,
 *   operation: merged.operation,
 *   operations: merged.operations,
 * }
 * ```
 */
export function mergeGenerators<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(
  generators: Array<Generator<TOptions, any>>,
): Generator<TOptions> {
  /**
   * Resolves the effective renderer for a generator following the precedence chain:
   * `generator.renderer` → `plugin.renderer` → `config.renderer` → `undefined` (raw FileNode[] mode).
   * - `null` → explicitly no renderer (ignores all fallbacks)
   * - `undefined` → fall through to plugin, then config renderer
   * - `RendererFactory` → use the generator's own renderer
   */
  function resolveRenderer(this: GeneratorContext<TOptions>, gen: Generator<TOptions, any>): RendererFactory | undefined {
    return gen.renderer === null ? undefined : (gen.renderer ?? this.plugin.renderer ?? this.config.renderer)
  }

  return {
    name: generators.length > 0 ? generators.map((g) => g.name).join('+') : 'merged',
    async schema(node, options) {
      for (const gen of generators) {
        if (!gen.schema) continue
        const result = await gen.schema.call(this, node, options)
        await applyHookResult(result, this.driver, resolveRenderer.call(this, gen))
      }
    },
    async operation(node, options) {
      for (const gen of generators) {
        if (!gen.operation) continue
        const result = await gen.operation.call(this, node, options)
        await applyHookResult(result, this.driver, resolveRenderer.call(this, gen))
      }
    },
    async operations(nodes, options) {
      for (const gen of generators) {
        if (!gen.operations) continue
        const result = await gen.operations.call(this, nodes, options)
        await applyHookResult(result, this.driver, resolveRenderer.call(this, gen))
      }
    },
  }
}
