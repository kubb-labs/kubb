import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { mkdir, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fsStorage } from './fsStorage.ts'

describe('fsStorage', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'kubb-fs-storage-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('returns a storage with name "fs"', () => {
    expect(fsStorage().name).toBe('fs')
  })

  it('setItem writes a file and getItem reads it back', async () => {
    const storage = fsStorage()
    const key = join(dir, 'hello.ts')

    await storage.setItem(key, 'export const x = 1')
    const result = await storage.getItem(key)

    expect(result).toBe('export const x = 1')
  })

  it('setItem creates missing parent directories', async () => {
    const storage = fsStorage()
    const key = join(dir, 'nested', 'deep', 'file.ts')

    await storage.setItem(key, 'const y = 2')

    expect(await storage.getItem(key)).toBe('const y = 2')
  })

  it('setItem skips write when content is unchanged', async () => {
    const storage = fsStorage()
    const key = join(dir, 'same.ts')

    await storage.setItem(key, 'const z = 3')
    const mtime1 = (await stat(key)).mtimeMs

    await storage.setItem(key, 'const z = 3')
    const mtime2 = (await stat(key)).mtimeMs

    expect(mtime1).toBe(mtime2)
  })

  it('getItem returns null for a missing key', async () => {
    const result = await fsStorage().getItem(join(dir, 'nonexistent.ts'))
    expect(result).toBeNull()
  })

  it('hasItem returns false before write and true after', async () => {
    const storage = fsStorage()
    const key = join(dir, 'check.ts')

    expect(await storage.hasItem(key)).toBe(false)
    await storage.setItem(key, 'const a = 1')
    expect(await storage.hasItem(key)).toBe(true)
  })

  it('removeItem deletes an existing file', async () => {
    const storage = fsStorage()
    const key = join(dir, 'remove.ts')

    await storage.setItem(key, 'const b = 2')
    await storage.removeItem(key)

    expect(await storage.hasItem(key)).toBe(false)
  })

  it('removeItem does nothing for a missing key', async () => {
    await expect(fsStorage().removeItem(join(dir, 'ghost.ts'))).resolves.toBeUndefined()
  })

  it('getKeys returns all files under a base directory', async () => {
    const storage = fsStorage()
    await storage.setItem(join(dir, 'a.ts'), 'const a = 1')
    await storage.setItem(join(dir, 'b.ts'), 'const b = 2')
    await mkdir(join(dir, 'sub'), { recursive: true })
    await storage.setItem(join(dir, 'sub', 'c.ts'), 'const c = 3')

    const keys = await storage.getKeys(dir)

    expect(keys.sort()).toEqual(['a.ts', 'b.ts', 'sub/c.ts'])
  })

  it('getKeys returns empty array for a missing directory', async () => {
    const keys = await fsStorage().getKeys(join(dir, 'missing'))
    expect(keys).toEqual([])
  })

  it('clear removes all files under a base directory', async () => {
    const storage = fsStorage()
    await storage.setItem(join(dir, 'x.ts'), 'const x = 1')
    await storage.setItem(join(dir, 'y.ts'), 'const y = 2')

    await storage.clear(dir)

    expect(await storage.hasItem(join(dir, 'x.ts'))).toBe(false)
    expect(await storage.hasItem(join(dir, 'y.ts'))).toBe(false)
  })

  it('clear does nothing when no base is provided', async () => {
    const key = join(dir, 'safe.ts')
    writeFileSync(key, 'const s = 1')

    await fsStorage().clear(undefined)

    expect(await fsStorage().hasItem(key)).toBe(true)
  })
})
