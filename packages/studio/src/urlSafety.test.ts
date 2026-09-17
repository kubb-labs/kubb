import { describe, expect, it } from 'vitest'
import { assertSafeStorageUrl, assertSafeWebSocketUrl, resolveStudioUploadUrl } from './urlSafety.ts'

describe('urlSafety', () => {
  it('allows wss and loopback ws', () => {
    expect(() => assertSafeWebSocketUrl('wss://studio.kubb.dev/session')).not.toThrow()
    expect(() => assertSafeWebSocketUrl('ws://localhost:3000/session')).not.toThrow()
  })

  it('rejects plaintext ws off loopback', () => {
    expect(() => assertSafeWebSocketUrl('ws://evil.example/session')).toThrow(/unencrypted WebSocket/)
  })

  it('requires relative Studio upload paths', () => {
    expect(resolveStudioUploadUrl('/api/upload', 'https://studio.kubb.dev').href).toBe('https://studio.kubb.dev/api/upload')
    expect(() => resolveStudioUploadUrl('https://evil.example/upload', 'https://studio.kubb.dev')).toThrow(/relative Studio path/)
  })

  it('allows https storage and rejects private hosts for remote Studio', () => {
    expect(assertSafeStorageUrl('https://storage.example/object', 'https://studio.kubb.dev').href).toBe('https://storage.example/object')
    expect(() => assertSafeStorageUrl('http://storage.example/object', 'https://studio.kubb.dev')).toThrow(/non-HTTPS/)
    expect(() => assertSafeStorageUrl('https://127.0.0.1/object', 'https://studio.kubb.dev')).toThrow(/private or loopback/)
  })

  it('allows loopback http storage when Studio is local', () => {
    expect(assertSafeStorageUrl('http://127.0.0.1:9000/object', 'http://localhost:3000').href).toBe('http://127.0.0.1:9000/object')
  })
})
