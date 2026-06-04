import path from 'node:path'
import type { Storage } from '@kubb/core'
import { describe, expect, test } from 'vitest'
import { buildVirtualStore, candidateKeys, diffStores, fromResolvedId, loadVirtual, resolveVirtual, toResolvedId, type VirtualStore } from './virtual.ts'

function createStorage(files: Record<string, string>): Storage {
  const store = new Map(Object.entries(files))
  return {
    name: 'memory',
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
    async getKeys(base) {
      const keys = [...store.keys()]
      return base ? keys.filter((key) => key.startsWith(base)) : keys
    },
    async clear() {
      store.clear()
    },
  }
}

const outputRoot = path.resolve('/project/gen')

function makeStore(map: Record<string, string>, barrelRelPath: string | null = 'index.ts'): VirtualStore {
  return { map: new Map(Object.entries(map)), barrelRelPath }
}

describe('buildVirtualStore', () => {
  test('keys files by their output-relative POSIX path and detects the barrel', async () => {
    const storage = createStorage({
      [path.join(outputRoot, 'index.ts')]: 'export * from "./Pet.ts"',
      [path.join(outputRoot, 'models', 'Pet.ts')]: 'export type Pet = {}',
    })

    const store = await buildVirtualStore({ storage, outputRoot })

    expect([...store.map.keys()].sort()).toStrictEqual(['index.ts', 'models/Pet.ts'])
    expect(store.barrelRelPath).toBe('index.ts')
  })

  test('reports no barrel when none was generated', async () => {
    const storage = createStorage({ [path.join(outputRoot, 'models', 'Pet.ts')]: 'export type Pet = {}' })

    const store = await buildVirtualStore({ storage, outputRoot })

    expect(store.barrelRelPath).toBeNull()
  })
})

describe('candidateKeys', () => {
  test('covers both the bare specifier and the ones that carry a file extension', () => {
    expect(candidateKeys('./Pet')).toStrictEqual(['Pet', 'Pet.ts', 'Pet.tsx', 'Pet.js', 'Pet.jsx', 'Pet/index.ts'])
  })
})

describe('resolveVirtual', () => {
  const store = makeStore({
    'index.ts': 'barrel',
    'models/Pet.ts': 'pet',
    'client/getPet.ts': 'getPet',
  })

  test('maps the kubb:gen entry to the root barrel', () => {
    expect(resolveVirtual({ id: 'kubb:gen', importer: undefined, store })).toBe(toResolvedId('index.ts'))
  })

  test('returns null for the kubb:gen entry when no barrel exists', () => {
    expect(resolveVirtual({ id: 'kubb:gen', importer: undefined, store: makeStore({ 'models/Pet.ts': 'pet' }, null) })).toBeNull()
  })

  test('resolves an explicit kubb:gen file id', () => {
    expect(resolveVirtual({ id: 'kubb:gen/models/Pet.ts', importer: undefined, store })).toBe(toResolvedId('models/Pet.ts'))
  })

  test('resolves a relative import between two virtual modules', () => {
    const importer = toResolvedId('index.ts')
    expect(resolveVirtual({ id: './models/Pet', importer, store })).toBe(toResolvedId('models/Pet.ts'))
  })

  test('resolves a relative import that walks up a directory', () => {
    const importer = toResolvedId('client/getPet.ts')
    expect(resolveVirtual({ id: '../models/Pet.ts', importer, store })).toBe(toResolvedId('models/Pet.ts'))
  })

  test('ignores relative imports from non-virtual importers', () => {
    expect(resolveVirtual({ id: './models/Pet', importer: '/some/real/file.ts', store })).toBeNull()
  })

  test('returns null for an unknown virtual file', () => {
    expect(resolveVirtual({ id: 'kubb:gen/does/not/exist.ts', importer: undefined, store })).toBeNull()
  })
})

describe('loadVirtual', () => {
  const store = makeStore({ 'models/Pet.ts': 'export type Pet = {}' })

  test('returns the source for a resolved virtual id', () => {
    expect(loadVirtual({ id: toResolvedId('models/Pet.ts'), store })).toBe('export type Pet = {}')
  })

  test('returns null when the id is not virtual', () => {
    expect(loadVirtual({ id: '/some/real/file.ts', store })).toBeNull()
  })

  test('round-trips through toResolvedId/fromResolvedId', () => {
    expect(fromResolvedId(toResolvedId('models/Pet.ts'))).toBe('models/Pet.ts')
    expect(fromResolvedId('/not/virtual.ts')).toBeNull()
  })
})

describe('diffStores', () => {
  test('reports every file as affected when there is no previous store', () => {
    const next = makeStore({ 'a.ts': '1', 'b.ts': '2' })

    expect(diffStores(null, next)).toStrictEqual(new Set(['a.ts', 'b.ts']))
  })

  test('reports only files whose content changed', () => {
    const prev = makeStore({ 'a.ts': '1', 'b.ts': '2' })
    const next = makeStore({ 'a.ts': '1', 'b.ts': '2-updated' })

    expect(diffStores(prev, next)).toStrictEqual(new Set(['b.ts']))
  })

  test('reports files that vanished as affected', () => {
    const prev = makeStore({ 'a.ts': '1', 'b.ts': '2' })
    const next = makeStore({ 'a.ts': '1' })

    expect(diffStores(prev, next)).toStrictEqual(new Set(['b.ts']))
  })
})
