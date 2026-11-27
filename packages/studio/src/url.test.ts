import { describe, expect, it, vi } from 'vitest'
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
  const settings = (response: Response | Promise<Response>) => vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(response))

  it('uses the public API origin Studio reports', async () => {
    using fetchMock = settings(Response.json({ apiUrl: 'https://api.kubb.studio' }))

    await expect(publicApiUrl({ studioUrl: 'https://kubb.studio', path: '/snapshots' })).resolves.toHaveProperty('href', 'https://api.kubb.studio/v1/snapshots')
    expect(String(fetchMock.mock.calls[0]![0])).toBe('https://kubb.studio/api/settings')
  })

  it.each([
    ['no public API', Response.json({ apiUrl: null })],
    ['an older Studio without the field', Response.json({ mcpUrl: null })],
    ['a failed lookup', new Response('down', { status: 503 })],
    ['a value that is not a URL', Response.json({ apiUrl: 'api' })],
  ])('falls back to /api with %s', async (_label, response) => {
    using _ = settings(response)

    await expect(publicApiUrl({ studioUrl: 'https://kubb.studio', path: '/snapshots' })).resolves.toHaveProperty('href', 'https://kubb.studio/api/snapshots')
  })

  it('falls back to /api when Studio cannot be reached', async () => {
    using _ = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'))

    await expect(publicApiUrl({ studioUrl: 'https://kubb.studio', path: '/agents' })).resolves.toHaveProperty('href', 'https://kubb.studio/api/agents')
  })

  it('refuses a plaintext public API origin, so the key never crosses the network unencrypted', async () => {
    using _ = settings(Response.json({ apiUrl: 'http://api.example.com' }))

    await expect(publicApiUrl({ studioUrl: 'https://kubb.studio', path: '/snapshots' })).rejects.toThrow(
      'Refusing to reach Kubb Studio at http://api.example.com',
    )
  })
})
