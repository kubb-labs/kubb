import dns from 'node:dns'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { executeIfOnline, isOnline } from './checkOnlineStatus'

vi.mock('node:dns', () => ({
  default: {
    promises: {
      resolve: vi.fn(),
    },
  },
}))

describe('checkOnlineStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isOnline', () => {
    it('should return true when DNS resolution succeeds on first domain', async () => {
      vi.mocked(dns.promises.resolve).mockResolvedValue(['127.0.0.1'] as any)

      const result = await isOnline()

      expect(result).toBe(true)
      expect(dns.promises.resolve).toHaveBeenCalledWith('dns.google.com')
    })

    it('should return true when first domain fails but second succeeds', async () => {
      vi.mocked(dns.promises.resolve)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(['127.0.0.1'] as any)

      const result = await isOnline()

      expect(result).toBe(true)
      expect(dns.promises.resolve).toHaveBeenCalledWith('dns.google.com')
      expect(dns.promises.resolve).toHaveBeenCalledWith('cloudflare.com')
    })

    it('should return true when only last domain succeeds', async () => {
      vi.mocked(dns.promises.resolve)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(['127.0.0.1'] as any)

      const result = await isOnline()

      expect(result).toBe(true)
      expect(dns.promises.resolve).toHaveBeenCalledTimes(3)
    })

    it('should return false when all DNS resolutions fail', async () => {
      vi.mocked(dns.promises.resolve).mockRejectedValue(new Error('Network error'))

      const result = await isOnline()

      expect(result).toBe(false)
      expect(dns.promises.resolve).toHaveBeenCalledTimes(3)
    })
  })

  describe('executeIfOnline', () => {
    it('should execute function when online', async () => {
      vi.mocked(dns.promises.resolve).mockResolvedValue(['127.0.0.1'] as any)
      const mockFn = vi.fn().mockResolvedValue('success')

      const result = await executeIfOnline(mockFn)

      expect(mockFn).toHaveBeenCalled()
      expect(result).toBe('success')
    })

    it('should not execute function when offline', async () => {
      vi.mocked(dns.promises.resolve).mockRejectedValue(new Error('Network error'))
      const mockFn = vi.fn()

      const result = await executeIfOnline(mockFn)

      expect(mockFn).not.toHaveBeenCalled()
      expect(result).toBeUndefined()
    })

    it('should return undefined if function throws when online', async () => {
      vi.mocked(dns.promises.resolve).mockResolvedValue(['127.0.0.1'] as any)
      const mockFn = vi.fn().mockRejectedValue(new Error('Function error'))

      const result = await executeIfOnline(mockFn)

      expect(mockFn).toHaveBeenCalled()
      expect(result).toBeUndefined()
    })
  })
})
