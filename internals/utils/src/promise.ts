/** A value that may already be resolved or still pending.
 *
 * @example
 * ```ts
 * function load(id: string): PossiblePromise<string> {
 *   return cache.get(id) ?? fetchRemote(id)
 * }
 * ```
 */
export type PossiblePromise<T> = Promise<T> | T

export type Store<TKey, TValue> = {
  has(key: TKey): boolean
  get(key: TKey): TValue | undefined
  set(key: TKey, value: TValue): unknown
}

/**
 * Returns the value cached under `key` in `store`, computing and storing it on the first call.
 * Pass a `WeakMap` for object keys, so an entry goes away with its key, or a `Map` for primitive
 * keys. A cached `null` or `undefined` counts as a hit, so `compute` runs once per key.
 *
 * @example
 * `const refs = memo(refCache, node, () => collectRefs(node))`
 */
export function memo<TKey, TValue>(store: Store<TKey, TValue>, key: TKey, compute: () => TValue): TValue {
  const cached = store.get(key)
  if (cached !== undefined || store.has(key)) return cached as TValue
  const value = compute()
  store.set(key, value)
  return value
}

class BoundedStore<TKey, TValue> implements Store<TKey, TValue> {
  readonly #entry = new Map<TKey, TValue>()
  readonly #max: number

  constructor(max: number) {
    this.#max = max
  }

  has(key: TKey): boolean {
    return this.#entry.has(key)
  }

  get(key: TKey): TValue | undefined {
    return this.#entry.get(key)
  }

  set(key: TKey, value: TValue): void {
    if (this.#entry.size >= this.#max) this.#entry.clear()
    this.#entry.set(key, value)
  }
}

class LastEntryStore<TKey, TValue> extends BoundedStore<TKey, TValue> {
  constructor() {
    super(1)
  }

  // A key equal to the stored one but a different object, such as a copy of a string, replaces the
  // stored key, so the next lookup is an identity hit instead of a full comparison.
  #touch(key: TKey): boolean {
    if (!super.has(key)) return false
    this.set(key, super.get(key) as TValue)
    return true
  }

  override has(key: TKey): boolean {
    return this.#touch(key)
  }

  override get(key: TKey): TValue | undefined {
    return this.#touch(key) ? super.get(key) : undefined
  }
}

/**
 * Creates a store for `memo`. With no options it is a `Map`. Each option changes one thing:
 *
 * - `weak` holds the keys weakly, in a `WeakMap`, so an entry goes away with its key.
 * - `max` bounds the store: it empties itself before the entry that would pass `max`, which keeps a
 *   cache in a long-running process from growing without end. `max: 1` keeps only the last entry.
 *
 * @example
 * `const patterns = memo.create<string, RegExp>()`
 *
 * @example Freed with its key
 * `const refs = memo.create<SchemaNode, Array<string>>({ weak: true })`
 *
 * @example Bounded
 * `const names = memo.create<string, string>({ max: 100_000 })`
 *
 * @example Many values per key
 * ```ts
 * const filesByPlugin = memo.create<string, Array<string>>()
 * memo(filesByPlugin, 'plugin-ts', () => []).push('models.ts')
 * ```
 */
function createStore<TKey, TValue>(options?: { weak?: false; max?: undefined }): Map<TKey, TValue>
function createStore<TKey extends WeakKey, TValue>(options: { weak: true; max?: undefined }): WeakMap<TKey, TValue>
function createStore<TKey, TValue>(options: { max: number; weak?: false }): Store<TKey, TValue>
function createStore<TKey, TValue>({ weak, max }: { weak?: boolean; max?: number } = {}): Store<TKey, TValue> {
  if (weak) return new WeakMap<WeakKey, TValue>() as Store<TKey, TValue>
  if (max === undefined) return new Map<TKey, TValue>()
  if (max !== 1) return new BoundedStore<TKey, TValue>(max)
  return new LastEntryStore<TKey, TValue>()
}

memo.create = createStore

export type ParallelOptions<TItem> = {
  /**
   * Items to work through, handed out in order.
   */
  items: ReadonlyArray<TItem>
  /**
   * How many items may be in flight at once.
   */
  limit: number
  /**
   * Runs once per item, with the item's position so a caller can report progress.
   */
  run(item: TItem, index: number): Promise<void>
}

/**
 * Runs `run` over every item with at most `limit` in flight. Workers share one iterator, so each
 * takes the next item the moment it frees up instead of waiting for a batch to drain. The first
 * rejection rejects the call, and the other workers start no new item after it.
 *
 * @example
 * ```ts
 * await inParallel({ items: files, limit: 50, run: (file) => storage.writeItem(file.path, file.source) })
 * ```
 */
export async function inParallel<TItem>({ items, limit, run }: ParallelOptions<TItem>): Promise<void> {
  const queue = items.entries()
  let failed = false

  const worker = async (): Promise<void> => {
    for (const [index, item] of queue) {
      if (failed) return
      await run(item, index).catch((error: unknown) => {
        failed = true
        throw error
      })
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
}
