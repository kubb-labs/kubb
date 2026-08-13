import { describe, expect, it } from 'vitest'
import { createOutputManifest } from './outputManifest.ts'
import { memoryStorage } from './storages/memoryStorage.ts'

const MANIFEST_KEY = 'output-manifest.json'

/**
 * What the formatter leaves behind for `const a = 1`: a semicolon and a trailing newline.
 */
const formatted = 'const a = 1;\n'

describe('createOutputManifest', () => {
  it('starts empty when no cache exists yet', async () => {
    const manifest = await createOutputManifest({ storage: memoryStorage(), cache: memoryStorage() })

    expect(manifest.isUpToDate({ key: 'a.ts', source: 'const a = 1', disk: formatted })).toBe(false)
  })

  it('recognizes a source the output passes turned into what is stored', async () => {
    const storage = memoryStorage()
    const cache = memoryStorage()
    await storage.writeItem('a.ts', formatted)
    const manifest = await createOutputManifest({ storage, cache })
    manifest.track({ key: 'a.ts', source: 'const a = 1' })
    await manifest.commit()

    const next = await createOutputManifest({ storage, cache })

    expect(next.isUpToDate({ key: 'a.ts', source: 'const a = 1', disk: formatted })).toBe(true)
  })

  it('reports a changed source as out of date', async () => {
    const storage = memoryStorage()
    const cache = memoryStorage()
    await storage.writeItem('a.ts', formatted)
    const manifest = await createOutputManifest({ storage, cache })
    manifest.track({ key: 'a.ts', source: 'const a = 1' })
    await manifest.commit()

    const next = await createOutputManifest({ storage, cache })

    expect(next.isUpToDate({ key: 'a.ts', source: 'const a = 2', disk: formatted })).toBe(false)
  })

  it('reports an edited file as out of date even when the source is unchanged', async () => {
    const storage = memoryStorage()
    const cache = memoryStorage()
    await storage.writeItem('a.ts', formatted)
    const manifest = await createOutputManifest({ storage, cache })
    manifest.track({ key: 'a.ts', source: 'const a = 1' })
    await manifest.commit()

    const next = await createOutputManifest({ storage, cache })

    expect(next.isUpToDate({ key: 'a.ts', source: 'const a = 1', disk: 'const a = 999\n' })).toBe(false)
  })

  it('keeps entries from another config generating into the same root', async () => {
    const storage = memoryStorage()
    const cache = memoryStorage()
    await storage.writeItem('first.ts', formatted)
    await storage.writeItem('second.ts', 'const b = 2;\n')

    const first = await createOutputManifest({ storage, cache })
    first.track({ key: 'first.ts', source: 'const a = 1' })
    await first.commit()

    const second = await createOutputManifest({ storage, cache })
    second.track({ key: 'second.ts', source: 'const b = 2' })
    await second.commit()

    const third = await createOutputManifest({ storage, cache })

    expect(third.isUpToDate({ key: 'first.ts', source: 'const a = 1', disk: formatted })).toBe(true)
    expect(third.isUpToDate({ key: 'second.ts', source: 'const b = 2', disk: 'const b = 2;\n' })).toBe(true)
  })

  it('keeps entries a run with a different storage cannot see', async () => {
    const cache = memoryStorage()
    const real = memoryStorage()
    await real.writeItem('a.ts', formatted)

    const build = await createOutputManifest({ storage: real, cache })
    build.track({ key: 'a.ts', source: 'const a = 1' })
    await build.commit()

    // A dry run against an empty storage in the same root must not evict what the real build recorded.
    const dryRun = await createOutputManifest({ storage: memoryStorage(), cache })
    dryRun.track({ key: 'b.ts', source: 'const b = 2' })
    await dryRun.commit()

    const next = await createOutputManifest({ storage: real, cache })

    expect(next.isUpToDate({ key: 'a.ts', source: 'const a = 1', disk: formatted })).toBe(true)
  })

  it('reports whether a key was recorded at all', async () => {
    const storage = memoryStorage()
    const cache = memoryStorage()
    await storage.writeItem('a.ts', formatted)
    const manifest = await createOutputManifest({ storage, cache })
    manifest.track({ key: 'a.ts', source: 'const a = 1' })
    await manifest.commit()

    const next = await createOutputManifest({ storage, cache })

    expect(next.has({ key: 'a.ts' })).toBe(true)
    expect(next.has({ key: 'unknown.ts' })).toBe(false)
  })

  it('ignores a cache whose entries are not a record', async () => {
    const storage = memoryStorage()
    const cache = memoryStorage()
    await cache.writeItem(MANIFEST_KEY, JSON.stringify({ version: 1, entries: 'nope' }))
    const manifest = await createOutputManifest({ storage, cache })

    await expect(manifest.commit()).resolves.toBeUndefined()
    expect(manifest.has({ key: 'a.ts' })).toBe(false)
  })

  it('skips a file that disappeared before the commit', async () => {
    const storage = memoryStorage()
    const cache = memoryStorage()
    const manifest = await createOutputManifest({ storage, cache })
    manifest.track({ key: 'gone.ts', source: 'const a = 1' })
    await manifest.commit()

    const stored = JSON.parse((await cache.readItem(MANIFEST_KEY)) as string) as { entries: Record<string, unknown> }

    expect(stored.entries).toStrictEqual({})
  })

  it('ignores a cache written by an older version', async () => {
    const storage = memoryStorage()
    const cache = memoryStorage()
    await cache.writeItem(MANIFEST_KEY, JSON.stringify({ version: 0, entries: { 'a.ts': { source: 'x', output: 'y' } } }))
    const manifest = await createOutputManifest({ storage, cache })

    expect(manifest.isUpToDate({ key: 'a.ts', source: 'const a = 1', disk: formatted })).toBe(false)
  })

  it('ignores a corrupted cache', async () => {
    const storage = memoryStorage()
    const cache = memoryStorage()
    await cache.writeItem(MANIFEST_KEY, 'not json')
    const manifest = await createOutputManifest({ storage, cache })

    expect(manifest.isUpToDate({ key: 'a.ts', source: 'const a = 1', disk: formatted })).toBe(false)
  })

  it('does not fail the build when the cache cannot be written', async () => {
    const storage = memoryStorage()
    const cache = memoryStorage()
    await storage.writeItem('a.ts', formatted)
    const manifest = await createOutputManifest({ storage, cache })
    manifest.track({ key: 'a.ts', source: 'const a = 1' })
    cache.writeItem = async () => {
      throw new Error('read-only')
    }

    await expect(manifest.commit()).resolves.toBeUndefined()
  })
})
