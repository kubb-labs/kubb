import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { readdir, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fsStorage } from './fsStorage.ts'

describe('fsStorage', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'kubb-fs-storage-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('creates missing parent directories on writeItem', async () => {
    const storage = fsStorage()
    const key = join(dir, 'nested', 'deep', 'file.ts')

    await storage.writeItem(key, 'const y = 2')

    expect(await storage.readItem(key)).toBe('const y = 2\n')
  })

  it('skips the write when the content is unchanged or a formatter has been over the file', async () => {
    const storage = fsStorage()
    const key = join(dir, 'formatted.ts')

    await storage.writeItem(key, 'const z = 3')
    const mtime0 = (await stat(key)).mtimeMs
    await storage.writeItem(key, 'const z = 3')

    expect((await stat(key)).mtimeMs).toBe(mtime0)

    await writeFile(key, 'const z = 3\n\n', { encoding: 'utf-8' })
    const mtime1 = (await stat(key)).mtimeMs

    await storage.writeItem(key, 'const z = 3')

    expect((await stat(key)).mtimeMs).toBe(mtime1)
  })

  it('does nothing on empty when no base is provided', async () => {
    const key = join(dir, 'safe.ts')
    writeFileSync(key, 'const s = 1')

    await fsStorage().empty(undefined)

    expect(await fsStorage().readItem(key)).toBe('const s = 1')
  })

  it('moves the base aside on empty and deletes it in the background', async () => {
    const storage = fsStorage()
    await storage.writeItem(join(dir, 'gen', 'a.ts'), 'const a = 1')

    await storage.empty(join(dir, 'gen'))

    expect(await storage.readItem(join(dir, 'gen', 'a.ts'))).toBeNull()
    await vi.waitFor(async () => expect(await readdir(dir)).toStrictEqual([]))
  })
})
