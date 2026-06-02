import type { OperationNode, SchemaNode, Visitor } from '@kubb/ast'
import { transform } from '@kubb/ast'

/**
 * Phase 2 of the pipeline. Holds one `Visitor` per plugin, keyed by plugin name.
 *
 * Each plugin's transformer runs in isolation on the original adapter node — `applyTo` is a
 * lookup, not a chain, so plugin A's visitor never sees plugin B's output. Identity is
 * preserved: when no transformer is registered, the same node reference is returned, and the
 * `@kubb/ast` `transform` primitive returns the original reference when its visitor leaves the
 * tree untouched.
 *
 * Registration order matches the order setup hooks fire, which the driver has already sorted
 * by `enforce` and dependency edges. The pipeline does not re-order anything.
 */
export class Transform {
  readonly #visitors = new Map<string, Visitor>()

  get size(): number {
    return this.#visitors.size
  }

  /**
   * Records `visitor` as the transformer for `pluginName`. The last registration wins.
   */
  register(pluginName: string, visitor: Visitor): void {
    this.#visitors.set(pluginName, visitor)
  }

  /**
   * Returns `true` when a transformer is registered for `pluginName`.
   */
  has(pluginName: string): boolean {
    return this.#visitors.has(pluginName)
  }

  /**
   * Returns the transformer registered for `pluginName`, or `undefined` when none is.
   */
  get(pluginName: string): Visitor | undefined {
    return this.#visitors.get(pluginName)
  }

  /**
   * Applies the plugin's transformer to `node`. Returns the original node reference when no
   * transformer is registered, so callers can compare by identity to detect a no-op.
   */
  applyTo<TNode extends SchemaNode | OperationNode>(pluginName: string, node: TNode): TNode {
    const visitor = this.#visitors.get(pluginName)
    if (!visitor) return node
    return transform(node, visitor) as TNode
  }

  dispose(): void {
    this.#visitors.clear()
  }
}
