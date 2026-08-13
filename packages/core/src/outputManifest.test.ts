import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createOutputManifest, resolveOutputManifestPath } from './outputManifest.ts'

let dir: string
let path: string

beforeEach(async () => {
  dir = await mkdtemp(join(os.tmpdir(), 'kubb-manifest-'))
  path = join(dir, 'output-manifest.json')
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('resolveOutputManifestPath', () => {
  it('places the cache under node_modules/.cache so it is git-ignored', () => {
    expect(resolveOutputManifestPath('/project')).toBe('/project/node_modules/.cache/kubb/output-manifest.json')
  })
})

describe('createOutputManifest', () => {
  it('starts empty when no cache exists yet', async () => {
    const manifest = await createOutputManifest({ path })

    expect(manifest.isUpToDate({ key: 'a.ts', source: 'const a = 1', disk: 'const a = 1' })).toBe(false)
  })

  it('recognizes a source the output passes turned into what is on disk', async () => {
    const manifest = await createOutputManifest({ path })
    manifest.track({ key: 'a.ts', source: 'const a = 1' })
    await manifest.commit({ read: async () => 'const a = 1;\n', exists: async () => true })

    const next = await createOutputManifest({ path })

    expect(next.isUpToDate({ key: 'a.ts', source: 'const a = 1', disk: 'const a = 1;\n' })).toBe(true)
  })

  it('reports a changed source as out of date', async () => {
    const manifest = await createOutputManifest({ path })
    manifest.track({ key: 'a.ts', source: 'const a = 1' })
    await manifest.commit({ read: async () => 'const a = 1;\n', exists: async () => true })

    const next = await createOutputManifest({ path })

    expect(next.isUpToDate({ key: 'a.ts', source: 'const a = 2', disk: 'const a = 1;\n' })).toBe(false)
  })

  it('reports an edited file as out of date even when the source is unchanged', async () => {
    const manifest = await createOutputManifest({ path })
    manifest.track({ key: 'a.ts', source: 'const a = 1' })
    await manifest.commit({ read: async () => 'const a = 1;\n', exists: async () => true })

    const next = await createOutputManifest({ path })

    expect(next.isUpToDate({ key: 'a.ts', source: 'const a = 1', disk: 'const a = 999\n' })).toBe(false)
  })

  it('keeps entries from another config generating into the same root', async () => {
    const first = await createOutputManifest({ path })
    first.track({ key: 'first.ts', source: 'const a = 1' })
    await first.commit({ read: async () => 'const a = 1;\n', exists: async () => true })

    const second = await createOutputManifest({ path })
    second.track({ key: 'second.ts', source: 'const b = 2' })
    await second.commit({ read: async () => 'const b = 2;\n', exists: async () => true })

    const third = await createOutputManifest({ path })

    expect(third.isUpToDate({ key: 'first.ts', source: 'const a = 1', disk: 'const a = 1;\n' })).toBe(true)
    expect(third.isUpToDate({ key: 'second.ts', source: 'const b = 2', disk: 'const b = 2;\n' })).toBe(true)
  })

  it('drops entries whose file is gone', async () => {
    const first = await createOutputManifest({ path })
    first.track({ key: 'deleted.ts', source: 'const a = 1' })
    await first.commit({ read: async () => 'const a = 1;\n', exists: async () => true })

    const second = await createOutputManifest({ path })
    second.track({ key: 'kept.ts', source: 'const b = 2' })
    await second.commit({ read: async () => 'const b = 2;\n', exists: async () => false })

    const stored = JSON.parse(await readFile(path, { encoding: 'utf-8' })) as { entries: Record<string, unknown> }

    expect(Object.keys(stored.entries)).toStrictEqual(['kept.ts'])
  })

  it('skips a file that disappeared before the commit', async () => {
    const manifest = await createOutputManifest({ path })
    manifest.track({ key: 'gone.ts', source: 'const a = 1' })
    await manifest.commit({ read: async () => null, exists: async () => false })

    const stored = JSON.parse(await readFile(path, { encoding: 'utf-8' })) as { entries: Record<string, unknown> }

    expect(stored.entries).toStrictEqual({})
  })

  it('ignores a cache written by an older version', async () => {
    await writeFile(path, JSON.stringify({ version: 0, entries: { 'a.ts': { source: 'x', output: 'y' } } }), { encoding: 'utf-8' })
    const manifest = await createOutputManifest({ path })

    expect(manifest.isUpToDate({ key: 'a.ts', source: 'const a = 1', disk: 'const a = 1' })).toBe(false)
  })

  it('ignores a corrupted cache', async () => {
    await writeFile(path, 'not json', { encoding: 'utf-8' })

    await expect(createOutputManifest({ path })).resolves.toBeDefined()
  })

  it('does not fail the build when the cache cannot be written', async () => {
    const manifest = await createOutputManifest({ path: join(dir, 'file.txt', 'nested', 'manifest.json') })
    await writeFile(join(dir, 'file.txt'), 'blocking', { encoding: 'utf-8' })
    manifest.track({ key: 'a.ts', source: 'const a = 1' })

    await expect(manifest.commit({ read: async () => 'const a = 1;\n', exists: async () => true })).resolves.toBeUndefined()
  })
})
