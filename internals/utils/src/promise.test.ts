import { describe, expect, it, vi } from 'vitest'
import { forBatches, isPromise, isPromiseFulfilledResult, isPromiseRejectedResult, once, withDrain } from './promise.ts'

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

  describe('isPromiseFulfilledResult', () => {
    it('should return true for fulfilled result', () => {
      const result: PromiseFulfilledResult<string> = {
        status: 'fulfilled',
        value: 'test',
      }
      expect(isPromiseFulfilledResult(result)).toBe(true)
    })

    it('should return false for rejected result', () => {
      const result: PromiseRejectedResult = {
        status: 'rejected',
        reason: new Error('test'),
      }
      expect(isPromiseFulfilledResult(result)).toBe(false)
    })
  })

  describe('isPromiseRejectedResult', () => {
    it('should return true for rejected result', () => {
      const result: PromiseRejectedResult = {
        status: 'rejected',
        reason: new Error('test'),
      }
      expect(isPromiseRejectedResult(result)).toBe(true)
    })

    it('should return false for fulfilled result', () => {
      const result: PromiseFulfilledResult<string> = {
        status: 'fulfilled',
        value: 'test',
      }
      expect(isPromiseRejectedResult(result)).toBe(false)
    })
  })
})

describe('forBatches', () => {
  describe('array source', () => {
    it('calls process with batches of the requested concurrency', async () => {
      const batches: number[][] = []
      await forBatches(
        [1, 2, 3, 4, 5],
        async (batch) => {
          batches.push(batch)
        },
        { concurrency: 2 },
      )

      expect(batches).toEqual([[1, 2], [3, 4], [5]])
    })

    it('passes all items when count is less than concurrency', async () => {
      const batches: number[][] = []
      await forBatches(
        [1, 2],
        async (batch) => {
          batches.push(batch)
        },
        { concurrency: 10 },
      )

      expect(batches).toEqual([[1, 2]])
    })

    it('does nothing for an empty array', async () => {
      const process = vi.fn()
      await forBatches([], process, { concurrency: 5 })

      expect(process).not.toHaveBeenCalled()
    })

    it('calls flush after every batch', async () => {
      const flushed: number[] = []
      let processed = 0
      await forBatches(
        Array.from({ length: 12 }, (_, i) => i),
        async (batch) => {
          processed += batch.length
        },
        {
          concurrency: 3,
          flush: async () => {
            flushed.push(processed)
          },
        },
      )

      expect(flushed).toEqual([3, 6, 9, 12])
    })

    it('does not call flush when source is empty', async () => {
      const flush = vi.fn()
      await forBatches([], async () => {}, { concurrency: 2, flush })

      expect(flush).not.toHaveBeenCalled()
    })
  })

  describe('async iterable source', () => {
    async function* generate<T>(items: T[]) {
      for (const item of items) yield item
    }

    it('calls process with batches of the requested concurrency', async () => {
      const batches: number[][] = []
      await forBatches(
        generate([1, 2, 3, 4, 5]),
        async (batch) => {
          batches.push(batch)
        },
        { concurrency: 2 },
      )

      expect(batches).toEqual([[1, 2], [3, 4], [5]])
    })

    it('passes all items when count is less than concurrency', async () => {
      const batches: number[][] = []
      await forBatches(
        generate([1, 2]),
        async (batch) => {
          batches.push(batch)
        },
        { concurrency: 10 },
      )

      expect(batches).toEqual([[1, 2]])
    })

    it('does nothing for an empty async iterable', async () => {
      const process = vi.fn()
      await forBatches(generate([]), process, { concurrency: 5 })

      expect(process).not.toHaveBeenCalled()
    })

    it('calls flush after every batch (including the trailing partial batch)', async () => {
      const flushed: number[] = []
      let processed = 0
      await forBatches(
        generate(Array.from({ length: 12 }, (_, i) => i)),
        async (batch) => {
          processed += batch.length
        },
        {
          concurrency: 5,
          flush: async () => {
            flushed.push(processed)
          },
        },
      )

      expect(flushed).toEqual([5, 10, 12])
    })

    it('does not call flush when source is empty', async () => {
      const flush = vi.fn()
      await forBatches(generate([]), async () => {}, { concurrency: 2, flush })

      expect(flush).not.toHaveBeenCalled()
    })
  })
})

describe('withDrain', () => {
  it('passes flush to work and calls it again after work completes', async () => {
    const calls: string[] = []
    const flush = async () => {
      calls.push('flush')
    }

    await withDrain(async (f) => {
      calls.push('work-start')
      await f()
      calls.push('work-end')
    }, flush)

    expect(calls).toEqual(['work-start', 'flush', 'work-end', 'flush'])
  })

  it('calls flush even when work never calls it', async () => {
    const flush = vi.fn()
    await withDrain(async () => {}, flush)
    expect(flush).toHaveBeenCalledTimes(1)
  })

  it('calls flush exactly once after work when work calls it zero times', async () => {
    const flush = vi.fn()
    await withDrain(async (_f) => {
      /* work does not flush */
    }, flush)
    expect(flush).toHaveBeenCalledTimes(1)
  })
})

describe('once', () => {
  it('invokes the factory only on the first call and caches the result', () => {
    const factory = vi.fn((n: number) => n * 2)
    const fn = once(factory)

    expect(fn(1)).toBe(2)
    expect(fn(99)).toBe(2)
    expect(fn(123)).toBe(2)
    expect(factory).toHaveBeenCalledTimes(1)
    expect(factory).toHaveBeenCalledWith(1)
  })

  it('shares one in-flight promise between concurrent async callers', async () => {
    let resolved = 0
    const factory = vi.fn(async () => {
      await Promise.resolve()
      return ++resolved
    })
    const fn = once(factory)

    const [a, b, c] = await Promise.all([fn(), fn(), fn()])
    expect(a).toBe(1)
    expect(b).toBe(1)
    expect(c).toBe(1)
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('caches a rejected promise so subsequent callers receive the same error', async () => {
    const error = new Error('boom')
    const factory = vi.fn(async () => {
      throw error
    })
    const fn = once(factory)

    await expect(fn()).rejects.toBe(error)
    await expect(fn()).rejects.toBe(error)
    expect(factory).toHaveBeenCalledTimes(1)
  })
})
