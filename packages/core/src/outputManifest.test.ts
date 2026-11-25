import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createOutputManifest } from './outputManifest.ts'
import { fsStorage } from './storages/fsStorage.ts'

/**
 * What the formatter leaves behind for `const a = 1`: a semicolon and a trailing newline.
 */
const formatted = 'const a = 1;\n'

describe('createOutputManifest', () => {
  const roots: Array<string> = []
  const storage = fsStorage()

  afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
  })

  function project() {
    const root = mkdtempSync(join(tmpdir(), 'kubb-lock-'))
    roots.push(root)
    const file = (name: string) => join(root, 'gen', name)
    const lock = join(root, 'kubb.lock')

    return { root, file, lock, readLock: () => JSON.parse(readFileSync(lock, 'utf8')) as unknown }
  }

  /** A project whose lock file recorded `a.ts` and its formatted output, with the manifest the next run would load. */
  async function recorded() {
    const target = project()
    await storage.writeItem(target.file('a.ts'), formatted)
    const manifest = await createOutputManifest({ storage, root: target.root })
    manifest.track({ key: target.file('a.ts'), source: 'const a = 1' })
    await manifest.commit()

    return { ...target, manifest: await createOutputManifest({ storage, root: target.root }) }
  }

  it.each([
    ['the recorded source and output', { name: 'a.ts', source: 'const a = 1', disk: formatted }, true],
    ['the recorded output with CRLF line endings', { name: 'a.ts', source: 'const a = 1', disk: 'const a = 1;\r\n' }, true],
    ['an edited output with the same source', { name: 'a.ts', source: 'const a = 1', disk: 'const a = 999\n' }, false],
    ['a file it never recorded', { name: 'unknown.ts', source: 'const a = 1', disk: formatted }, false],
  ])('returns %s as up to date: %s', async (_name, { name, ...entry }, expected) => {
    const { manifest, file } = await recorded()

    expect(manifest.exists).toBe(true)
    expect(manifest.isUpToDate({ key: file(name), ...entry })).toBe(expected)
  })

  it('writes the files sorted and keyed by the path from the root', async () => {
    const { root, file, lock } = project()
    await storage.writeItem(file('b.ts'), 'const b = 2;\n')
    await storage.writeItem(file('a.ts'), formatted)
    const manifest = await createOutputManifest({ storage, root })
    manifest.track({ key: file('b.ts'), source: 'const b = 2' })
    manifest.track({ key: file('a.ts'), source: 'const a = 1' })
    await manifest.commit()

    const stored = JSON.parse(readFileSync(lock, 'utf8')) as { lockfileVersion: number; files: Record<string, { source: string; output: string }> }

    expect(stored.lockfileVersion).toBe(1)
    expect(Object.keys(stored.files)).toStrictEqual(['gen/a.ts', 'gen/b.ts'])
    expect(stored.files['gen/a.ts']).toStrictEqual({ source: expect.stringMatching(/^[0-9a-f]{64}$/), output: expect.stringMatching(/^[0-9a-f]{64}$/) })
  })

  it('records no entry for a file the output passes left as written', async () => {
    const { root, file, readLock } = project()
    await storage.writeItem(file('a.ts'), 'const a = 1')
    const manifest = await createOutputManifest({ storage, root })
    manifest.track({ key: file('a.ts'), source: 'const a = 1' })
    await manifest.commit()

    expect(readLock()).toStrictEqual({ lockfileVersion: 1, files: {} })
  })

  it('keeps the entries of another config generating into the same root', async () => {
    const { root, file } = await recorded()
    await storage.writeItem(file('second.ts'), 'const b = 2;\n')

    const second = await createOutputManifest({ storage, root })
    second.track({ key: file('second.ts'), source: 'const b = 2' })
    await second.commit()

    const third = await createOutputManifest({ storage, root })

    expect(third.isUpToDate({ key: file('a.ts'), source: 'const a = 1', disk: formatted })).toBe(true)
    expect(third.isUpToDate({ key: file('second.ts'), source: 'const b = 2', disk: 'const b = 2;\n' })).toBe(true)
  })

  it.each([
    ['was deleted', null],
    ['no longer holds the recorded output', 'const a = 999\n'],
  ])('drops the entry of a file that %s', async (_name, content) => {
    const { file, manifest, readLock } = await recorded()
    if (content === null) rmSync(file('a.ts'))
    else writeFileSync(file('a.ts'), content)

    await manifest.commit()

    expect(readLock()).toStrictEqual({ lockfileVersion: 1, files: {} })
  })

  it.each([
    ['no lock file', null],
    ['files that are not a record', JSON.stringify({ lockfileVersion: 1, files: 'nope' })],
    ['another version', JSON.stringify({ lockfileVersion: 0, files: { 'gen/a.ts': { source: 'x', output: 'y' } } })],
    ['corrupted content', 'not json'],
  ])('starts empty with %s', async (_name, stored) => {
    const { root, file, lock } = project()
    if (stored !== null) writeFileSync(lock, stored)
    const manifest = await createOutputManifest({ storage, root })

    expect(manifest.exists).toBe(false)
    expect(manifest.isUpToDate({ key: file('a.ts'), source: 'const a = 1', disk: formatted })).toBe(false)
  })

  it('skips a file that disappeared before the commit', async () => {
    const { root, file, readLock } = project()
    const manifest = await createOutputManifest({ storage, root })
    manifest.track({ key: file('gone.ts'), source: 'const a = 1' })
    await manifest.commit()

    expect(readLock()).toStrictEqual({ lockfileVersion: 1, files: {} })
  })

  it('does not fail the build when the lock file cannot be written', async () => {
    const { root, file, lock } = project()
    // A folder in the lock file's place: it can be neither read nor replaced.
    mkdirSync(lock)
    await storage.writeItem(file('a.ts'), formatted)
    const manifest = await createOutputManifest({ storage, root })
    manifest.track({ key: file('a.ts'), source: 'const a = 1' })

    await expect(manifest.commit()).resolves.toBeUndefined()
  })
})
