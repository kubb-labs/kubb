import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ast, type FileNode } from '@kubb/ast'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FileManager } from './FileManager.ts'
import { memoryStorage } from './storages/memoryStorage.ts'

function makeFile(filePath: string, sourceValue?: string, extra?: Partial<Parameters<typeof ast.factory.createFile>[0]>) {
  return ast.factory.createFile({
    path: filePath,
    baseName: filePath.split('/').pop() as `${string}.${string}`,
    sources: sourceValue ? [ast.factory.createSource({ nodes: [ast.factory.createText(sourceValue)] })] : [],
    imports: [],
    exports: [],
    ...extra,
  })
}

function makeFileWithSources(filePath: string, sources: Array<string> = []) {
  return ast.factory.createFile({
    path: filePath,
    baseName: filePath.split('/').pop() as `${string}.${string}`,
    sources: sources.map((value) => ast.factory.createSource({ nodes: [ast.factory.createText(value)] })),
    imports: [],
    exports: [],
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

    it('keeps a stable order for same-length ties across incremental inserts', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/aaa.ts'))
      void manager.files
      manager.add(makeFile('/src/bbb.ts'))
      void manager.files
      manager.add(makeFile('/src/ccc.ts'))

      expect(manager.files.map((f) => f.path)).toStrictEqual(['/src/aaa.ts', '/src/bbb.ts', '/src/ccc.ts'])
    })

    it('inserts a new file into its sorted slot without reordering unrelated files', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/components/button/index.ts'), makeFile('/src/a.ts'), makeFile('/src/components/b.ts'))
      void manager.files
      manager.add(makeFile('/src/components/c.ts'))

      expect(manager.files.map((f) => f.path)).toStrictEqual(['/src/a.ts', '/src/components/b.ts', '/src/components/c.ts', '/src/components/button/index.ts'])
    })

    it('does not change a file position when it is later updated', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/aaa.ts'), makeFile('/src/bbb.ts'))
      void manager.files
      manager.upsert(makeFile('/src/aaa.ts', 'const x = 1'))

      const paths = manager.files.map((f) => f.path)
      expect(paths).toStrictEqual(['/src/aaa.ts', '/src/bbb.ts'])
      expect(manager.files[0]?.sources).toHaveLength(1)
    })

    it('returns a fresh array on each recompute so a prior snapshot is unaffected', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/a.ts'))
      const snapshot = manager.files
      manager.add(makeFile('/src/b.ts'))

      expect(snapshot.map((f) => f.path)).toStrictEqual(['/src/a.ts'])
      expect(manager.files.map((f) => f.path)).toStrictEqual(['/src/a.ts', '/src/b.ts'])
    })

    it('matches a plain full re-sort after many interleaved inserts and updates', () => {
      const manager = new FileManager()
      const paths = Array.from({ length: 40 }, (_, i) => `/src/f${i % 5}/file${i}.ts`)
      const firstSeenOrder = new Map<string, number>()
      for (const filePath of paths) {
        if (!firstSeenOrder.has(filePath)) firstSeenOrder.set(filePath, firstSeenOrder.size)
      }

      for (const [i, filePath] of paths.entries()) {
        manager.upsert(makeFile(filePath, `v${i}`))
        if (i % 3 === 0) void manager.files
      }
      const incremental = manager.files.map((f) => f.path)

      const isIndex = (p: string) => p.endsWith('/index.ts') || p === 'index.ts'
      const expected = [...firstSeenOrder.keys()].sort((a, b) => {
        const lenDiff = a.length - b.length
        if (lenDiff !== 0) return lenDiff
        const aIsIndex = isIndex(a)
        const bIsIndex = isIndex(b)
        if (aIsIndex !== bIsIndex) return aIsIndex ? 1 : -1
        return firstSeenOrder.get(a)! - firstSeenOrder.get(b)!
      })

      expect(incremental).toStrictEqual(expected)
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

  describe('parse', () => {
    it('joins source values when no parsers are provided', async () => {
      const manager = new FileManager()
      const file = makeFileWithSources('/src/foo.ts', ['const a = 1', 'const b = 2'])
      const result = await manager.parse(file)
      expect(result).toBe('const a = 1\n\nconst b = 2')
    })

    it('joins source values when no matching parser is registered', async () => {
      const manager = new FileManager()
      const file = makeFileWithSources('/src/foo.ts', ['const a = 1'])
      const result = await manager.parse(file, { parsers: new Map() })
      expect(result).toBe('const a = 1')
    })

    it('calls the registered parser for a matching extension', async () => {
      const file = makeFileWithSources('/src/foo.ts', ['const a = 1'])
      const mockParse = vi.fn().mockResolvedValue('// formatted\nconst a = 1')
      const parser = {
        name: 'ts',
        type: 'parser' as const,
        extNames: ['.ts' as const],
        install: vi.fn(),
        parse: mockParse,
        print: vi.fn().mockReturnValue(''),
      }
      const parsers = new Map([['.ts' as const, parser]])
      const manager = new FileManager()
      const result = await manager.parse(file, { parsers })
      expect(mockParse).toHaveBeenCalledWith(file)
      expect(result).toBe('// formatted\nconst a = 1')
    })

    describe('copy', () => {
      let dir: string | undefined

      afterEach(() => {
        if (dir) rmSync(dir, { recursive: true, force: true })
        dir = undefined
      })

      it('copies a real file verbatim and bypasses the parser', async () => {
        dir = mkdtempSync(path.join(tmpdir(), 'kubb-copy-'))
        const template = path.join(dir, 'template.ts')
        const content = "import a from 'b'\nexport const z = 1\nimport c from 'd'\n"
        writeFileSync(template, content)

        const parse = vi.fn().mockReturnValue('SHOULD NOT RUN')
        const parser = { name: 'ts', type: 'parser' as const, extNames: ['.ts' as const], install: vi.fn(), parse, print: vi.fn().mockReturnValue('') }
        const manager = new FileManager()

        const file = ast.factory.createFile({ path: '/src/client.ts', baseName: 'client.ts', copy: template })
        const result = await manager.parse(file, { parsers: new Map([['.ts' as const, parser]]) })

        expect(parse).not.toHaveBeenCalled()
        expect(result).toBe(content.trimEnd())
      })

      it('wraps the copied content with banner and footer', async () => {
        dir = mkdtempSync(path.join(tmpdir(), 'kubb-copy-'))
        const template = path.join(dir, 'template.ts')
        writeFileSync(template, 'export const z = 1')

        const manager = new FileManager()
        const file = ast.factory.createFile({ path: '/src/client.ts', baseName: 'client.ts', copy: template, banner: '/* top */', footer: '/* bottom */' })
        const result = await manager.parse(file)

        expect(result).toBe('/* top */\nexport const z = 1\n/* bottom */')
      })

      it('throws a clear error when the file is missing', async () => {
        const manager = new FileManager()
        const file = ast.factory.createFile({ path: '/src/client.ts', baseName: 'client.ts', copy: '/does/not/exist.ts' })

        await expect(manager.parse(file)).rejects.toThrow(/Could not copy file into output/)
      })
    })
  })

  describe('write', () => {
    it('is a no-op for an empty batch', async () => {
      const storage = memoryStorage()
      const setItem = vi.spyOn(storage, 'setItem')
      const manager = new FileManager()

      await manager.write([], { storage })

      expect(setItem).not.toHaveBeenCalled()
    })

    it('writes every file in the batch', async () => {
      const storage = memoryStorage()
      const manager = new FileManager()

      await manager.write([makeFileWithSources('a.ts', ['/* a.ts */']), makeFileWithSources('b.ts', ['/* b.ts */'])], { storage })

      expect(await storage.getItem('a.ts')).toContain('/* a.ts */')
      expect(await storage.getItem('b.ts')).toContain('/* b.ts */')
    })

    it('parses each file before writing it', async () => {
      const parsed: Array<string> = []
      const written: Array<string> = []
      const storage = memoryStorage()
      const realSetItem = storage.setItem.bind(storage)
      storage.setItem = async (itemPath: string, source: string) => {
        written.push(itemPath)
        await realSetItem(itemPath, source)
      }
      const parser = {
        name: 'ts',
        type: 'parser' as const,
        extNames: ['.ts' as const],
        install: vi.fn(),
        parse: vi.fn((file: FileNode) => {
          parsed.push(file.path)
          return `/* ${file.path} */`
        }),
        print: vi.fn().mockReturnValue(''),
      }
      const manager = new FileManager()

      await manager.write([makeFileWithSources('a.ts', ['/* a */']), makeFileWithSources('b.ts', ['/* b */'])], {
        storage,
        parsers: new Map([['.ts' as const, parser]]),
      })

      expect(parsed.toSorted()).toStrictEqual(['a.ts', 'b.ts'])
      expect(written.toSorted()).toStrictEqual(['a.ts', 'b.ts'])
    })

    it('fires start once, update per file, then end once, writing every file concurrently', async () => {
      const hookCalls: Array<string> = []
      const storage = memoryStorage()
      const manager = new FileManager()
      manager.hooks.hook('start', (files) => {
        hookCalls.push(`start:${files.length}`)
      })
      manager.hooks.hook('update', (item) => {
        hookCalls.push(`update:${item.file.path}`)
      })
      manager.hooks.hook('end', (files) => {
        hookCalls.push(`end:${files.length}`)
      })

      await manager.write([makeFileWithSources('a.ts', ['/* a */']), makeFileWithSources('b.ts', ['/* b */'])], { storage })

      expect(hookCalls[0]).toBe('start:2')
      expect(hookCalls.at(-1)).toBe('end:2')
      expect(hookCalls.slice(1, -1).toSorted()).toStrictEqual(['update:a.ts', 'update:b.ts'])
    })

    it('runs writes concurrently instead of pacing itself between files', async () => {
      const { promise: blockA, resolve: unblockA } = Promise.withResolvers<void>()
      const storage = memoryStorage()
      const realSetItem = storage.setItem.bind(storage)
      const started: Array<string> = []
      storage.setItem = async (itemPath: string, source: string) => {
        started.push(itemPath)
        if (itemPath === 'a.ts') await blockA
        await realSetItem(itemPath, source)
      }
      const manager = new FileManager()

      const writing = manager.write([makeFileWithSources('a.ts', ['/* a */']), makeFileWithSources('b.ts', ['/* b */'])], { storage })
      await new Promise((resolve) => setTimeout(resolve, 5))

      // b.ts's write started without waiting for a.ts's still-blocked write to finish.
      expect(started.toSorted()).toStrictEqual(['a.ts', 'b.ts'])

      unblockA()
      await writing
    })

    it('bounds how many files are in flight for a large spec', async () => {
      // Blocks every write for the duration of the test so the in-flight count can be observed.
      const block = new Promise<void>(() => {})
      const storage = memoryStorage()
      const started: Array<string> = []
      storage.setItem = async (itemPath: string) => {
        started.push(itemPath)
        await block
      }
      const manager = new FileManager()
      const files = Array.from({ length: 200 }, (_, index) => makeFileWithSources(`f${index}.ts`, [`/* ${index} */`]))

      manager.write(files, { storage }).catch(() => {})
      await new Promise((resolve) => setTimeout(resolve, 20))

      // Unbounded `Promise.all(files.map(...))` would have started all 200 writes. The pool keeps
      // at most WRITE_CONCURRENCY (50) parsed sources in flight at once.
      expect(started.length).toBeLessThan(files.length)
      expect(started.length).toBe(50)
    })

    it('waits for every write to finish before resolving', async () => {
      const { promise: blocker, resolve: unblock } = Promise.withResolvers<void>()
      const storage = memoryStorage()
      const realSetItem = storage.setItem.bind(storage)
      let settled = false
      storage.setItem = async (itemPath: string, source: string) => {
        await blocker
        await realSetItem(itemPath, source)
      }
      const manager = new FileManager()

      const writing = manager.write([makeFileWithSources('a.ts', ['/* a */'])], { storage }).then(() => {
        settled = true
      })
      await new Promise((resolve) => setTimeout(resolve, 5))
      expect(settled).toBe(false)

      unblock()
      await writing

      expect(settled).toBe(true)
      expect(await storage.getItem('a.ts')).toContain('/* a */')
    })

    it('rejects when a write fails', async () => {
      const storage = memoryStorage()
      storage.setItem = async () => {
        throw new Error('disk full')
      }
      const manager = new FileManager()

      await expect(manager.write([makeFileWithSources('a.ts', ['/* a */'])], { storage })).rejects.toThrow('disk full')
    })
  })
})
