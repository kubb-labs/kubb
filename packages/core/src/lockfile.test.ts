import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createLockfile } from './lockfile.ts'
import { fsStorage } from './storages/fsStorage.ts'
import { memoryStorage } from './storages/memoryStorage.ts'

/**
 * What the formatter leaves behind for `const a = 1`: a semicolon and a trailing newline.
 */
const formatted = 'const a = 1;\n'

describe('createLockfile', () => {
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

  /** A project whose lock file recorded `a.ts` and its formatted output, with the lockfile the next run would load. */
  async function recorded() {
    const target = project()
    await storage.writeItem(target.file('a.ts'), formatted)
    const lockfile = await createLockfile({ storage, root: target.root })
    lockfile.track({ key: target.file('a.ts'), source: 'const a = 1' })
    await lockfile.write()

    return { ...target, lockfile: await createLockfile({ storage, root: target.root }) }
  }

  it.each([
    ['the recorded source and output', { name: 'a.ts', source: 'const a = 1', disk: formatted }, true],
    ['the recorded output with CRLF line endings', { name: 'a.ts', source: 'const a = 1', disk: 'const a = 1;\r\n' }, true],
    ['an edited output with the same source', { name: 'a.ts', source: 'const a = 1', disk: 'const a = 999\n' }, false],
    ['a file it never recorded', { name: 'unknown.ts', source: 'const a = 1', disk: formatted }, false],
  ])('returns %s as up to date: %s', async (_name, { name, ...entry }, expected) => {
    const { lockfile, file } = await recorded()

    expect(lockfile.exists).toBe(true)
    expect(lockfile.isUpToDate({ key: file(name), ...entry })).toBe(expected)
  })

  it('writes the files sorted and keyed by the path from the root', async () => {
    const { root, file, lock } = project()
    await storage.writeItem(file('b.ts'), 'const b = 2;\n')
    await storage.writeItem(file('a.ts'), formatted)
    const lockfile = await createLockfile({ storage, root })
    lockfile.track({ key: file('b.ts'), source: 'const b = 2' })
    lockfile.track({ key: file('a.ts'), source: 'const a = 1' })
    await lockfile.write()

    const stored = JSON.parse(readFileSync(lock, 'utf8')) as { lockfileVersion: number; files: Record<string, { source: string; output: string }> }

    expect(stored.lockfileVersion).toBe(1)
    expect(Object.keys(stored.files)).toStrictEqual(['gen/a.ts', 'gen/b.ts'])
    expect(stored.files['gen/a.ts']).toStrictEqual({ source: expect.stringMatching(/^[0-9a-f]{64}$/), output: expect.stringMatching(/^[0-9a-f]{64}$/) })
  })

  it('records a file the output passes left as written', async () => {
    const { root, file, readLock } = project()
    await storage.writeItem(file('a.ts'), 'const a = 1')
    const lockfile = await createLockfile({ storage, root })
    lockfile.track({ key: file('a.ts'), source: 'const a = 1' })
    await lockfile.write()

    expect(readLock()).toMatchObject({ files: { 'gen/a.ts': { source: expect.any(String), output: expect.any(String) } } })
  })

  it('keeps the entries of another config generating into the same root', async () => {
    const { root, file } = await recorded()
    await storage.writeItem(file('second.ts'), 'const b = 2;\n')

    const second = await createLockfile({ storage, root })
    second.track({ key: file('second.ts'), source: 'const b = 2' })
    await second.write()

    const third = await createLockfile({ storage, root })

    expect(third.isUpToDate({ key: file('a.ts'), source: 'const a = 1', disk: formatted })).toBe(true)
    expect(third.isUpToDate({ key: file('second.ts'), source: 'const b = 2', disk: 'const b = 2;\n' })).toBe(true)
  })

  it.each([
    ['was deleted', null],
    ['no longer holds the recorded output', 'const a = 999\n'],
  ])('drops the entry of a file that %s', async (_name, content) => {
    const { file, lockfile, readLock } = await recorded()
    if (content === null) rmSync(file('a.ts'))
    else writeFileSync(file('a.ts'), content)

    await lockfile.write()

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
    const lockfile = await createLockfile({ storage, root })

    expect(lockfile.exists).toBe(false)
    expect(lockfile.isUpToDate({ key: file('a.ts'), source: 'const a = 1', disk: formatted })).toBe(false)
  })

  it('keeps the inputs of each config, and drops a record that cannot be made', async () => {
    const { root, readLock } = project()
    const first = await createLockfile({ storage, root })
    await first.write({ name: 'api', inputs: { hash: 'a', sources: ['openapi.yaml'] } })
    const second = await createLockfile({ storage, root })
    await second.write({ name: 'admin', inputs: { hash: 'b', sources: [] } })

    expect((await createLockfile({ storage, root })).inputs('api')).toStrictEqual({ hash: 'a', sources: ['openapi.yaml'] })

    const third = await createLockfile({ storage, root })
    await third.write({ name: 'api', inputs: null })

    expect(readLock()).toStrictEqual({ lockfileVersion: 1, inputs: { admin: { hash: 'b', sources: [] } }, files: {} })
  })

  it.each([
    ['every file holds its recorded output', () => {}, true],
    ['a file was edited', ({ file }: { file: (name: string) => string }) => writeFileSync(file('a.ts'), 'const a = 999\n'), false],
    [
      'the cleaned folder holds a file the lock file does not list',
      ({ file }: { file: (name: string) => string }) => writeFileSync(file('extra.ts'), ''),
      false,
    ],
  ])('matches the disk when %s: %s', async (_name, change, expected) => {
    const target = await recorded()
    change(target)

    expect(await target.lockfile.matchesOutput({ cleanDir: join(target.root, 'gen') })).toBe(expected)
  })

  it('is allFilesUpToDate only while every tracked file was up to date', async () => {
    const { lockfile, file } = await recorded()
    lockfile.track({ key: file('a.ts'), source: 'const a = 1' })
    lockfile.isUpToDate({ key: file('a.ts'), source: 'const a = 1', disk: formatted })

    expect(lockfile.allFilesUpToDate).toBe(true)

    lockfile.track({ key: file('b.ts'), source: 'const b = 2' })

    expect(lockfile.allFilesUpToDate).toBe(false)
  })

  it('drops the inputs of the other configs when one of their files no longer holds its recorded output', async () => {
    const { root, file, readLock } = await recorded()
    const first = await createLockfile({ storage, root })
    await first.write({ name: 'api', inputs: { hash: 'a', sources: [] } })
    writeFileSync(file('a.ts'), 'const a = 999\n')

    const second = await createLockfile({ storage, root })
    await second.write({ name: 'admin', inputs: { hash: 'b', sources: [] } })

    expect(readLock()).toStrictEqual({ lockfileVersion: 1, inputs: { admin: { hash: 'b', sources: [] } }, files: {} })
  })

  it('ignores an inputs record that is not a hash with a list of sources', async () => {
    const { root, lock } = project()
    writeFileSync(lock, JSON.stringify({ lockfileVersion: 1, inputs: { api: { hash: 'a' }, admin: { hash: 'b', sources: ['openapi.yaml'] } }, files: {} }))
    const lockfile = await createLockfile({ storage, root })

    expect(lockfile.inputs('api')).toBeUndefined()
    expect(lockfile.inputs('admin')).toStrictEqual({ hash: 'b', sources: ['openapi.yaml'] })
  })

  it('writes the lock file through the storage, so a run that stages its files leaves the project alone', async () => {
    const { root, lock } = project()
    const staged = memoryStorage()
    await staged.writeItem(join(root, 'gen', 'a.ts'), formatted)
    const lockfile = await createLockfile({ storage: staged, root })
    lockfile.track({ key: join(root, 'gen', 'a.ts'), source: 'const a = 1' })
    await lockfile.write()

    expect(existsSync(lock)).toBe(false)
    expect(JSON.parse((await staged.readItem(lock)) as string)).toMatchObject({ files: { 'gen/a.ts': expect.anything() } })
  })

  it('skips a file that disappeared before the commit', async () => {
    const { root, file, readLock } = project()
    const lockfile = await createLockfile({ storage, root })
    lockfile.track({ key: file('gone.ts'), source: 'const a = 1' })
    await lockfile.write()

    expect(readLock()).toStrictEqual({ lockfileVersion: 1, files: {} })
  })

  it('does not fail the build when the lock file cannot be written', async () => {
    const { root, file, lock } = project()
    // A folder in the lock file's place: it can be neither read nor replaced.
    mkdirSync(lock)
    await storage.writeItem(file('a.ts'), formatted)
    const lockfile = await createLockfile({ storage, root })
    lockfile.track({ key: file('a.ts'), source: 'const a = 1' })

    await expect(lockfile.write()).resolves.toBeUndefined()
  })
})
