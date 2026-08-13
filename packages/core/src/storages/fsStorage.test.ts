import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { mkdir, stat, writeFile } from 'node:fs/promises'
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

  it('writeItem writes a file and readItem reads it back', async () => {
    const storage = fsStorage()
    const key = join(dir, 'hello.ts')

    await storage.writeItem(key, 'export const x = 1')
    const result = await storage.readItem(key)

    expect(result).toBe('export const x = 1\n')
  })

  it('writeItem creates missing parent directories', async () => {
    const storage = fsStorage()
    const key = join(dir, 'nested', 'deep', 'file.ts')

    await storage.writeItem(key, 'const y = 2')

    expect(await storage.readItem(key)).toBe('const y = 2\n')
  })

  it('writeItem skips write when content is unchanged', async () => {
    const storage = fsStorage()
    const key = join(dir, 'same.ts')

    await storage.writeItem(key, 'const z = 3')
    const mtime1 = (await stat(key)).mtimeMs

    await storage.writeItem(key, 'const z = 3')
    const mtime2 = (await stat(key)).mtimeMs

    expect(mtime1).toBe(mtime2)
  })

  it('writeItem skips write when a formatter has been over the file', async () => {
    const storage = fsStorage()
    const key = join(dir, 'formatted.ts')

    await storage.writeItem(key, 'const z = 3')
    await writeFile(key, 'const z = 3\n\n', { encoding: 'utf-8' })
    const mtime1 = (await stat(key)).mtimeMs

    await storage.writeItem(key, 'const z = 3')

    expect((await stat(key)).mtimeMs).toBe(mtime1)
  })

  it('readItem returns null for a missing key', async () => {
    const result = await fsStorage().readItem(join(dir, 'nonexistent.ts'))
    expect(result).toBeNull()
  })

  it('existsItem returns false before write and true after', async () => {
    const storage = fsStorage()
    const key = join(dir, 'check.ts')

    expect(await storage.existsItem(key)).toBe(false)
    await storage.writeItem(key, 'const a = 1')
    expect(await storage.existsItem(key)).toBe(true)
  })

  it('removeItem deletes an existing file', async () => {
    const storage = fsStorage()
    const key = join(dir, 'remove.ts')

    await storage.writeItem(key, 'const b = 2')
    await storage.removeItem(key)

    expect(await storage.existsItem(key)).toBe(false)
  })

  it('removeItem does nothing for a missing key', async () => {
    await expect(fsStorage().removeItem(join(dir, 'ghost.ts'))).resolves.toBeUndefined()
  })

  it('readKeys returns all files under a base directory', async () => {
    const storage = fsStorage()
    await storage.writeItem(join(dir, 'a.ts'), 'const a = 1')
    await storage.writeItem(join(dir, 'b.ts'), 'const b = 2')
    await mkdir(join(dir, 'sub'), { recursive: true })
    await storage.writeItem(join(dir, 'sub', 'c.ts'), 'const c = 3')

    const keys = await storage.readKeys(dir)

    expect(keys.sort()).toStrictEqual(['a.ts', 'b.ts', 'sub/c.ts'])
  })

  it('readKeys returns empty array for a missing directory', async () => {
    const keys = await fsStorage().readKeys(join(dir, 'missing'))
    expect(keys).toStrictEqual([])
  })

  it('clear removes all files under a base directory', async () => {
    const storage = fsStorage()
    await storage.writeItem(join(dir, 'x.ts'), 'const x = 1')
    await storage.writeItem(join(dir, 'y.ts'), 'const y = 2')

    await storage.empty(dir)

    expect(await storage.existsItem(join(dir, 'x.ts'))).toBe(false)
    expect(await storage.existsItem(join(dir, 'y.ts'))).toBe(false)
  })

  it('empty does nothing when no base is provided', async () => {
    const key = join(dir, 'safe.ts')
    writeFileSync(key, 'const s = 1')

    await fsStorage().empty(undefined)

    expect(await fsStorage().existsItem(key)).toBe(true)
  })
})
