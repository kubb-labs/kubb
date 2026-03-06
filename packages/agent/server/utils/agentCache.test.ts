import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getLatestStudioConfigFromStorage, saveStudioConfigToStorage } from './agentCache.ts'

let mockStorage: any

beforeEach(() => {
  mockStorage = {
    setItem: vi.fn().mockResolvedValue(undefined),
    getItem: vi.fn().mockResolvedValue(null),
  }
  vi.stubGlobal('useStorage', () => mockStorage)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Agent cache', () => {
  describe('saveStudioConfigToStorage', () => {
    it('saves config under configs:{sessionId} key', async () => {
      const config = { plugins: [{ name: '@kubb/plugin-ts', options: {} }] }

      await saveStudioConfigToStorage({ sessionId: 'session-123', config })

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'configs:session-123',
        expect.arrayContaining([expect.objectContaining({ config, storedAt: expect.any(String) })]),
      )
    })

    it('appends to existing entries', async () => {
      const first = { plugins: [] }
      const second = { plugins: [{ name: '@kubb/plugin-ts', options: {} }] }
      mockStorage.getItem.mockResolvedValueOnce([{ config: first, storedAt: '2025-01-01T00:00:00.000Z' }])

      await saveStudioConfigToStorage({ sessionId: 'session-123', config: second })

      const [, written] = mockStorage.setItem.mock.calls[0]
      expect(written).toHaveLength(2)
      expect(written[0].config).toEqual(first)
      expect(written[1].config).toEqual(second)
    })
  })

  describe('getLatestStudioConfigFromStorage', () => {
    it('returns null when no config is stored', async () => {
      mockStorage.getItem.mockResolvedValueOnce(null)

      const result = await getLatestStudioConfigFromStorage({ sessionId: 'session-123' })

      expect(result).toBeNull()
    })

    it('returns null when the stored list is empty', async () => {
      mockStorage.getItem.mockResolvedValueOnce([])

      const result = await getLatestStudioConfigFromStorage({ sessionId: 'session-123' })

      expect(result).toBeNull()
    })

    it('returns the most recently saved config', async () => {
      const first = { plugins: [{ name: '@kubb/plugin-oas', options: {} }] }
      const second = { plugins: [{ name: '@kubb/plugin-ts', options: {} }] }
      mockStorage.getItem.mockResolvedValueOnce([
        { config: first, storedAt: '2025-01-01T00:00:00.000Z' },
        { config: second, storedAt: '2025-01-02T00:00:00.000Z' },
      ])

      const result = await getLatestStudioConfigFromStorage({ sessionId: 'session-123' })

      expect(result).toEqual(second)
    })

    it('reads from the correct session-scoped key', async () => {
      mockStorage.getItem.mockResolvedValueOnce(null)

      await getLatestStudioConfigFromStorage({ sessionId: 'session-abc' })

      expect(mockStorage.getItem).toHaveBeenCalledWith('configs:session-abc')
    })
  })
})
