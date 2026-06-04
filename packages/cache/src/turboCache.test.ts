import { afterEach, describe, expect, it, vi } from 'vitest'
import { serializeArtifact } from './artifact.ts'
import { turboCache } from './turboCache.ts'

type FetchFn = (url: string | URL | Request, init?: RequestInit) => Promise<Response>

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('turboCache', () => {
  it('downloads and deserializes an artifact on a hit', async () => {
    const snapshot = { files: { 'pet.ts': 'export type Pet = {}' } }
    const fetchMock = vi.fn<FetchFn>(async () => new Response(new Blob([serializeArtifact(snapshot)]), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const cache = turboCache({ url: 'https://cache.example.com', token: 'secret', teamId: 'team_1' })
    expect(await cache.restore({ key: 'hash-1' })).toStrictEqual(snapshot)

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://cache.example.com/v8/artifacts/hash-1?teamId=team_1')
    expect(init!.headers).toMatchObject({ Authorization: 'Bearer secret' })
  })

  it('treats a 404 as a miss', async () => {
    vi.stubGlobal('fetch', vi.fn<FetchFn>(async () => new Response(null, { status: 404 })))
    expect(await turboCache({ url: 'https://cache.example.com' }).restore({ key: 'x' })).toBeNull()
  })

  it('returns null on a network error instead of throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchFn>(async () => {
        throw new Error('ECONNREFUSED')
      }),
    )
    expect(await turboCache({ url: 'https://cache.example.com' }).restore({ key: 'x' })).toBeNull()
  })

  it('uploads with a PUT and signs when a signature key is set', async () => {
    const fetchMock = vi.fn<FetchFn>(async () => new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const cache = turboCache({ url: 'https://cache.example.com', token: 'secret', signatureKey: 'sign-me' })
    await cache.persist({ key: 'hash-2', snapshot: { files: { 'a.ts': 'a' } } })

    const [, init] = fetchMock.mock.calls[0]!
    expect(init!.method).toBe('PUT')
    expect(init!.headers).toMatchObject({ 'Content-Type': 'application/octet-stream' })
    expect(init!.headers).toHaveProperty('x-artifact-tag')
  })

  it('warns but does not throw when an upload fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn<FetchFn>(async () => {
        throw new Error('offline')
      }),
    )

    await expect(turboCache({ url: 'https://cache.example.com' }).persist({ key: 'x', snapshot: { files: {} } })).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalled()
  })

  it('is a no-op without a configured url', async () => {
    vi.stubEnv('TURBO_API', '')
    const fetchMock = vi.fn<FetchFn>()
    vi.stubGlobal('fetch', fetchMock)
    const cache = turboCache({ url: undefined })
    expect(await cache.restore({ key: 'x' })).toBeNull()
    await cache.persist({ key: 'x', snapshot: { files: {} } })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
