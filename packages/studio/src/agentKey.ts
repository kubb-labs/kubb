import { createPublicKey, generateKeyPairSync, hash, sign, verify } from 'node:crypto'
import type { AgentSignatureContext } from './protocol.ts'

function signedBytes(context: AgentSignatureContext, payload: string): Buffer {
  return Buffer.from(`${context}\n${payload}`, 'utf8')
}

/**
 * Creates the agent's Ed25519 key as a PKCS #8 PEM string, to store with the token.
 */
export function generateAgentKey(): string {
  return generateKeyPairSync('ed25519').privateKey.export({ format: 'pem', type: 'pkcs8' }).toString()
}

/**
 * Returns the raw 32-byte public key of `privateKey`, base64url without padding.
 */
export function getAgentPublicKey(privateKey: string): string {
  return createPublicKey(privateKey).export({ format: 'jwk' }).x!
}

/**
 * Signs `payload` for `context` and returns the Ed25519 signature in base64url.
 */
export function signAgentPayload({ privateKey, context, payload }: { privateKey: string; context: AgentSignatureContext; payload: string }): string {
  return sign(null, signedBytes(context, payload), privateKey).toString('base64url')
}

/**
 * Checks a {@link signAgentPayload} signature. Malformed input returns `false` and never throws.
 */
export function verifyAgentSignature({
  publicKey,
  context,
  payload,
  signature,
}: {
  publicKey: string
  context: AgentSignatureContext
  payload: string
  signature: string
}): boolean {
  try {
    const key = createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: publicKey }, format: 'jwk' })
    return verify(null, signedBytes(context, payload), key, Buffer.from(signature, 'base64url'))
  } catch {
    return false
  }
}

export function getTokenRefreshPayload({ token, signedAt }: { token: string; signedAt: number }): string {
  return `${signedAt}\n${hash('sha256', token)}`
}
