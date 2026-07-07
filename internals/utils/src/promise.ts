import { toError } from './errors.ts'

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

/** Returns `true` when `result` is a thenable `Promise`.
 *
 * @example
 * ```ts
 * isPromise(Promise.resolve(1)) // true
 * isPromise(42)                 // false
 * ```
 */
export function isPromise<T>(result: PossiblePromise<T>): result is Promise<T> {
  return result !== null && result !== undefined && typeof (result as Record<string, unknown>)['then'] === 'function'
}

type Store<TKey, TValue> = {
  has(key: TKey): boolean
  get(key: TKey): TValue | undefined
  set(key: TKey, value: TValue): unknown
}

/**
 * Wraps `factory` with a keyed cache backed by the provided store.
 *
 * Pass a `WeakMap` for object keys (results are GC-eligible when the key is
 * collected) or a `Map` for primitive keys. For multi-argument functions,
 * nest two `memoize` calls — the outer keyed by the first argument, the
 * inner (created once per outer miss) keyed by the second.
 *
 * Because the cache is owned by the caller, it can be shared, inspected, or
 * cleared independently of the memoized function.
 *
 * @example Single WeakMap key
 * ```ts
 * const cache = new WeakMap<SchemaNode, Set<string>>()
 * const getRefs = memoize(cache, (node) => collectRefs(node))
 * ```
 *
 * @example Single Map key (primitive)
 * ```ts
 * const cache = new Map<string, Resolver>()
 * const getResolver = memoize(cache, (name) => buildResolver(name))
 * ```
 *
 * @example Two-level (object + primitive)
 * ```ts
 * const outer = new WeakMap<Params[], Map<string, Params[]>>()
 * const fn = memoize(outer, (params) => memoize(new Map(), (key) => transform(params, key)))
 * fn(params)('camelcase')
 * ```
 */
export function memoize<TKey, TValue>(store: Store<TKey, TValue>, factory: (key: TKey) => TValue): (key: TKey) => TValue {
  return (key: TKey): TValue => {
    if (store.has(key)) return store.get(key)!
    const value = factory(key)
    store.set(key, value)
    return value
  }
}

type SerialRunnerOptions = {
  /**
   * The async work to serialize.
   */
  run(): Promise<void>
  /**
   * Receives errors thrown by `run`, so a failure never rejects the returned trigger.
   */
  onError(error: Error): void
}

/**
 * Wraps `run` so invocations never overlap: a trigger that lands while a run is in flight
 * marks it dirty and runs once more after it finishes, no matter how many triggers arrived.
 * Useful for event-driven reruns (a file watcher, a queue drain) where bursts should
 * coalesce into a single trailing run.
 *
 * @example
 * ```ts
 * const rebuild = createSerialRunner({
 *   run: () => build(),
 *   onError: (error) => log.error(error.message),
 * })
 * watcher.on('change', () => void rebuild())
 * ```
 */
export function createSerialRunner({ run, onError }: SerialRunnerOptions): () => Promise<void> {
  let running = false
  let dirty = false

  return async (): Promise<void> => {
    if (running) {
      dirty = true
      return
    }
    running = true
    do {
      dirty = false
      try {
        await run()
      } catch (error) {
        onError(toError(error))
      }
    } while (dirty)
    running = false
  }
}
