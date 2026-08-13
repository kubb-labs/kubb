import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cacheStorage, resolveCacheDir } from './cacheStorage.ts'

let dir: string
const dirs: Array<string> = []

afterEach(() => {
  for (const created of [dir, ...dirs]) {
    if (created) rmSync(created, { recursive: true, force: true })
  }
  dirs.length = 0
})

describe('resolveCacheDir', () => {
  it('uses node_modules/.cache when the project has a node_modules', () => {
    dir = mkdtempSync(join(tmpdir(), 'kubb-cache-'))
    mkdirSync(join(dir, 'node_modules'))

    expect(resolveCacheDir(dir)).toBe(join(dir, 'node_modules', '.cache', 'kubb'))
  })

  it('falls back to the OS temp directory without a node_modules', () => {
    dir = mkdtempSync(join(tmpdir(), 'kubb-cache-'))

    expect(resolveCacheDir(dir).startsWith(join(tmpdir(), 'kubb'))).toBe(true)
  })

  it('gives two roots sharing the temp directory their own cache', () => {
    dir = mkdtempSync(join(tmpdir(), 'kubb-cache-'))
    const other = mkdtempSync(join(tmpdir(), 'kubb-cache-'))
    dirs.push(other)

    expect(resolveCacheDir(dir)).not.toBe(resolveCacheDir(other))
  })
})

describe('cacheStorage', () => {
  it('returns a storage with name "cache"', () => {
    expect(cacheStorage().name).toBe('cache')
  })

  it('resolves plain keys inside the cache directory', async () => {
    dir = mkdtempSync(join(tmpdir(), 'kubb-cache-'))
    mkdirSync(join(dir, 'node_modules'))
    const storage = cacheStorage({ root: dir })

    await storage.writeItem('manifest.json', '{"a":1}')

    expect(await storage.readItem('manifest.json')).toBe('{"a":1}\n')
    expect(await storage.existsItem('manifest.json')).toBe(true)
  })

  it('returns null for a key it never stored', async () => {
    dir = mkdtempSync(join(tmpdir(), 'kubb-cache-'))
    mkdirSync(join(dir, 'node_modules'))

    expect(await cacheStorage({ root: dir }).readItem('missing.json')).toBeNull()
  })

  it('removes a stored key', async () => {
    dir = mkdtempSync(join(tmpdir(), 'kubb-cache-'))
    mkdirSync(join(dir, 'node_modules'))
    const storage = cacheStorage({ root: dir })
    await storage.writeItem('manifest.json', '{"a":1}')

    await storage.removeItem('manifest.json')

    expect(await storage.existsItem('manifest.json')).toBe(false)
  })
})
