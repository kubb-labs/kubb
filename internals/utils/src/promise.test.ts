import { setTimeout as delay } from 'node:timers/promises'
import { describe, expect, it, vi } from 'vitest'
import { createSerialRunner, inParallel, isPromise, memoize } from './promise.ts'

describe('promise utilities', () => {
  describe('isPromise', () => {
    it('should return true for Promise', () => {
      const promise = Promise.resolve('test')
      expect(isPromise(promise)).toBe(true)
    })

    it('should return true for object with then method', () => {
      const thenable = { then: () => {} }
      expect(isPromise(thenable)).toBe(true)
    })

    it('should return false for non-promise values', () => {
      expect(isPromise('string')).toBe(false)
      expect(isPromise(123)).toBe(false)
      expect(isPromise(null)).toBe(false)
      expect(isPromise(undefined)).toBe(false)
      expect(isPromise({})).toBe(false)
    })
  })
})

describe('memoize', () => {
  it('caches by key using a Map (primitive keys)', () => {
    const factory = vi.fn((n: number) => n * 2)
    const fn = memoize(new Map<number, number>(), factory)

    expect(fn(3)).toBe(6)
    expect(fn(3)).toBe(6)
    expect(fn(4)).toBe(8)
    expect(factory).toHaveBeenCalledTimes(2)
  })

  it('caches by key using a WeakMap (object keys)', () => {
    const factory = vi.fn((obj: { v: number }) => obj.v * 10)
    const fn = memoize(new WeakMap(), factory)

    const a = { v: 1 }
    const b = { v: 2 }

    expect(fn(a)).toBe(10)
    expect(fn(a)).toBe(10)
    expect(fn(b)).toBe(20)
    expect(factory).toHaveBeenCalledTimes(2)
  })

  it('clears correctly when the backing store is cleared', () => {
    const factory = vi.fn((k: string) => k.toUpperCase())
    const store = new Map<string, string>()
    const fn = memoize(store, factory)

    expect(fn('a')).toBe('A')
    store.clear()
    expect(fn('a')).toBe('A')
    expect(factory).toHaveBeenCalledTimes(2)
  })

  it('supports two-level nesting (object + primitive key)', () => {
    const innerFactory = vi.fn((k: string) => k)
    const outerFactory = vi.fn((_obj: object) => memoize(new Map<string, string>(), innerFactory))
    const fn = memoize(new WeakMap(), outerFactory)

    const key = {}
    fn(key)!('a')
    fn(key)!('a')
    fn(key)!('b')

    expect(outerFactory).toHaveBeenCalledTimes(1)
    expect(innerFactory).toHaveBeenCalledTimes(2)
  })
})

describe('createSerialRunner', () => {
  it('collapses triggers that land during a run into one rerun', async () => {
    let calls = 0
    const gates: Array<() => void> = []
    const runner = createSerialRunner({
      run: () =>
        new Promise<void>((resolve) => {
          calls += 1
          gates.push(resolve)
        }),
      onError: () => {},
    })

    const first = runner()
    void runner()
    void runner()
    void runner()
    expect(calls).toBe(1)

    gates[0]?.()
    await vi.waitFor(() => expect(calls).toBe(2))

    gates[1]?.()
    await first
    expect(calls).toBe(2)
  })

  it('reports a run error through onError and keeps accepting triggers', async () => {
    const errors: Array<string> = []
    let shouldFail = true
    const runner = createSerialRunner({
      run: async () => {
        if (shouldFail) throw new Error('run exploded')
      },
      onError: (error) => errors.push(error.message),
    })

    await runner()
    expect(errors).toStrictEqual(['run exploded'])

    shouldFail = false
    await runner()
    expect(errors).toStrictEqual(['run exploded'])
  })
})

describe('inParallel', () => {
  it('runs every item once, with its index', async () => {
    const seen: Array<[string, number]> = []

    await inParallel({ items: ['a', 'b', 'c'], limit: 2, run: async (item, index) => void seen.push([item, index]) })

    expect(seen.toSorted()).toStrictEqual([
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ])
  })

  it('keeps at most `limit` items in flight', async () => {
    let inFlight = 0
    let peak = 0

    await inParallel({
      items: Array.from({ length: 20 }, (_, i) => i),
      limit: 3,
      run: async () => {
        inFlight++
        peak = Math.max(peak, inFlight)
        await delay(1)
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
      run: async (duration) => {
        await delay(duration)
        order.push(duration)
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
