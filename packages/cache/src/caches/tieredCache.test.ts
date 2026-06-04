import type { Cache, CachedSnapshot } from '@kubb/core'
import { describe, expect, it, vi } from 'vitest'
import { tieredCache } from './tieredCache.ts'

function fakeCache(name: string, initial?: Record<string, CachedSnapshot>): Cache {
  const store = new Map<string, CachedSnapshot>(Object.entries(initial ?? {}))
  return {
    name,
    restore: vi.fn(async ({ key }) => store.get(key) ?? null),
    persist: vi.fn(async ({ key, snapshot }) => {
      store.set(key, snapshot)
    }),
  }
}

describe('tieredCache', () => {
  const snapshot = { files: { 'a.ts': 'a' } }

  it('returns a local hit without touching the remote tier', async () => {
    const local = fakeCache('local', { key: snapshot })
    const remote = fakeCache('remote')
    const cache = tieredCache([local, remote])

    expect(await cache.restore({ key: 'key' })).toStrictEqual(snapshot)
    expect(remote.restore).not.toHaveBeenCalled()
  })

  it('back-fills faster tiers on a remote hit', async () => {
    const local = fakeCache('local')
    const remote = fakeCache('remote', { key: snapshot })
    const cache = tieredCache([local, remote])

    expect(await cache.restore({ key: 'key' })).toStrictEqual(snapshot)
    expect(local.persist).toHaveBeenCalledWith({ key: 'key', snapshot })
    expect(await local.restore({ key: 'key' })).toStrictEqual(snapshot)
  })

  it('persists to every tier', async () => {
    const local = fakeCache('local')
    const remote = fakeCache('remote')
    await tieredCache([local, remote]).persist({ key: 'key', snapshot })

    expect(local.persist).toHaveBeenCalled()
    expect(remote.persist).toHaveBeenCalled()
  })

  it('survives a failing tier on restore and persist', async () => {
    const broken: Cache = {
      name: 'broken',
      restore: vi.fn(async () => {
        throw new Error('down')
      }),
      persist: vi.fn(async () => {
        throw new Error('down')
      }),
    }
    const local = fakeCache('local', { key: snapshot })
    const cache = tieredCache([broken, local])

    expect(await cache.restore({ key: 'key' })).toStrictEqual(snapshot)
    await expect(cache.persist({ key: 'key', snapshot })).resolves.toBeUndefined()
  })
})
