import { describe, expect, it, vi } from 'vitest'
import { inParallel, memo } from './promise.ts'

describe('memo', () => {
  it('computes once per key with a weak store (object keys)', () => {
    const store = memo.create<{ v: number }, number>({ type: 'weak' })
    const a = { v: 1 }
    const b = { v: 2 }
    const compute = vi.fn((obj: { v: number }) => obj.v * 10)

    expect(memo(store, a, () => compute(a))).toBe(10)
    expect(memo(store, a, () => compute(a))).toBe(10)
    expect(memo(store, b, () => compute(b))).toBe(20)
    expect(compute).toHaveBeenCalledTimes(2)
  })

  it.each([null, undefined])('treats a cached %s as a hit', (cached) => {
    const store = memo.create<string, null | undefined>({ type: 'map' })
    const compute = vi.fn(() => cached)

    expect(memo(store, 'k', compute)).toBe(cached)
    expect(memo(store, 'k', compute)).toBe(cached)
    expect(compute).toHaveBeenCalledTimes(1)
  })

  it('keeps only the last entry with the last type, and hits for an equal key', () => {
    const store = memo.create<string, number>({ type: 'last' })
    const compute = vi.fn((key: string) => key.length)

    memo(store, 'aa', () => compute('aa'))
    memo(store, ['a', 'a'].join(''), () => compute('aa'))
    memo(store, 'bbb', () => compute('bbb'))
    memo(store, 'aa', () => compute('aa'))
    expect(compute.mock.calls).toStrictEqual([['aa'], ['bbb'], ['aa']])
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
