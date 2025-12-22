/** biome-ignore-all lint/suspicious/noThenProperty: test case */

import { describe, expect, it } from 'vitest'
import { isPromise, isPromiseFulfilledResult, isPromiseRejectedResult } from './promise.ts'

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
