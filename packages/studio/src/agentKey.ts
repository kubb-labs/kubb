import { createPublicKey, generateKeyPairSync, hash, sign, verify } from 'node:crypto'
import type { AgentSignatureContext } from './protocol.ts'

// The signed bytes: UTF-8 of `${context}\n${payload}`.
function signedBytes(context: AgentSignatureContext, payload: string): Buffer {
  return Buffer.from(`${context}\n${payload}`, 'utf8')
}

/** Creates the agent's Ed25519 key as a PKCS #8 PEM string, to store with the token. */
export function generateAgentKey(): string {
  return generateKeyPairSync('ed25519').privateKey.export({ format: 'pem', type: 'pkcs8' }).toString()
}

/** The raw 32-byte public key of `privateKey`, base64url without padding. */
export function getAgentPublicKey(privateKey: string): string {
  return createPublicKey(privateKey).export({ format: 'jwk' }).x!
}

/** Signs `payload` for `context`, returning the Ed25519 signature in base64url. */
export function signAgentPayload({ privateKey, context, payload }: { privateKey: string; context: AgentSignatureContext; payload: string }): string {
  return sign(null, signedBytes(context, payload), privateKey).toString('base64url')
}

/** Checks a {@link signAgentPayload} signature; `false`, never a throw, for malformed input. */
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

/** The token refresh payload: `${signedAt}\n${sha256 hex of the token}`. */
export function getTokenRefreshPayload({ token, signedAt }: { token: string; signedAt: number }): string {
  return `${signedAt}\n${hash('sha256', token)}`
}
