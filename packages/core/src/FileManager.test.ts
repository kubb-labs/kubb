import { ast } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { FileManager } from './FileManager.ts'

function makeFile(path: string, sourceValue?: string, extra?: Partial<Parameters<typeof ast.factory.createFile>[0]>) {
  return ast.factory.createFile({
    path,
    baseName: path.split('/').pop() as `${string}.${string}`,
    sources: sourceValue ? [ast.factory.createSource({ nodes: [ast.factory.createText(sourceValue)] })] : [],
    imports: [],
    exports: [],
    ...extra,
  })
}

describe('FileManager', () => {
  it('starts with an empty file list', () => {
    const manager = new FileManager()
    expect(manager.files).toStrictEqual([])
  })

  describe('add', () => {
    it('stores a new file', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/foo.ts', 'export const x = 1'))
      expect(manager.files).toHaveLength(1)
      expect(manager.files[0]?.path).toBe('/src/foo.ts')
    })

    it('merges two files with the same path passed in a single call', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/foo.ts', 'const a = 1'), makeFile('/src/foo.ts', 'const b = 2'))
      expect(manager.files).toHaveLength(1)
      expect(manager.files[0]?.sources).toHaveLength(2)
    })

    it('keeps a default client import when grouped sources omit its body usage', () => {
      const manager = new FileManager()
      const clientPath = '@kubb/plugin-axios/clients/axios'
      // Source references the type imports (Client/RequestConfig) but not the lowercase `client`
      // binding — mirroring grouped output where the function body that uses `client` is omitted.
      const make = (op: string) =>
        makeFile(`/src/clients/pet.ts`, `export declare function ${op}(): RequestConfig<Client>`, {
          imports: [
            ast.factory.createImport({ name: 'client', path: clientPath }),
            ast.factory.createImport({ name: ['Client', 'RequestConfig'], path: clientPath, isTypeOnly: true }),
          ],
        })
      manager.add(make('getOrderById'), make('getPetById'))

      const imports = manager.files[0]?.imports ?? []
      expect(imports.some((i) => i.name === 'client')).toBe(true)
    })

    it('stores multiple distinct files', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/a.ts'), makeFile('/src/b.ts'))
      expect(manager.files).toHaveLength(2)
    })

    it('returns the resolved file nodes', () => {
      const manager = new FileManager()
      const result = manager.add(makeFile('/src/foo.ts'))
      expect(result).toHaveLength(1)
      expect(result[0]?.path).toBe('/src/foo.ts')
    })
  })

  describe('upsert', () => {
    it('stores a new file when it does not yet exist', () => {
      const manager = new FileManager()
      manager.upsert(makeFile('/src/foo.ts', 'export const x = 1'))
      expect(manager.files).toHaveLength(1)
    })

    it('merges into an existing file with the same path', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/foo.ts', 'const a = 1'))
      manager.upsert(makeFile('/src/foo.ts', 'const b = 2'))
      expect(manager.files).toHaveLength(1)
      expect(manager.files[0]?.sources).toHaveLength(2)
    })

    it('incoming file banner overrides existing banner (barrel clears plugin banner)', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/index.ts', undefined, { banner: "'use server'" }))
      manager.upsert(makeFile('/src/index.ts'))
      expect(manager.files[0]?.banner).toBeUndefined()
    })

    it('incoming banner is applied when existing file has none', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/index.ts'))
      manager.upsert(makeFile('/src/index.ts', undefined, { banner: "'use server'" }))
      expect(manager.files[0]?.banner).toBe("'use server'")
    })

    it('preserves banner when both files carry the same banner', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/index.ts', undefined, { banner: "'use server'" }))
      manager.upsert(makeFile('/src/index.ts', 'const x = 1', { banner: "'use server'" }))
      expect(manager.files[0]?.banner).toBe("'use server'")
    })

    it('incoming file footer overrides existing footer', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/index.ts', undefined, { footer: '// end' }))
      manager.upsert(makeFile('/src/index.ts'))
      expect(manager.files[0]?.footer).toBeUndefined()
    })
  })

  describe('clear', () => {
    it('removes all stored files', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/a.ts'), makeFile('/src/b.ts'))
      manager.clear()
      expect(manager.files).toHaveLength(0)
    })
  })

  describe('files sorting', () => {
    it('returns files sorted by path length (shortest first)', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/components/button/index.ts'), makeFile('/src/a.ts'), makeFile('/src/components/b.ts'))
      const paths = manager.files.map((f) => f.path)
      expect(paths[0]).toBe('/src/a.ts')
      expect(paths[1]).toBe('/src/components/b.ts')
      expect(paths[2]).toBe('/src/components/button/index.ts')
    })

    it('places index files last within the same length bucket', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/index.ts'), makeFile('/src/types.ts'))
      const paths = manager.files.map((f) => f.path)
      expect(paths[0]).toBe('/src/types.ts')
      expect(paths[1]).toBe('/src/index.ts')
    })
  })

  describe('dispose', () => {
    it('clears all stored files', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/a.ts'))
      manager.dispose()

      expect(manager.files).toHaveLength(0)
    })
  })
})
