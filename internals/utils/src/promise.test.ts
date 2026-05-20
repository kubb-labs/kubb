import { describe, expect, it, vi } from 'vitest'
import { forBatches, isPromise, isPromiseFulfilledResult, isPromiseRejectedResult, withDrain } from './promise.ts'

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

    it('calls flush after accumulated count crosses flushInterval', async () => {
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
          flushInterval: 5,
        },
      )
      // flushInterval=5: crosses at 6 (after batch [3,4,5]), crosses at 12 (after batch [9,10,11])

      expect(flushed.length).toBe(2)
      expect(flushed[0]).toBeGreaterThanOrEqual(5)
      expect(flushed[1]).toBeGreaterThanOrEqual(10)
    })

    it('does not call flush when total count never reaches flushInterval', async () => {
      const flush = vi.fn()
      await forBatches([1, 2, 3], async () => {}, { concurrency: 2, flush, flushInterval: 10 })

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

    it('calls flush after accumulated count crosses flushInterval', async () => {
      const flushed: number[] = []
      let processed = 0
      await forBatches(
        generate(Array.from({ length: 12 }, (_, i) => i)),
        async (batch) => {
          processed += batch.length
        },
        {
          concurrency: 3,
          flush: async () => {
            flushed.push(processed)
          },
          flushInterval: 5,
        },
      )

      expect(flushed.length).toBe(2)
      expect(flushed[0]).toBeGreaterThanOrEqual(5)
    })

    it('does not call flush when total count never reaches flushInterval', async () => {
      const flush = vi.fn()
      await forBatches(generate([1, 2, 3]), async () => {}, { concurrency: 2, flush, flushInterval: 10 })

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
