import type { OperationNode, SchemaNode, Visitor } from '@kubb/ast'
import { transform } from '@kubb/ast'

/**
 * Phase 2 of the pipeline. Holds one `Visitor` per plugin, keyed by plugin name.
 *
 * Each plugin's transformer runs in isolation on the original adapter node. `applyTo` is a
 * lookup, not a chain, so plugin A's visitor never sees plugin B's output. When no transformer
 * is registered, `applyTo` returns the original node reference, and the `@kubb/ast` `transform`
 * primitive does the same when its visitor leaves the tree untouched. Callers can compare by
 * identity to detect a no-op.
 *
 * Registration order matches the order setup hooks fire, which the driver has already sorted
 * by `enforce` and dependency edges. The pipeline does not re-order anything.
 */
export class Transform {
  readonly #visitors = new Map<string, Visitor>()

  /**
   * Number of plugins with a registered transformer.
   */
  get size(): number {
    return this.#visitors.size
  }

  /**
   * Records `visitor` as the transformer for `pluginName`. A second call for the same plugin
   * replaces the first.
   */
  register(pluginName: string, visitor: Visitor): void {
    this.#visitors.set(pluginName, visitor)
  }

  /**
   * Looks up the transformer for `pluginName`. The generator context uses this so plugins can
   * read their own visitor through `ctx.transformer`.
   */
  get(pluginName: string): Visitor | undefined {
    return this.#visitors.get(pluginName)
  }

  /**
   * Runs the plugin's transformer on `node`. Returns the original node reference when the
   * plugin has no transformer, so callers can compare by identity to detect a no-op.
   */
  applyTo<TNode extends SchemaNode | OperationNode>(pluginName: string, node: TNode): TNode {
    const visitor = this.#visitors.get(pluginName)
    if (!visitor) return node

    return transform(node, visitor) as TNode
  }

  /**
   * Clears every registration. Called from the driver's `dispose()` so visitors do not leak
   * across builds.
   */
  dispose(): void {
    this.#visitors.clear()
  }
}
