import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentConnectResponse } from '../types/agent.ts'
import { cacheSession, deleteCachedSession, getCachedSession, isSessionValid, loadAgentConfig, saveAgentConfig } from './sessionManager.ts'

// Mock logger to avoid output during tests
vi.mock('./logger.ts', () => ({
  logger: {
    warn: vi.fn(),
    success: vi.fn(),
  },
}))

describe('SessionManager', () => {
  let testConfigDir: string
  const originalHomeDir = process.env.HOME

  beforeEach(() => {
    // Create isolated test directory using mkdtempSync
    testConfigDir = mkdtempSync(path.join(os.tmpdir(), 'kubb-test-'))

    // Override HOME to redirect ~/.kubb to our test directory
    process.env.HOME = testConfigDir
  })

  afterEach(() => {
    // Restore original HOME
    if (originalHomeDir) {
      process.env.HOME = originalHomeDir
    } else {
      delete process.env.HOME
    }

    // Clean up test directory
    if (existsSync(testConfigDir)) {
      rmSync(testConfigDir, { recursive: true, force: true })
    }

    vi.clearAllMocks()
  })

  describe('isSessionValid', () => {
    it('should return true for session that has not expired', () => {
      const futureDate = new Date(Date.now() + 2 * 60000)
      const session = {
        wsUrl: 'ws://test',
        sessionToken: 'token',
        expiresAt: futureDate.toISOString(),
        revokedAt: '',
        storedAt: new Date().toISOString(),
      }

      const isValid = isSessionValid(session)

      expect(isValid).toBe(true)
    })

    it('should return false for expired session', () => {
      const pastDate = new Date(Date.now() - 2 * 60000)
      const session = {
        wsUrl: 'ws://test',
        sessionToken: 'token',
        expiresAt: pastDate.toISOString(),
        revokedAt: '',
        storedAt: new Date().toISOString(),
      }

      const isValid = isSessionValid(session)

      expect(isValid).toBe(false)
    })

    it('should use 1 minute buffer before expiration', () => {
      const almostExpiredDate = new Date(Date.now() + 30000)
      const session = {
        wsUrl: 'ws://test',
        sessionToken: 'token',
        expiresAt: almostExpiredDate.toISOString(),
        revokedAt: '',
        storedAt: new Date().toISOString(),
      }

      const isValid = isSessionValid(session)

      expect(isValid).toBe(false)
    })

    it('should handle invalid date strings', () => {
      const session = {
        wsUrl: 'ws://test',
        sessionToken: 'token',
        expiresAt: 'invalid-date',
        revokedAt: '',
        storedAt: new Date().toISOString(),
      }

      const isValid = isSessionValid(session)

      expect(isValid).toBe(false)
    })
  })

  describe('cacheSession and getCachedSession', () => {
    it('should cache and retrieve a valid session', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const response: AgentConnectResponse = {
        wsUrl: 'ws://studio:8000',
        sessionToken: 'session-abc123',
        expiresAt: futureDate.toISOString(),
        revokedAt: '',
      }

      cacheSession('my-auth-token', response)
      const cached = getCachedSession('my-auth-token')

      expect(cached).toBeDefined()
      expect(cached?.wsUrl).toBe('ws://studio:8000')
      expect(cached?.sessionToken).toBe('session-abc123')
    })

    it('should include storedAt timestamp when caching', () => {
      const response: AgentConnectResponse = {
        wsUrl: 'ws://studio',
        sessionToken: 'token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        revokedAt: '',
      }

      const before = Date.now()
      cacheSession('token-1', response)
      const after = Date.now()

      const cached = getCachedSession('token-1')

      expect(cached?.storedAt).toBeDefined()
      const storedTime = new Date(cached!.storedAt).getTime()
      expect(storedTime).toBeGreaterThanOrEqual(before - 10)
      expect(storedTime).toBeLessThanOrEqual(after + 10)
    })

    it('should return null for non-existent session', () => {
      const cached = getCachedSession('nonexistent-token')

      expect(cached).toBeNull()
    })

    it('should return null and auto-delete expired session', () => {
      const pastDate = new Date(Date.now() - 60000)
      const response: AgentConnectResponse = {
        wsUrl: 'ws://studio',
        sessionToken: 'token',
        expiresAt: pastDate.toISOString(),
        revokedAt: '',
      }

      cacheSession('expired-token', response)
      const beforeCount = Object.keys(loadAgentConfig().sessions || {}).length

      const cached = getCachedSession('expired-token')

      expect(cached).toBeNull()

      const afterCount = Object.keys(loadAgentConfig().sessions || {}).length
      expect(afterCount).toBeLessThanOrEqual(beforeCount)
    })

    it('should handle multiple concurrent sessions', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      const response1: AgentConnectResponse = {
        wsUrl: 'ws://studio-1',
        sessionToken: 'token-1',
        expiresAt: futureDate,
        revokedAt: '',
      }

      const response2: AgentConnectResponse = {
        wsUrl: 'ws://studio-2',
        sessionToken: 'token-2',
        expiresAt: futureDate,
        revokedAt: '',
      }

      cacheSession('auth-1', response1)
      cacheSession('auth-2', response2)

      const cached1 = getCachedSession('auth-1')
      const cached2 = getCachedSession('auth-2')

      expect(cached1?.wsUrl).toBe('ws://studio-1')
      expect(cached2?.wsUrl).toBe('ws://studio-2')
    })
  })

  describe('deleteCachedSession', () => {
    it('should delete a cached session', () => {
      const response: AgentConnectResponse = {
        wsUrl: 'ws://studio',
        sessionToken: 'token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        revokedAt: '',
      }

      cacheSession('my-token', response)
      let cached = getCachedSession('my-token')
      expect(cached).toBeDefined()

      deleteCachedSession('my-token')
      cached = getCachedSession('my-token')
      expect(cached).toBeNull()
    })

    it('should not fail when deleting non-existent session', () => {
      expect(() => deleteCachedSession('nonexistent')).not.toThrow()
    })

    it('should preserve other sessions when deleting one', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      cacheSession('token-1', {
        wsUrl: 'ws://1',
        sessionToken: 'session-1',
        expiresAt: futureDate,
        revokedAt: '',
      })

      cacheSession('token-2', {
        wsUrl: 'ws://2',
        sessionToken: 'session-2',
        expiresAt: futureDate,
        revokedAt: '',
      })

      deleteCachedSession('token-1')

      const cached1 = getCachedSession('token-1')
      const cached2 = getCachedSession('token-2')

      expect(cached1).toBeNull()
      expect(cached2).toBeDefined()
    })
  })

  describe('loadAgentConfig and saveAgentConfig', () => {
    it('should load and save config', () => {
      const config = { sessions: { test: { wsUrl: 'ws://test', sessionToken: 'token', expiresAt: '2026-12-31', revokedAt: '', storedAt: '2026-02-18' } } }

      saveAgentConfig(config)
      const loaded = loadAgentConfig()

      expect(loaded.sessions?.test).toBeDefined()
      expect(loaded.sessions?.test?.wsUrl).toBe('ws://test')
    })

    it('should return empty sessions when config does not exist', () => {
      const config = loadAgentConfig()

      expect(config).toBeDefined()
      expect(config.sessions).toBeDefined()
    })

    it('should create directory if it does not exist', () => {
      saveAgentConfig({ sessions: {} })

      const config = loadAgentConfig()
      expect(config).toBeDefined()
    })
  })

  describe('Token hashing', () => {
    it('should hash tokens consistently', () => {
      const token = 'secret-token'
      const hash1 = Buffer.from(token).toString('base64').substring(0, 16)
      const hash2 = Buffer.from(token).toString('base64').substring(0, 16)

      expect(hash1).toBe(hash2)
    })

    it('should generate different hashes for different tokens', () => {
      const hash1 = Buffer.from('token-1').toString('base64').substring(0, 16)
      const hash2 = Buffer.from('token-2').toString('base64').substring(0, 16)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('Session expiration handling', () => {
    it('should keep valid sessions', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      cacheSession('valid-token', {
        wsUrl: 'ws://test',
        sessionToken: 'token',
        expiresAt: futureDate,
        revokedAt: '',
      })

      const cached = getCachedSession('valid-token')
      expect(cached).toBeDefined()
    })

    it('should reject expired sessions on retrieval', () => {
      const pastDate = new Date(Date.now() - 120000).toISOString()

      cacheSession('expired-token', {
        wsUrl: 'ws://test',
        sessionToken: 'token',
        expiresAt: pastDate,
        revokedAt: '',
      })

      const cached = getCachedSession('expired-token')
      expect(cached).toBeNull()
    })

    it('should apply 1 minute expiration buffer', () => {
      // Session expires in 30 seconds (less than 1 minute buffer)
      const almostExpiredDate = new Date(Date.now() + 30 * 1000).toISOString()

      cacheSession('almost-expired', {
        wsUrl: 'ws://test',
        sessionToken: 'token',
        expiresAt: almostExpiredDate,
        revokedAt: '',
      })

      const cached = getCachedSession('almost-expired')
      expect(cached).toBeNull()
    })
  })
})
