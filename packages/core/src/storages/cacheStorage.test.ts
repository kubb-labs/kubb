import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cacheStorage, resolveCacheDir } from './cacheStorage.ts'

const dirs: Array<string> = []

function makeDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'kubb-cache-'))
  dirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('resolveCacheDir', () => {
  it('uses node_modules/.cache when the project has a node_modules', () => {
    const dir = makeDir()
    mkdirSync(join(dir, 'node_modules'))

    expect(resolveCacheDir(dir)).toBe(join(dir, 'node_modules', '.cache', 'kubb'))
  })

  it('falls back to the OS temp directory without a node_modules', () => {
    expect(resolveCacheDir(makeDir()).startsWith(join(tmpdir(), 'kubb'))).toBe(true)
  })

  it('gives two roots sharing the temp directory their own cache', () => {
    expect(resolveCacheDir(makeDir())).not.toBe(resolveCacheDir(makeDir()))
  })
})

describe('cacheStorage', () => {
  it('passes reads, writes and removes through to plain keys inside the cache directory', async () => {
    const dir = makeDir()
    mkdirSync(join(dir, 'node_modules'))
    const storage = cacheStorage({ root: dir })

    expect(await storage.readItem('missing.json')).toBeNull()

    await storage.writeItem('manifest.json', '{"a":1}')

    expect(await storage.readItem('manifest.json')).toBe('{"a":1}\n')
    expect(await storage.existsItem('manifest.json')).toBe(true)

    await storage.removeItem('manifest.json')

    expect(await storage.existsItem('manifest.json')).toBe(false)
  })
})
