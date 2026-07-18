/**
 * Per-node memo shared by every plugin that generates from the same schema or operation node in
 * one generate pass. The driver creates one `NodeCache` per node during the walk and hands the
 * same instance to each plugin's generator context, so work derived purely from the node (its
 * resolved name, imports, parameters) is computed by the first plugin that needs it and reused by
 * the rest instead of being recomputed per plugin.
 *
 * Keys are namespaced by convention (`'plugin-ts:imports'`) so two plugins caching different
 * derivations of the same node never collide.
 *
 * @example Fill on first read, reuse afterwards
 * ```ts
 * const imports = ctx.cache.getOrSet('plugin-ts:imports', () => ctx.resolver.imports({ node, root, output }))
 * ```
 */
export type NodeCache = {
  /**
   * Returns the value stored under `key`, or `undefined` when nothing is stored yet.
   */
  get<TValue>(key: string): TValue | undefined
  /**
   * Stores `value` under `key`, overwriting any previous value, and returns it.
   */
  set<TValue>(key: string, value: TValue): TValue
  /**
   * Returns the value stored under `key`, computing and storing it with `factory` on the first
   * call. Later calls with the same key return the stored value without running `factory` again.
   */
  getOrSet<TValue>(key: string, factory: () => TValue): TValue
}

/**
 * Builds an empty {@link NodeCache} backed by a plain `Map`. Called once per node in the generate
 * walk.
 */
export function createNodeCache(): NodeCache {
  const store = new Map<string, unknown>()

  return {
    get<TValue>(key: string): TValue | undefined {
      return store.get(key) as TValue | undefined
    },
    set<TValue>(key: string, value: TValue): TValue {
      store.set(key, value)
      return value
    },
    getOrSet<TValue>(key: string, factory: () => TValue): TValue {
      if (store.has(key)) return store.get(key) as TValue

      const value = factory()
      store.set(key, value)
      return value
    },
  }
}
