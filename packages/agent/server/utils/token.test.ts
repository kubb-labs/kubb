import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { generateToken, getMachineToken, hashToken } from './token.ts'

describe('generateToken', () => {
  it('returns a 64-character hex string', () => {
    const token = generateToken()

    expect(token).toMatch(/^[a-f0-9]{64}$/)
  })

  it('returns a different value on each call', () => {
    expect(generateToken()).not.toBe(generateToken())
  })
})

describe('hashToken', () => {
  it('returns a 64-character hex string (SHA-256)', () => {
    const hash = hashToken('test-input')

    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('produces the same hash for the same input', () => {
    expect(hashToken('same-input')).toBe(hashToken('same-input'))
  })

  it('produces different hashes for different inputs', () => {
    expect(hashToken('input-a')).not.toBe(hashToken('input-b'))
  })
})

describe('getMachineToken', () => {
  const originalSecret = process.env.KUBB_AGENT_SECRET

  beforeEach(() => {
    delete process.env.KUBB_AGENT_SECRET
  })

  afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.KUBB_AGENT_SECRET = originalSecret
    } else {
      delete process.env.KUBB_AGENT_SECRET
    }
  })

  it('returns a 64-character hex string', () => {
    const token = getMachineToken()

    expect(token).toMatch(/^[a-f0-9]{64}$/)
  })

  it('returns a consistent value when KUBB_AGENT_SECRET is not set', () => {
    expect(getMachineToken()).toBe(getMachineToken())
  })

  it('returns a deterministic value derived from KUBB_AGENT_SECRET when set', () => {
    process.env.KUBB_AGENT_SECRET = 'my-secret'

    const token = getMachineToken()

    expect(token).toBe(hashToken('my-secret'))
  })

  it('returns a different value for different KUBB_AGENT_SECRET values', () => {
    process.env.KUBB_AGENT_SECRET = 'secret-a'
    const tokenA = getMachineToken()

    process.env.KUBB_AGENT_SECRET = 'secret-b'
    const tokenB = getMachineToken()

    expect(tokenA).not.toBe(tokenB)
  })
})
