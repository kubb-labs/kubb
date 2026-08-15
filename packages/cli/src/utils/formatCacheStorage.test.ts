import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import type { DefineStorage } from '@kubb/core'
import { fsStorage } from '@kubb/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatCacheStorage } from './formatCacheStorage.ts'

const prettierBin = resolve(import.meta.dirname, '../../../../node_modules/.bin/prettier')

function memoryStorage(): DefineStorage & { store: Map<string, string> } {
  const store = new Map<string, string>()

  return {
    name: 'memory',
    store,
    async hasItem(key) {
      return store.has(key)
    },
    async getItem(key) {
      return store.get(key) ?? null
    },
    async setItem(key, value) {
      store.set(key, value)
    },
    async removeItem(key) {
      store.delete(key)
    },
    async getKeys() {
      return [...store.keys()]
    },
    async clear() {
      store.clear()
    },
  }
}

describe('formatCacheStorage', () => {
  let dir: string
  let manifestPath: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'kubb-format-cache-'))
    manifestPath = join(dir, '.kubb', 'format-cache.json')
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('writes through to the underlying storage the first time a key is seen', async () => {
    const base = memoryStorage()
    const storage = formatCacheStorage({ storage: base, manifestPath })

    await storage.setItem('Pet.ts', 'export type Pet = { id: number }')

    expect(base.store.get('Pet.ts')).toBe('export type Pet = { id: number }')
  })

  it('skips the underlying write when the same content is set again, even if disk was reformatted in between', async () => {
    const base = memoryStorage()
    const setItemSpy = vi.spyOn(base, 'setItem')
    const storage = formatCacheStorage({ storage: base, manifestPath })

    await storage.setItem('Pet.ts', 'export type Pet = { id: number }')
    expect(setItemSpy).toHaveBeenCalledTimes(1)

    // A formatter reflows the file in place after the build (e.g. adds a semicolon), simulated by
    // mutating the base storage directly without going through our wrapper.
    base.store.set('Pet.ts', 'export type Pet = { id: number };')

    // The next build regenerates the exact same (pre-format) content.
    await storage.setItem('Pet.ts', 'export type Pet = { id: number }')

    expect(setItemSpy).toHaveBeenCalledTimes(1)
    expect(base.store.get('Pet.ts')).toBe('export type Pet = { id: number };')
  })

  it('writes through again when the content actually changes', async () => {
    const base = memoryStorage()
    const setItemSpy = vi.spyOn(base, 'setItem')
    const storage = formatCacheStorage({ storage: base, manifestPath })

    await storage.setItem('Pet.ts', 'export type Pet = { id: number }')
    await storage.setItem('Pet.ts', 'export type Pet = { id: number, name: string }')

    expect(setItemSpy).toHaveBeenCalledTimes(2)
    expect(base.store.get('Pet.ts')).toBe('export type Pet = { id: number, name: string }')
  })

  it('ignores surrounding whitespace, matching the trimmed comparison the underlying write() uses', async () => {
    const base = memoryStorage()
    const setItemSpy = vi.spyOn(base, 'setItem')
    const storage = formatCacheStorage({ storage: base, manifestPath })

    await storage.setItem('Pet.ts', 'export type Pet = { id: number }\n')
    await storage.setItem('Pet.ts', '\nexport type Pet = { id: number }')

    expect(setItemSpy).toHaveBeenCalledTimes(1)
  })

  it('writes through again when the manifest hash matches but the file is missing from the underlying storage', async () => {
    const base = memoryStorage()
    const setItemSpy = vi.spyOn(base, 'setItem')
    const storage = formatCacheStorage({ storage: base, manifestPath })

    await storage.setItem('Pet.ts', 'export type Pet = { id: number }')
    expect(setItemSpy).toHaveBeenCalledTimes(1)

    // The file was deleted by hand (or a `git checkout` / partial cleanup) after the previous
    // build, but the manifest still remembers its hash.
    base.store.delete('Pet.ts')

    await storage.setItem('Pet.ts', 'export type Pet = { id: number }')

    expect(setItemSpy).toHaveBeenCalledTimes(2)
    expect(base.store.get('Pet.ts')).toBe('export type Pet = { id: number }')
  })

  it('persists the manifest only once dispose() is called, so a fresh instance (a later CLI process) recognizes unchanged content', async () => {
    const base = memoryStorage()

    const first = formatCacheStorage({ storage: base, manifestPath })
    await first.setItem('Pet.ts', 'export type Pet = { id: number }')
    await expect(readFile(manifestPath, 'utf-8')).rejects.toThrow()

    await first.dispose?.()

    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'))
    expect(manifest['Pet.ts']).toBeTypeOf('string')

    base.store.set('Pet.ts', 'export type Pet = { id: number };') // formatter touched it

    const second = formatCacheStorage({ storage: base, manifestPath })
    const setItemSpy = vi.spyOn(base, 'setItem')
    await second.setItem('Pet.ts', 'export type Pet = { id: number }')

    expect(setItemSpy).not.toHaveBeenCalled()
  })

  it('delegates every other method, including dispose(), to the underlying storage', async () => {
    const base = memoryStorage()
    const disposeSpy = vi.fn().mockResolvedValue(undefined)
    const storage = formatCacheStorage({ storage: { ...base, dispose: disposeSpy }, manifestPath })

    expect(storage.name).toBe('memory')

    await storage.setItem('Pet.ts', 'export type Pet = { id: number }')

    expect(await storage.hasItem('Pet.ts')).toBe(true)
    expect(await storage.getItem('Pet.ts')).toBe('export type Pet = { id: number }')
    expect(await storage.getKeys()).toEqual(['Pet.ts'])

    await storage.removeItem('Pet.ts')
    expect(await storage.hasItem('Pet.ts')).toBe(false)

    await storage.dispose?.()
    expect(disposeSpy).toHaveBeenCalledTimes(1)
  })
})

describe('formatCacheStorage with fsStorage and a real formatter', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'kubb-format-cache-fs-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('leaves an already-formatted file untouched across builds, matching #3859', async () => {
    const key = join(dir, 'Pet.ts')
    const manifestPath = join(dir, '.kubb', 'format-cache.json')
    // Kubb's own printer omits the trailing semicolon; the formatter adds it back.
    const unformatted = 'export type Pet = { id: number }'

    // Build 1: write, then format (mirroring generate.ts writing files and then running output.format).
    const build1 = formatCacheStorage({ storage: fsStorage(), manifestPath })
    await build1.setItem(key, unformatted)
    await build1.dispose?.()
    execFileSync(prettierBin, ['--write', key])
    const mtimeAfterBuild1 = (await stat(key)).mtimeMs

    // Build 2: the input hasn't changed, so Kubb regenerates the exact same unformatted content.
    await new Promise((r) => setTimeout(r, 20))
    const build2 = formatCacheStorage({ storage: fsStorage(), manifestPath })
    await build2.setItem(key, unformatted)
    await build2.dispose?.()
    execFileSync(prettierBin, ['--write', key])
    const mtimeAfterBuild2 = (await stat(key)).mtimeMs

    expect(mtimeAfterBuild2).toBe(mtimeAfterBuild1)
    expect(await readFile(key, 'utf-8')).toBe('export type Pet = { id: number };\n')
  })
})
