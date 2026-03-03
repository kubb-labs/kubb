import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cacheSession, getCachedSession, getSessionKey, removeCachedSession, saveStudioConfigToStorage } from './agentCache.ts'

let mockStorage: any

beforeEach(() => {
  vi.useFakeTimers()
  mockStorage = {
    setItem: vi.fn().mockResolvedValue(undefined),
    getItem: vi.fn(),
    getKeys: vi.fn(),
    removeItem: vi.fn(),
  }
  vi.stubGlobal('useStorage', () => mockStorage)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Agent cache', () => {
  it('generates session key from token using SHA-512 hash', () => {
    const token = 'my-secret-token'
    const key = getSessionKey(token)

    expect(key).toMatch(/^sessions:[a-f0-9]{128}$/)
    // Same token should always produce same key
    expect(getSessionKey(token)).toBe(key)
    // Different token should produce different key
    expect(getSessionKey('different-token')).not.toBe(key)
  })

  it('caches a session', async () => {
    const session = { sessionId: '123', wsUrl: 'ws://test', expiresAt: new Date(Date.now() + 3600000).toISOString() }

    await cacheSession({ sessionKey: 'test-key', session: session as any })

    expect(mockStorage.setItem).toHaveBeenCalledWith('test-key', expect.objectContaining({ sessionId: '123', storedAt: expect.any(String), configs: [] }))
  })

  it('retrieves a valid cached session', async () => {
    const session = {
      sessionId: '123',
      wsUrl: 'ws://test',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      storedAt: new Date().toISOString(),
      configs: [],
    }
    mockStorage.getItem.mockResolvedValue(session)

    const result = await getCachedSession('test-key')

    expect(result).toEqual(session)
  })

  it('returns null for expired cached session', async () => {
    const session = {
      sessionId: '123',
      wsUrl: 'ws://test',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      storedAt: new Date().toISOString(),
      configs: [],
    }
    mockStorage.getItem.mockResolvedValue(session)

    const result = await getCachedSession('test-key')

    expect(result).toBeNull()
  })

  it('removes a cached session', async () => {
    await removeCachedSession('test-key')

    expect(mockStorage.removeItem).toHaveBeenCalledWith('test-key')
  })

  it('saves config to storage with timestamp', async () => {
    const config = { plugins: [{ name: '@kubb/plugin-ts', options: {} }] }
    const session = {
      sessionId: '123',
      wsUrl: 'ws://test',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      storedAt: new Date().toISOString(),
      configs: [],
    }
    mockStorage.getItem.mockResolvedValue(session)

    await saveStudioConfigToStorage({ sessionKey: 'test-session', config })

    expect(mockStorage.setItem).toHaveBeenCalledWith('test-session', {
      ...session,
      configs: expect.arrayContaining([expect.objectContaining({ config, storedAt: expect.any(String) })]),
    })
  })

  it('returns empty array when no configs exist', async () => {
    const session = {
      sessionId: '123',
      wsUrl: 'ws://test',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      storedAt: new Date().toISOString(),
      configs: [],
    }
    mockStorage.getItem.mockResolvedValue(session)

    const results = await getCachedSession('test-session')

    expect(results?.configs).toEqual([])
  })
})
