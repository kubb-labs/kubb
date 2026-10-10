import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createStorage, type Storage } from './createStorage.ts'
import { fsStorage } from './storages/fsStorage.ts'
import { memoryStorage } from './storages/memoryStorage.ts'

function createMapStorage(map: Map<string, string>) {
  return {
    name: 'memory',
    async existsItem(key: string) {
      return map.has(key)
    },
    async readItem(key: string) {
      return map.get(key) ?? null
    },
    async writeItem(key: string, value: string) {
      map.set(key, value)
    },
    async removeItem(key: string) {
      map.delete(key)
    },
    async readKeys() {
      return [...map.keys()]
    },
    async empty() {
      map.clear()
    },
  }
}

describe('createStorage', () => {
  it('returns a callable that invokes the builder with provided options', () => {
    const factory = createStorage((options: { prefix: string }) => ({
      ...createMapStorage(new Map()),
      name: `custom-${options.prefix}`,
    }))

    const storage = factory({ prefix: 'test' })

    expect(storage.name).toBe('custom-test')
  })

  it('uses empty object when options are omitted', () => {
    const factory = createStorage((_options: Record<string, never>) => ({
      ...createMapStorage(new Map()),
      name: 'no-options',
    }))

    expect(() => factory()).not.toThrow()
    expect(factory().name).toBe('no-options')
  })
})

type StorageCase = {
  name: string
  create(): Storage
  /**
   * What `readItem` returns after `writeItem(key, value)`: the filesystem driver ends a file with a
   * newline, the in-memory one keeps the value verbatim.
   */
  written(value: string): string
  /**
   * What `readKeys(base)` returns for `names` stored under `base`: relative to the base on the
   * filesystem driver, full keys on the in-memory one.
   */
  keysUnder(base: string, names: Array<string>): Array<string>
}

const storages: Array<StorageCase> = [
  {
    name: 'memoryStorage',
    create: memoryStorage,
    written: (value) => value,
    keysUnder: (base, names) => names.map((name) => join(base, name)),
  },
  {
    name: 'fsStorage',
    create: fsStorage,
    written: (value) => `${value}\n`,
    keysUnder: (_base, names) => names,
  },
]

// Both drivers back real builds, so each one answers the Storage contract the same way. Every key
// lives under a temp dir that is removed afterwards, so the filesystem driver never touches the
// package while the in-memory one keeps paths comparable.
describe.each(storages)('Storage contract: $name', ({ create, written, keysUnder }) => {
  let dir: string
  let storage: Storage

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'kubb-storage-'))
    storage = create()
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('returns null from readItem for a missing key', async () => {
    expect(await storage.readItem(join(dir, 'missing.ts'))).toBeNull()
  })

  it('returns the written value from readItem after writeItem', async () => {
    const key = join(dir, 'hello.ts')

    await storage.writeItem(key, 'export const x = 1')

    expect(await storage.readItem(key)).toBe(written('export const x = 1'))
  })

  it('returns false from existsItem before a write and true after', async () => {
    const key = join(dir, 'check.ts')

    expect(await storage.existsItem(key)).toBe(false)
    await storage.writeItem(key, 'const a = 1')
    expect(await storage.existsItem(key)).toBe(true)
  })

  it('removes an existing key with removeItem', async () => {
    const key = join(dir, 'remove.ts')

    await storage.writeItem(key, 'const b = 2')
    await storage.removeItem(key)

    expect(await storage.existsItem(key)).toBe(false)
  })

  it('resolves removeItem for a missing key', async () => {
    await expect(storage.removeItem(join(dir, 'ghost.ts'))).resolves.toBeUndefined()
  })

  it('returns every key under a base from readKeys', async () => {
    await storage.writeItem(join(dir, 'a.ts'), 'const a = 1')
    await storage.writeItem(join(dir, 'b.ts'), 'const b = 2')
    await storage.writeItem(join(dir, 'sub', 'c.ts'), 'const c = 3')

    expect((await storage.readKeys(dir)).toSorted()).toStrictEqual(keysUnder(dir, ['a.ts', 'b.ts', 'sub/c.ts']))
  })

  it('returns an empty array from readKeys for a missing base', async () => {
    expect(await storage.readKeys(join(dir, 'missing'))).toStrictEqual([])
  })

  it('removes only the keys under a base with empty', async () => {
    const other = join(dir, 'other', 'c.ts')
    await storage.writeItem(join(dir, 'gen', 'x.ts'), 'const x = 1')
    await storage.writeItem(join(dir, 'gen', 'y.ts'), 'const y = 2')
    await storage.writeItem(other, 'const c = 3')

    await storage.empty(join(dir, 'gen'))

    expect(await storage.readKeys(join(dir, 'gen'))).toStrictEqual([])
    expect(await storage.existsItem(other)).toBe(true)
  })
})
