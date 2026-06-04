import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fsCache } from './fsCache.ts'

describe('fsCache', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-cache-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('restores a persisted snapshot byte-for-byte', async () => {
    const cache = fsCache({ dir })
    const snapshot = { files: { 'types/pet.ts': 'export type Pet = { id: number }', 'index.ts': "export * from './types/pet'" } }
    await cache.persist({ key: 'key-1', snapshot })
    expect(await cache.restore({ key: 'key-1' })).toStrictEqual(snapshot)
  })

  it('returns null on a miss', async () => {
    expect(await fsCache({ dir }).restore({ key: 'nope' })).toBeNull()
  })

  it('evicts the least-recently-used entry past maxEntries', async () => {
    const cache = fsCache({ dir, maxEntries: 1 })
    await cache.persist({ key: 'old', snapshot: { files: { 'a.ts': 'a' } } })
    await cache.persist({ key: 'new', snapshot: { files: { 'b.ts': 'b' } } })

    expect(await cache.restore({ key: 'new' })).toStrictEqual({ files: { 'b.ts': 'b' } })
    expect(await cache.restore({ key: 'old' })).toBeNull()
  })

  it('evicts entries older than the TTL on the next persist', async () => {
    const cache = fsCache({ dir, ttlDays: 0 })
    await cache.persist({ key: 'stale', snapshot: { files: { 'a.ts': 'a' } } })
    // ttlDays: 0 means any positive age is stale; the second persist triggers the prune.
    await new Promise((done) => setTimeout(done, 5))
    await cache.persist({ key: 'fresh', snapshot: { files: { 'b.ts': 'b' } } })

    expect(await cache.restore({ key: 'stale' })).toBeNull()
  })
})
