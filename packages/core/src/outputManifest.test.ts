import { describe, expect, it } from 'vitest'
import { createOutputManifest } from './outputManifest.ts'
import { memoryStorage } from './storages/memoryStorage.ts'

const root = '/project'
const LOCK_PATH = '/project/kubb.lock'

/**
 * What the formatter leaves behind for `const a = 1`: a semicolon and a trailing newline.
 */
const formatted = 'const a = 1;\n'

/** A manifest that recorded `a.ts` and its formatted output, reopened as the next run would see it. */
async function recordedManifest() {
  const storage = memoryStorage()
  const lock = memoryStorage()
  await storage.writeItem('/project/gen/a.ts', formatted)
  const manifest = await createOutputManifest({ storage, root, lock })
  manifest.track({ key: '/project/gen/a.ts', source: 'const a = 1' })
  await manifest.commit()

  return { storage, lock, manifest: await createOutputManifest({ storage, root, lock }) }
}

describe('createOutputManifest', () => {
  it.each([
    ['the recorded source and output', { key: '/project/gen/a.ts', source: 'const a = 1', disk: formatted }, true],
    ['the recorded output with CRLF line endings', { key: '/project/gen/a.ts', source: 'const a = 1', disk: 'const a = 1;\r\n' }, true],
    ['an edited output with the same source', { key: '/project/gen/a.ts', source: 'const a = 1', disk: 'const a = 999\n' }, false],
    ['a key it never recorded', { key: '/project/gen/unknown.ts', source: 'const a = 1', disk: formatted }, false],
  ])('returns %s as up to date: %s', async (_name, entry, expected) => {
    const { manifest } = await recordedManifest()

    expect(manifest.exists).toBe(true)
    expect(manifest.isUpToDate(entry)).toBe(expected)
  })

  it('writes one sorted line per file, keyed by the path from the root', async () => {
    const storage = memoryStorage()
    const lock = memoryStorage()
    await storage.writeItem('/project/gen/b.ts', 'const b = 2;\n')
    await storage.writeItem('/project/gen/a.ts', formatted)
    const manifest = await createOutputManifest({ storage, root, lock })
    manifest.track({ key: '/project/gen/b.ts', source: 'const b = 2' })
    manifest.track({ key: '/project/gen/a.ts', source: 'const a = 1' })
    await manifest.commit()

    const lines = ((await lock.readItem(LOCK_PATH)) as string).split('\n')

    expect(lines.slice(0, 3)).toStrictEqual(['{', '  "lockfileVersion": 1,', '  "files": {'])
    expect(lines[3]).toMatch(/^ {4}"gen\/a\.ts": \{ "source": "[0-9a-f]{64}", "output": "[0-9a-f]{64}" \},$/)
    expect(lines[4]).toMatch(/^ {4}"gen\/b\.ts": \{ "source": "[0-9a-f]{64}", "output": "[0-9a-f]{64}" \}$/)
  })

  it('records no entry for a file the output passes left as written', async () => {
    const storage = memoryStorage()
    const lock = memoryStorage()
    await storage.writeItem('/project/gen/a.ts', 'const a = 1\n')
    const manifest = await createOutputManifest({ storage, root, lock })
    manifest.track({ key: '/project/gen/a.ts', source: 'const a = 1' })
    await manifest.commit()

    expect(JSON.parse((await lock.readItem(LOCK_PATH)) as string)).toStrictEqual({ lockfileVersion: 1, files: {} })
  })

  it('keeps the entries of another config generating into the same root', async () => {
    const { storage, lock } = await recordedManifest()
    await storage.writeItem('/project/gen/second.ts', 'const b = 2;\n')

    const second = await createOutputManifest({ storage, root, lock })
    second.track({ key: '/project/gen/second.ts', source: 'const b = 2' })
    await second.commit()

    const third = await createOutputManifest({ storage, root, lock })

    expect(third.isUpToDate({ key: '/project/gen/a.ts', source: 'const a = 1', disk: formatted })).toBe(true)
    expect(third.isUpToDate({ key: '/project/gen/second.ts', source: 'const b = 2', disk: 'const b = 2;\n' })).toBe(true)
  })

  it.each([
    ['was deleted', null],
    ['no longer holds the recorded output', 'const a = 999\n'],
  ])('drops the entry of a file that %s', async (_name, content) => {
    const { storage, lock, manifest } = await recordedManifest()
    if (content === null) await storage.removeItem('/project/gen/a.ts')
    else await storage.writeItem('/project/gen/a.ts', content)

    await manifest.commit()

    expect(JSON.parse((await lock.readItem(LOCK_PATH)) as string)).toStrictEqual({ lockfileVersion: 1, files: {} })
  })

  it.each([
    ['no lock file', null],
    ['files that are not a record', JSON.stringify({ lockfileVersion: 1, files: 'nope' })],
    ['an older version', JSON.stringify({ lockfileVersion: 0, files: { 'gen/a.ts': { source: 'x', output: 'y' } } })],
    ['corrupted content', 'not json'],
  ])('starts empty with %s', async (_name, stored) => {
    const storage = memoryStorage()
    const lock = memoryStorage()
    if (stored !== null) await lock.writeItem(LOCK_PATH, stored)
    const manifest = await createOutputManifest({ storage, root, lock })

    expect(manifest.exists).toBe(false)
    expect(manifest.isUpToDate({ key: '/project/gen/a.ts', source: 'const a = 1', disk: formatted })).toBe(false)
    await expect(manifest.commit()).resolves.toBeUndefined()
  })

  it('skips a file that disappeared before the commit', async () => {
    const lock = memoryStorage()
    const manifest = await createOutputManifest({ storage: memoryStorage(), root, lock })
    manifest.track({ key: '/project/gen/gone.ts', source: 'const a = 1' })
    await manifest.commit()

    expect(JSON.parse((await lock.readItem(LOCK_PATH)) as string)).toStrictEqual({ lockfileVersion: 1, files: {} })
  })

  it('does not fail the build when the lock file cannot be written', async () => {
    const storage = memoryStorage()
    const lock = memoryStorage()
    await storage.writeItem('/project/gen/a.ts', formatted)
    const manifest = await createOutputManifest({ storage, root, lock })
    manifest.track({ key: '/project/gen/a.ts', source: 'const a = 1' })
    lock.writeItem = async () => {
      throw new Error('read-only')
    }

    await expect(manifest.commit()).resolves.toBeUndefined()
  })
})
