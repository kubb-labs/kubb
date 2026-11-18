import { hash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { generateAgentKey, getAgentPublicKey, getTokenRefreshPayload, signAgentPayload, verifyAgentSignature } from './agentKey.ts'
import { AgentSignatureContext } from './protocol.ts'

const privateKey = generateAgentKey()
const publicKey = getAgentPublicKey(privateKey)

describe('agent key', () => {
  it('is an Ed25519 PKCS #8 key whose public half is the raw 32-byte key in base64url', () => {
    expect(privateKey).toMatch(/^-----BEGIN PRIVATE KEY-----\n/)
    expect(Buffer.from(publicKey, 'base64url')).toHaveLength(32)
    expect(generateAgentKey()).not.toBe(privateKey)
  })

  it('signs a payload that verifies with the public key, for its own context only', () => {
    const signature = signAgentPayload({ privateKey, context: AgentSignatureContext.CONNECT, payload: 'challenge' })

    expect(Buffer.from(signature, 'base64url')).toHaveLength(64)
    expect(verifyAgentSignature({ publicKey, context: AgentSignatureContext.CONNECT, payload: 'challenge', signature })).toBe(true)
    expect(verifyAgentSignature({ publicKey, context: AgentSignatureContext.TOKEN_REFRESH, payload: 'challenge', signature })).toBe(false)
    expect(verifyAgentSignature({ publicKey, context: AgentSignatureContext.CONNECT, payload: 'other', signature })).toBe(false)
    expect(
      verifyAgentSignature({ publicKey: getAgentPublicKey(generateAgentKey()), context: AgentSignatureContext.CONNECT, payload: 'challenge', signature }),
    ).toBe(false)
  })

  it('returns false instead of throwing for a malformed key or signature', () => {
    const signature = signAgentPayload({ privateKey, context: AgentSignatureContext.CONNECT, payload: 'challenge' })

    expect(verifyAgentSignature({ publicKey: 'not-a-key', context: AgentSignatureContext.CONNECT, payload: 'challenge', signature })).toBe(false)
    expect(verifyAgentSignature({ publicKey, context: AgentSignatureContext.CONNECT, payload: 'challenge', signature: 'short' })).toBe(false)
  })

  it('binds a refresh to the time and the SHA-256 of the token', () => {
    expect(getTokenRefreshPayload({ token: 'token', signedAt: 1700000000000 })).toBe(`1700000000000\n${hash('sha256', 'token')}`)
  })
})
