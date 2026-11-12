import { describe, expect, it, vi } from 'vitest'
import { inParallel, memo } from './promise.ts'

describe('memo', () => {
  it('computes once per key using a WeakMap (object keys)', () => {
    const store = new WeakMap<{ v: number }, number>()
    const a = { v: 1 }
    const b = { v: 2 }
    const compute = vi.fn((obj: { v: number }) => obj.v * 10)

    expect(memo(store, a, () => compute(a))).toBe(10)
    expect(memo(store, a, () => compute(a))).toBe(10)
    expect(memo(store, b, () => compute(b))).toBe(20)
    expect(compute).toHaveBeenCalledTimes(2)
  })

  it.each([null, undefined])('treats a cached %s as a hit', (cached) => {
    const store = new Map<string, null | undefined>()
    const compute = vi.fn(() => cached)

    expect(memo(store, 'k', compute)).toBe(cached)
    expect(memo(store, 'k', compute)).toBe(cached)
    expect(compute).toHaveBeenCalledTimes(1)
  })
})

describe('inParallel', () => {
  it('keeps at most `limit` items in flight', async () => {
    let inFlight = 0
    let peak = 0

    await inParallel({
      items: Array.from({ length: 20 }, (_, i) => i),
      limit: 3,
      run: async () => {
        inFlight++
        peak = Math.max(peak, inFlight)
        await new Promise((done) => setTimeout(done, 1))
        inFlight--
      },
    })

    expect(peak).toBe(3)
  })

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
