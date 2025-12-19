
import { getUniqueName, setUniqueName } from './uniqueName.ts'

describe('uniqueName', () => {
  describe('getUniqueName', () => {
    it('should return original name for first occurrence', () => {
      const data: Record<string, number> = {}
      const result = getUniqueName('test', data)
      expect(result).toBe('test')
      expect(data).toEqual({ test: 1 })
    })

    it('should append number for duplicate names', () => {
      const data: Record<string, number> = { test: 1 }
      const result = getUniqueName('test', data)
      expect(result).toBe('test2')
      expect(data).toEqual({ test: 2, test2: 1 })
    })

    it('should increment number for multiple duplicates', () => {
      const data: Record<string, number> = { test: 2, test2: 1 }
      const result = getUniqueName('test', data)
      expect(result).toBe('test3')
      expect(data).toEqual({ test: 3, test2: 1, test3: 1 })
    })

    it('should handle different names independently', () => {
      const data: Record<string, number> = {}
      const result1 = getUniqueName('foo', data)
      const result2 = getUniqueName('bar', data)
      const result3 = getUniqueName('foo', data)

      expect(result1).toBe('foo')
      expect(result2).toBe('bar')
      expect(result3).toBe('foo2')
      expect(data).toEqual({ foo: 2, bar: 1, foo2: 1 })
    })
  })

  describe('setUniqueName', () => {
    it('should return original name for first occurrence', () => {
      const data: Record<string, number> = {}
      const result = setUniqueName('test', data)
      expect(result).toBe('test')
      expect(data).toEqual({ test: 1 })
    })

    it('should return original name even for duplicates', () => {
      const data: Record<string, number> = { test: 1 }
      const result = setUniqueName('test', data)
      expect(result).toBe('test')
      expect(data).toEqual({ test: 2 })
    })

    it('should increment counter for each call', () => {
      const data: Record<string, number> = {}
      setUniqueName('test', data)
      setUniqueName('test', data)
      setUniqueName('test', data)

      expect(data).toEqual({ test: 3 })
    })
  })
})
