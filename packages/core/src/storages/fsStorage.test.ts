import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { stat, writeFile } from 'node:fs/promises'
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

  it('creates missing parent directories on writeItem', async () => {
    const storage = fsStorage()
    const key = join(dir, 'nested', 'deep', 'file.ts')

    await storage.writeItem(key, 'const y = 2')

    expect(await storage.readItem(key)).toBe('const y = 2\n')
  })

  it('skips the write when the content is unchanged', async () => {
    const storage = fsStorage()
    const key = join(dir, 'same.ts')

    await storage.writeItem(key, 'const z = 3')
    const mtime1 = (await stat(key)).mtimeMs

    await storage.writeItem(key, 'const z = 3')
    const mtime2 = (await stat(key)).mtimeMs

    expect(mtime1).toBe(mtime2)
  })

  it('skips the write when a formatter has been over the file', async () => {
    const storage = fsStorage()
    const key = join(dir, 'formatted.ts')

    await storage.writeItem(key, 'const z = 3')
    await writeFile(key, 'const z = 3\n\n', { encoding: 'utf-8' })
    const mtime1 = (await stat(key)).mtimeMs

    await storage.writeItem(key, 'const z = 3')

    expect((await stat(key)).mtimeMs).toBe(mtime1)
  })

  it('does nothing on empty when no base is provided', async () => {
    const key = join(dir, 'safe.ts')
    writeFileSync(key, 'const s = 1')

    await fsStorage().empty(undefined)

    expect(await fsStorage().existsItem(key)).toBe(true)
  })
})
