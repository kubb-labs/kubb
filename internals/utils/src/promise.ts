function* chunks<T>(arr: readonly T[], size: number) {
  let offset = 0
  while (offset < arr.length) {
    yield arr.slice(offset, (offset += size))
  }
}

export type ForBatchesOptions = {
  /** Number of items dispatched concurrently per batch. */
  concurrency: number
  /** Called after any batch that pushes the running total past a multiple of `flushInterval`. */
  flush?: () => Promise<void>
  /** Minimum items to accumulate between `flush` calls. Defaults to 50. */
  flushInterval?: number
}

/**
 * Processes `source` in parallel batches, calling `options.flush` periodically.
 * Accepts both plain arrays (sync) and `AsyncIterable` (streaming).
 *
 * @example
 * ```ts
 * // array source
 * await forBatches(schemas, (batch) => Promise.all(batch.map(process)), { concurrency: 8 })
 *
 * // async iterable with periodic flush
 * await forBatches(stream.schemas, (batch) => dispatch(batch), { concurrency: 8, flush, flushInterval: 50 })
 * ```
 */
export async function forBatches<T>(
  source: readonly T[] | AsyncIterable<T>,
  process: (batch: T[]) => Promise<unknown>,
  options: ForBatchesOptions,
): Promise<void> {
  const { concurrency, flush, flushInterval = 50 } = options
  let count = 0
  let lastFlushAt = 0

  async function maybeFlush(): Promise<void> {
    if (flush && count - lastFlushAt >= flushInterval) {
      lastFlushAt = count
      await flush()
    }
  }

  if (Array.isArray(source)) {
    for (const batch of chunks(source, concurrency)) {
      await process(batch)
      count += batch.length
      await maybeFlush()
    }
  } else {
    const batch: T[] = []
    for await (const item of source) {
      batch.push(item)
      if (batch.length >= concurrency) {
        const nodes = batch.splice(0)
        await process(nodes)
        count += nodes.length
        await maybeFlush()
      }
    }
    if (batch.length > 0) {
      const nodes = batch.splice(0)
      await process(nodes)
      count += nodes.length
      await maybeFlush()
    }
  }
}

/**
 * Runs `work`, passing `flush` as its periodic-flush callback, then calls
 * `flush` once more to drain any items that did not cross a flush boundary.
 *
 * @example
 * ```ts
 * await withDrain(
 *   (flush) => processItems(items, { flush }),
 *   () => writeRemainingFiles(),
 * )
 * ```
 */
export async function withDrain(
  work: (flush: () => Promise<void>) => Promise<void>,
  flush: () => Promise<void>,
): Promise<void> {
  await work(flush)
  await flush()
}

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

/** Returns `true` when `result` is a fulfilled `Promise.allSettled` result.
 *
 * @example
 * ```ts
 * const results = await Promise.allSettled([p1, p2])
 * results.filter(isPromiseFulfilledResult).map((r) => r.value)
 * ```
 */
export function isPromiseFulfilledResult<T = unknown>(result: PromiseSettledResult<unknown>): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled'
}

/** Returns `true` when `result` is a rejected `Promise.allSettled` result with a typed `reason`.
 *
 * @example
 * ```ts
 * const results = await Promise.allSettled([p1, p2])
 * results.filter(isPromiseRejectedResult<Error>).map((r) => r.reason.message)
 * ```
 */
export function isPromiseRejectedResult<T>(result: PromiseSettledResult<unknown>): result is Omit<PromiseRejectedResult, 'reason'> & { reason: T } {
  return result.status === 'rejected'
}
