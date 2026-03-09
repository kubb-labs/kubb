import { beforeEach, describe, expect, it, vi } from 'vitest'
import { executeIfOnline, isOnline } from './network.ts'

const mockResolve = vi.hoisted(() => vi.fn())

vi.mock('node:dns', () => ({
  promises: { resolve: mockResolve },
}))

describe('checkOnlineStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isOnline', () => {
    it('should return true when DNS resolution succeeds on first domain', async () => {
      mockResolve.mockResolvedValue(['127.0.0.1'])

      const result = await isOnline()

      expect(result).toBe(true)
      expect(mockResolve).toHaveBeenCalledWith('dns.google.com')
    })

    it('should return true when first domain fails but second succeeds', async () => {
      mockResolve.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce(['127.0.0.1'])

      const result = await isOnline()

      expect(result).toBe(true)
      expect(mockResolve).toHaveBeenCalledWith('dns.google.com')
      expect(mockResolve).toHaveBeenCalledWith('cloudflare.com')
    })

    it('should return true when only last domain succeeds', async () => {
      mockResolve.mockRejectedValueOnce(new Error('Network error')).mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce(['127.0.0.1'])

      const result = await isOnline()

      expect(result).toBe(true)
      expect(mockResolve).toHaveBeenCalledTimes(3)
    })

    it('should return false when all DNS resolutions fail', async () => {
      mockResolve.mockRejectedValue(new Error('Network error'))

      const result = await isOnline()

      expect(result).toBe(false)
      expect(mockResolve).toHaveBeenCalledTimes(3)
    })
  })

  describe('executeIfOnline', () => {
    it('should execute function when online', async () => {
      mockResolve.mockResolvedValue(['127.0.0.1'])
      const mockFn = vi.fn().mockResolvedValue('success')

      const result = await executeIfOnline(mockFn)

      expect(mockFn).toHaveBeenCalled()
      expect(result).toBe('success')
    })

    it('should not execute function when offline', async () => {
      mockResolve.mockRejectedValue(new Error('Network error'))
      const mockFn = vi.fn()

      const result = await executeIfOnline(mockFn)

      expect(mockFn).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should return undefined if function throws when online', async () => {
      mockResolve.mockResolvedValue(['127.0.0.1'])
      const mockFn = vi.fn().mockRejectedValue(new Error('Function error'))

      const result = await executeIfOnline(mockFn)

      expect(mockFn).toHaveBeenCalled()
      expect(result).toBeNull()
    })
  })
})
