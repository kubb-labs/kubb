import { describe, expect, it } from 'vitest'
import { secureUrl } from './url.ts'

describe('secureUrl', () => {
  it.each([
    [{ studioUrl: 'https://kubb.studio' }, 'https://kubb.studio/api/runner/token'],
    [{ studioUrl: 'https://example.com/studio/' }, 'https://example.com/studio/api/runner/token'],
    [{ studioUrl: 'https://kubb.studio', socket: true }, 'wss://kubb.studio/api/runner/token'],
    [{ studioUrl: 'http://localhost:3000', socket: true }, 'ws://localhost:3000/api/runner/token'],
    [{ studioUrl: 'http://127.0.0.1:3000' }, 'http://127.0.0.1:3000/api/runner/token'],
    [{ studioUrl: 'http://[::1]:3000' }, 'http://[::1]:3000/api/runner/token'],
  ])('resolves %j', (options, expected) => {
    expect(secureUrl({ ...options, path: '/api/runner/token' }).href).toBe(expected)
  })

  it.each(['http://studio.example.com', 'http://10.0.0.1', 'http://[fe80::1]'])('refuses plaintext to %s', (studioUrl) => {
    expect(() => secureUrl({ studioUrl, path: '/api/snapshots' })).toThrow(`Refusing to reach Kubb Studio at ${studioUrl}`)
  })
})
