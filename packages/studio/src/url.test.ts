import { describe, expect, it } from 'vitest'
import { publicApiUrl, secureUrl } from './url.ts'

describe('secureUrl', () => {
  it.each([
    [{ studioUrl: 'https://kubb.studio' }, 'https://kubb.studio/api/agent/token'],
    [{ studioUrl: 'https://example.com/studio/' }, 'https://example.com/studio/api/agent/token'],
    [{ studioUrl: 'https://kubb.studio', socket: true }, 'wss://kubb.studio/api/agent/token'],
    [{ studioUrl: 'http://localhost:3000', socket: true }, 'ws://localhost:3000/api/agent/token'],
    [{ studioUrl: 'http://127.0.0.1:3000' }, 'http://127.0.0.1:3000/api/agent/token'],
    [{ studioUrl: 'http://[::1]:3000' }, 'http://[::1]:3000/api/agent/token'],
  ])('resolves %j', (options, expected) => {
    expect(secureUrl({ ...options, path: '/api/agent/token' }).href).toBe(expected)
  })

  it.each(['http://studio.example.com', 'http://10.0.0.1', 'http://[fe80::1]'])('refuses plaintext to %s', (studioUrl) => {
    expect(() => secureUrl({ studioUrl, path: '/api/snapshots' })).toThrow(`Refusing to reach Kubb Studio at ${studioUrl}`)
  })
})

describe('publicApiUrl', () => {
  it.each([
    ['the hosted Studio', 'https://kubb.studio', 'https://api.kubb.studio/v1/snapshots'],
    ['the hosted Studio with a trailing slash', 'https://kubb.studio/', 'https://api.kubb.studio/v1/snapshots'],
    ['the dev Studio', 'https://dev.kubb.studio', 'https://api.dev.kubb.studio/v1/snapshots'],
    ['a self-hosted Studio under a path', 'https://studio.acme.dev/studio/', 'https://api.studio.acme.dev/v1/snapshots'],
    ['a Studio on this machine', 'http://localhost:3000', 'http://localhost:3000/v1/snapshots'],
  ])('resolves %s', (_label, studioUrl, expected) => {
    expect(publicApiUrl({ studioUrl, path: '/snapshots' }).href).toBe(expected)
  })

  it.each(['https://10.0.0.5', 'https://[2001:db8::10]'])('refuses %s, which has no api. hostname', (studioUrl) => {
    expect(() => publicApiUrl({ studioUrl, path: '/snapshots' })).toThrow('has no api. hostname for its public API')
  })

  it('refuses a plaintext Studio URL', () => {
    expect(() => publicApiUrl({ studioUrl: 'http://studio.acme.dev', path: '/snapshots' })).toThrow(
      'Refusing to reach Kubb Studio at http://api.studio.acme.dev',
    )
  })
})
