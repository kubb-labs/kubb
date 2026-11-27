import { afterEach, describe, expect, it, vi } from 'vitest'
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
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it.each([
    ['the hosted Studio', 'https://kubb.studio', '', 'https://api.kubb.studio/v1/snapshots'],
    ['the hosted Studio with a trailing slash', 'https://kubb.studio/', '', 'https://api.kubb.studio/v1/snapshots'],
    ['another Studio', 'https://studio.acme.dev', '', 'https://studio.acme.dev/api/snapshots'],
    ['KUBB_STUDIO_API_URL', 'https://studio.acme.dev', 'https://api.acme.dev/ignored-path', 'https://api.acme.dev/v1/snapshots'],
    ['a local Studio', 'http://localhost:3000', '', 'http://localhost:3000/api/snapshots'],
  ])('resolves %s', (_label, studioUrl, apiUrl, expected) => {
    vi.stubEnv('KUBB_STUDIO_API_URL', apiUrl)

    expect(publicApiUrl({ studioUrl, path: '/snapshots' }).href).toBe(expected)
  })

  it('names KUBB_STUDIO_API_URL when it is not a URL', () => {
    vi.stubEnv('KUBB_STUDIO_API_URL', 'api.acme.dev')

    expect(() => publicApiUrl({ studioUrl: 'https://kubb.studio', path: '/snapshots' })).toThrow('KUBB_STUDIO_API_URL is not a URL: api.acme.dev')
  })

  it('refuses a plaintext KUBB_STUDIO_API_URL', () => {
    vi.stubEnv('KUBB_STUDIO_API_URL', 'http://api.acme.dev')

    expect(() => publicApiUrl({ studioUrl: 'https://kubb.studio', path: '/snapshots' })).toThrow('Refusing to reach Kubb Studio at http://api.acme.dev')
  })
})
