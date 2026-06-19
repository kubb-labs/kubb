import { describe, expect, it, vi } from 'vitest'
import { isPromise, memoize } from './promise.ts'

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
