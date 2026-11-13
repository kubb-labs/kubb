import { createPublicKey, generateKeyPairSync, hash, sign, verify } from 'node:crypto'
import type { AgentSignatureContext } from './protocol.ts'

/**
 * The bytes an agent signs: the UTF-8 encoding of `context`, a line feed, and `payload`.
 * No context holds a line feed, so a signature made for one context never verifies for another.
 */
function signedBytes(context: AgentSignatureContext, payload: string): Buffer {
  return Buffer.from(`${context}\n${payload}`, 'utf8')
}

/**
 * Creates the Ed25519 key an agent keeps on its machine, as a PKCS #8 PEM string. Store it next to
 * the token, with the same file permissions, and never send or log it.
 */
export function generateAgentKey(): string {
  return generateKeyPairSync('ed25519').privateKey.export({ format: 'pem', type: 'pkcs8' }).toString()
}

/**
 * The public half of `privateKey` as Studio stores it: the raw 32-byte Ed25519 key, base64url without padding.
 */
export function getAgentPublicKey(privateKey: string): string {
  return createPublicKey(privateKey).export({ format: 'jwk' }).x!
}

/**
 * Signs `payload` for `context` with the agent key. Returns the 64-byte Ed25519 signature, base64url without padding.
 */
export function signAgentPayload({ privateKey, context, payload }: { privateKey: string; context: AgentSignatureContext; payload: string }): string {
  return sign(null, signedBytes(context, payload), privateKey).toString('base64url')
}

/**
 * Checks a signature from {@link signAgentPayload} against the public key the agent paired with.
 * Returns `false`, never throws, for a malformed key or signature.
 *
 * @example
 * ```ts
 * verifyAgentSignature({ publicKey, context: AgentSignatureContext.CONNECT, payload: challenge, signature: payload.signature })
 * ```
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

/**
 * The payload a token refresh signs under {@link AgentSignatureContext.TOKEN_REFRESH}: `signedAt` in
 * decimal, a line feed, and the SHA-256 of the bearer token in lowercase hex. Binding the token makes
 * the signature worthless once that token is retired, and `signedAt` lets Studio refuse an old one.
 */
export function getTokenRefreshPayload({ token, signedAt }: { token: string; signedAt: number }): string {
  return `${signedAt}\n${hash('sha256', token)}`
}
