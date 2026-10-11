import { describe, expect, it } from 'vitest'
import { isLoopbackHost, secureUrl } from './url.ts'

describe('isLoopbackHost', () => {
  it.each(['localhost', '127.0.0.1', '[::1]'])('returns true for %s', (hostname) => {
    expect(isLoopbackHost(hostname)).toBe(true)
  })

  it.each(['studio.kubb.dev', '10.0.0.1', '[fe80::1]'])('returns false for %s', (hostname) => {
    expect(isLoopbackHost(hostname)).toBe(false)
  })
})

describe('secureUrl', () => {
  it.each([
    ['https://kubb.studio', {}, 'https://kubb.studio/api/agent/token'],
    ['https://example.com/studio/', {}, 'https://example.com/studio/api/agent/token'],
    ['https://kubb.studio', { socket: true }, 'wss://kubb.studio/api/agent/token'],
    ['http://localhost:3000', { socket: true }, 'ws://localhost:3000/api/agent/token'],
  ])('resolves %s %j', (studioUrl, options, expected) => {
    expect(secureUrl(studioUrl, '/api/agent/token', options).href).toBe(expected)
  })

  it('refuses plaintext to a remote host', () => {
    expect(() => secureUrl('http://studio.example.com', '/api/snapshots')).toThrow('Refusing to reach Kubb Studio at http://studio.example.com')
  })
})
