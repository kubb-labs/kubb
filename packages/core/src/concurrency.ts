type ParallelOptions<TItem> = {
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
 * takes the next item the moment it frees up instead of waiting for a batch to drain.
 *
 * @example
 * ```ts
 * await inParallel({ items: files, limit: 50, run: (file) => storage.writeItem(file.path, file.source) })
 * ```
 */
export async function inParallel<TItem>({ items, limit, run }: ParallelOptions<TItem>): Promise<void> {
  const queue = items.entries()

  const worker = async (): Promise<void> => {
    for (const [index, item] of queue) await run(item, index)
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
}
