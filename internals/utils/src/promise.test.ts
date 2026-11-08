import { describe, expect, it, vi } from 'vitest'
import { inParallel, memo } from './promise.ts'

describe('memo', () => {
  it('treats a cached null as a hit', () => {
    const store = new Map<string, null>()
    const compute = vi.fn(() => null)

    memo(store, 'k', compute)
    memo(store, 'k', compute)
    expect(compute).toHaveBeenCalledTimes(1)
  })
})

describe('inParallel', () => {
  it('hands the next item to whichever worker frees up first', async () => {
    const order: Array<number> = []

    // The first item is slow, so a single-file-at-a-time loop would finish in input order.
    await inParallel({
      items: [20, 1, 1],
      limit: 2,
      run: async (delay) => {
        await new Promise((done) => setTimeout(done, delay))
        order.push(delay)
      },
    })

    expect(order).toStrictEqual([1, 1, 20])
  })

  it('does nothing for an empty list', async () => {
    const run = vi.fn()

    await expect(inParallel({ items: [], limit: 5, run })).resolves.toBeUndefined()
    expect(run).not.toHaveBeenCalled()
  })
})
