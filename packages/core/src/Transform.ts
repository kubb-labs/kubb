import type { Macro, OperationNode, SchemaNode, Visitor } from '@kubb/ast'
import { composeMacros, transform } from '@kubb/ast'

/**
 * Holds an ordered list of macros per plugin, keyed by plugin name. Each plugin's macros run in
 * isolation on the original adapter node and are composed into a single `Visitor` that the
 * `@kubb/ast` `transform` primitive applies. `applyTo` is a per-plugin lookup, not a cross-plugin
 * chain, so plugin A's macros never see plugin B's output. When a plugin has no macros, `applyTo`
 * returns the original node reference, and `transform` does the same when the composed visitor
 * leaves the tree untouched, so callers can detect a no-op by identity.
 *
 * Registration order matches the order setup hooks fire, which the driver has already sorted by
 * `enforce` and dependency edges. The registry preserves that order; macro `enforce` only reorders
 * within a single plugin's list.
 */
export class Transform {
  readonly #macros = new Map<string, Array<Macro>>()
  // Composed visitor per plugin, rebuilt lazily after the macro list changes.
  readonly #composed = new Map<string, Visitor>()
  // Memoized results per plugin. Repeated `applyTo` calls return the same node identity, so
  // downstream WeakMap caches keyed by node (the resolver's resolveOptions memo) hit when the
  // driver resolves a node a second time, and a stateful macro runs once per node.
  readonly #memo = new Map<string, WeakMap<SchemaNode | OperationNode, SchemaNode | OperationNode>>()

  /**
   * Number of plugins with at least one registered macro.
   */
  get size(): number {
    return this.#macros.size
  }

  /**
   * Appends `macro` to the plugin's list, after any macros already registered.
   */
  add(pluginName: string, macro: Macro): void {
    const list = this.#macros.get(pluginName)
    if (list) list.push(macro)
    else this.#macros.set(pluginName, [macro])
    this.#invalidate(pluginName)
  }

  /**
   * Replaces the plugin's macro list with `macros`.
   */
  set(pluginName: string, macros: ReadonlyArray<Macro>): void {
    this.#macros.set(pluginName, [...macros])
    this.#invalidate(pluginName)
  }

  /**
   * Looks up the composed visitor for `pluginName`, or `undefined` when the plugin has no macros.
   */
  get(pluginName: string): Visitor | undefined {
    return this.#visitorFor(pluginName)
  }

  /**
   * Runs the plugin's macros on `node`. Returns the original node reference when the plugin has no
   * macros, so callers can compare by identity to detect a no-op.
   */
  applyTo<TNode extends SchemaNode | OperationNode>(pluginName: string, node: TNode): TNode {
    const visitor = this.#visitorFor(pluginName)
    if (!visitor) return node

    let memo = this.#memo.get(pluginName)
    if (!memo) {
      memo = new WeakMap()
      this.#memo.set(pluginName, memo)
    }

    const cached = memo.get(node)
    if (cached) return cached as TNode

    const result = transform(node, visitor) as TNode
    memo.set(node, result)
    return result
  }

  /**
   * Clears every registration. Called from the driver's `dispose()` so macros do not leak across
   * builds.
   */
  dispose(): void {
    this.#macros.clear()
    this.#composed.clear()
    this.#memo.clear()
  }

  #invalidate(pluginName: string): void {
    this.#composed.delete(pluginName)
    this.#memo.delete(pluginName)
  }

  #visitorFor(pluginName: string): Visitor | undefined {
    const macros = this.#macros.get(pluginName)
    if (!macros || macros.length === 0) return undefined

    let composed = this.#composed.get(pluginName)
    if (!composed) {
      composed = composeMacros(macros)
      this.#composed.set(pluginName, composed)
    }
    return composed
  }
}
