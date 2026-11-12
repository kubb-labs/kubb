import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { readdir, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ast } from '@kubb/ast'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FileManager } from '../FileManager.ts'
import { Hookable } from '../Hookable.ts'
import type { KubbHooks } from '../types.ts'
import { fsStorage } from './fsStorage.ts'

function makeFile(path: string, text: string) {
  return ast.factory.createFile({
    path,
    baseName: path.split('/').pop() as `${string}.${string}`,
    sources: [ast.factory.createSource({ nodes: [ast.factory.createText(text)] })],
    imports: [],
    exports: [],
  })
}

async function writeAll(files: Array<ReturnType<typeof makeFile>>): Promise<Array<string>> {
  const hooks = new Hookable<KubbHooks>()
  let unchanged: Array<string> = []
  hooks.hook('kubb:files:processing:end', (ctx) => {
    unchanged = ctx.unchanged
  })
  await new FileManager().write(files, { storage: fsStorage(), hooks })
  return unchanged
}

describe('fsStorage', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'kubb-fs-storage-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
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

  it('reads a missing file or a directory as null', async () => {
    mkdirSync(join(dir, 'folder'))

    expect(await fsStorage().readItem(join(dir, 'missing', 'a.ts'))).toBeNull()
    expect(await fsStorage().readItem(join(dir, 'folder'))).toBeNull()
  })

  it('writes every file on a first run, then rewrites only the file that changed', async () => {
    const root = join(dir, 'gen')
    const files = [makeFile(join(root, 'a.ts'), 'const a = 1'), makeFile(join(root, 'nested', 'deep', 'b.ts'), 'const b = 1')]

    expect(await writeAll(files)).toStrictEqual([])
    expect(readFileSync(join(root, 'a.ts'), 'utf8')).toBe('const a = 1\n')
    expect(readFileSync(join(root, 'nested', 'deep', 'b.ts'), 'utf8')).toBe('const b = 1\n')

    const mtimeA = (await stat(join(root, 'a.ts'))).mtimeMs
    const changed = [files[0]!, makeFile(join(root, 'nested', 'deep', 'b.ts'), 'const b = 2')]

    expect(await writeAll(changed)).toStrictEqual([join(root, 'a.ts')])
    expect((await stat(join(root, 'a.ts'))).mtimeMs).toBe(mtimeA)
    expect(readFileSync(join(root, 'nested', 'deep', 'b.ts'), 'utf8')).toBe('const b = 2\n')
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

  it('removes trash a previous run left behind on empty', async () => {
    const storage = fsStorage()
    await storage.writeItem(join(dir, '.gen.kubb-old-1-1', 'stale.ts'), 'const s = 1')
    await storage.writeItem(join(dir, 'gen', 'a.ts'), 'const a = 1')

    await storage.empty(join(dir, 'gen'))

    await vi.waitFor(async () => expect(await readdir(dir)).toStrictEqual([]))
  })
})
