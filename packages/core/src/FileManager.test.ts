import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { ast, type FileNode } from '@kubb/ast'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Hookable } from './Hookable.ts'
import type { Config, KubbHooks } from './types.ts'
import { FileManager } from './FileManager.ts'
import { createOutputManifest, type OutputManifest } from './outputManifest.ts'
import { fsStorage } from './storages/fsStorage.ts'
import { memoryStorage } from './storages/memoryStorage.ts'

const tempDirs: Array<string> = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

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

function stubManifest({ upToDate }: { upToDate: boolean }): OutputManifest & { tracked: Array<string> } {
  const tracked: Array<string> = []

  return {
    tracked,
    isUpToDate() {
      return upToDate
    },
    track({ key }) {
      tracked.push(key)
    },
    async commit() {},
  }
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
  describe('add', () => {
    it('stores every distinct file', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/a.ts', 'export const x = 1'), makeFile('/src/b.ts'))
      expect(manager.files.map((f) => f.path)).toStrictEqual(['/src/a.ts', '/src/b.ts'])
    })

    it('merges two files with the same path passed in a single call', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/foo.ts', 'const a = 1'), makeFile('/src/foo.ts', 'const b = 2'))
      expect(manager.files).toHaveLength(1)
      expect(manager.files[0]?.sources).toHaveLength(2)
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

    // The incoming file's banner and footer win, so a barrel can clear a plugin banner.
    it.each<['banner' | 'footer', string | undefined, string | undefined]>([
      ['banner', "'use server'", undefined],
      ['footer', undefined, '// end'],
    ])('returns the incoming %s when upserting %s over %s', (field, existing, incoming) => {
      const manager = new FileManager()
      manager.add(makeFile('/src/index.ts', undefined, { [field]: existing }))
      manager.upsert(makeFile('/src/index.ts', 'const x = 1', { [field]: incoming }))
      expect(manager.files[0]?.[field]).toBe(incoming)
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

  describe('parse', () => {
    it('joins source values when no parsers are provided', async () => {
      const manager = new FileManager()
      const file = makeFileWithSources('/src/foo.ts', ['const a = 1', 'const b = 2'])
      const result = await manager.parse(file)
      expect(result).toBe('const a = 1\n\nconst b = 2')
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

      it('prints a copied file through the parser copy hook', async () => {
        dir = mkdtempSync(path.join(tmpdir(), 'kubb-copy-'))
        const template = path.join(dir, 'template.ts')
        writeFileSync(template, 'export const a = 1')

        const copy = vi.fn((file: FileNode, source: string) => ({ ...file, sources: [ast.factory.createSource({ nodes: [ast.factory.createText(source)] })] }))
        const parse = vi.fn().mockReturnValue('parsed')
        const parser = { name: 'ts', extNames: ['.ts' as const], parse, copy, print: vi.fn() }
        const file = ast.factory.createFile({ path: '/src/client.ts', baseName: 'client.ts', copy: template })

        expect(await new FileManager().parse(file, { parsers: new Map([['.ts' as const, parser]]) })).toBe('parsed')
        expect(copy).toHaveBeenCalledWith(file, 'export const a = 1')
        expect(parse).toHaveBeenCalledOnce()
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
    it('writes every file in the batch', async () => {
      const storage = memoryStorage()
      const manager = new FileManager()

      await manager.write([makeFileWithSources('a.ts', ['/* a.ts */']), makeFileWithSources('b.ts', ['/* b.ts */'])], { storage })

      expect(await storage.readItem('a.ts')).toContain('/* a.ts */')
      expect(await storage.readItem('b.ts')).toContain('/* b.ts */')
    })

    // With no manifest in play, the stored bytes decide. A storage keeping bytes verbatim stores
    // leading whitespace back, so comparing against a trimmed source would rewrite every build.
    it.each([
      ['the same bytes', '/* a.ts */', '/* a.ts */'],
      ['the source plus a trailing newline', '/* a.ts */\n', '/* a.ts */'],
      ['a source with leading whitespace, verbatim', '\n/* a.ts */', '\n/* a.ts */'],
    ])('skips a file when the storage holds %s', async (_name, stored, source) => {
      const storage = memoryStorage()
      await storage.writeItem('a.ts', stored)
      const writeItem = vi.spyOn(storage, 'writeItem')
      const manager = new FileManager()

      await manager.write([makeFileWithSources('a.ts', [source])], { storage })

      expect(writeItem).not.toHaveBeenCalled()
    })

    it('writes a file whose content changed since the last run', async () => {
      const storage = memoryStorage()
      const manager = new FileManager()

      await manager.write([makeFileWithSources('a.ts', ['/* a.ts */'])], { storage })
      await manager.write([makeFileWithSources('a.ts', ['/* changed */'])], { storage })

      expect(await storage.readItem('a.ts')).toContain('/* changed */')
    })

    // A written file is tracked so the commit re-reads it; a skipped file's record already stands.
    it.each([
      ['skips', 'a file the output passes already turned into what is on disk', '/* a.ts */;\n', true, []],
      ['writes', 'a file the manifest does not vouch for', '/* stale */', false, ['a.ts']],
      ['writes', 'a file that is not on disk yet, whatever the manifest says', null, true, ['a.ts']],
    ])('%s %s', async (_verb, _name, stored, upToDate, tracked) => {
      const storage = memoryStorage()
      if (stored !== null) await storage.writeItem('a.ts', stored)
      const writeItem = vi.spyOn(storage, 'writeItem')
      const manifest = stubManifest({ upToDate })
      const manager = new FileManager()

      await manager.write([makeFileWithSources('a.ts', ['/* a.ts */'])], { storage, manifest })

      expect(writeItem.mock.calls.map(([key]) => key)).toStrictEqual(tracked)
      expect(manifest.tracked).toStrictEqual(tracked)
    })

    it('leaves the output alone on a rebuild after a formatter reflowed it', async () => {
      const dir = mkdtempSync(path.join(tmpdir(), 'kubb-rebuild-'))
      tempDirs.push(dir)
      const filePath = path.join(dir, 'a.ts')
      const storage = fsStorage()
      const cache = memoryStorage()
      const files = [makeFileWithSources(filePath, [`export const a = 'b'`])]

      const first = await createOutputManifest({ storage, cache })
      await new FileManager().write(files, { storage, manifest: first })

      // What prettier or biome leaves behind on a default config: reflowed quotes, a semicolon,
      // and a trailing newline, none of which match the bytes Kubb wrote.
      writeFileSync(filePath, 'export const a = "b";\n', { encoding: 'utf-8' })
      await first.commit()

      const second = await createOutputManifest({ storage, cache })
      const writeItem = vi.spyOn(storage, 'writeItem')
      await new FileManager().write(files, { storage, manifest: second })

      expect(writeItem).not.toHaveBeenCalled()
      expect(readFileSync(filePath, { encoding: 'utf-8' })).toBe('export const a = "b";\n')
    })

    it('parses each file before writing it', async () => {
      const parsed: Array<string> = []
      const written: Array<string> = []
      const storage = memoryStorage()
      const realWriteItem = storage.writeItem.bind(storage)
      storage.writeItem = async (itemPath: string, source: string) => {
        written.push(itemPath)
        await realWriteItem(itemPath, source)
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
      const hooks = new Hookable<KubbHooks>()
      hooks.hook('kubb:files:processing:start', ({ files }) => {
        hookCalls.push(`start:${files.length}`)
      })
      hooks.hook('kubb:files:processing:update', ({ files }) => {
        hookCalls.push(...files.map((item) => `update:${item.processed}:${item.file.path}`))
      })
      hooks.hook('kubb:files:processing:end', ({ files }) => {
        hookCalls.push(`end:${files.length}`)
      })

      await manager.write([makeFileWithSources('a.ts', ['/* a */']), makeFileWithSources('b.ts', ['/* b */'])], { storage, hooks, config: {} as Config })

      expect(hookCalls).toStrictEqual(['start:2', 'update:1:a.ts', 'update:2:b.ts', 'end:2'])
    })

    it('reports a finished file while a slower one is still writing', async () => {
      const hookCalls: Array<string> = []
      const storage = memoryStorage()
      const writeItem = storage.writeItem.bind(storage)
      storage.writeItem = async (itemPath, value, options) => {
        if (itemPath === 'b.ts') await delay(20)
        await writeItem(itemPath, value, options)
        hookCalls.push(`written:${itemPath}`)
      }
      const hooks = new Hookable<KubbHooks>()
      hooks.hook('kubb:files:processing:update', ({ files }) => {
        hookCalls.push(...files.map((item) => `update:${item.processed}:${item.file.path}`))
      })

      await new FileManager().write([makeFileWithSources('a.ts', ['/* a */']), makeFileWithSources('b.ts', ['/* b */'])], {
        storage,
        hooks,
        config: {} as Config,
      })

      expect(hookCalls).toStrictEqual(['written:a.ts', 'update:1:a.ts', 'written:b.ts', 'update:2:b.ts'])
    })

    it('bounds how many files are in flight for a large spec', async () => {
      // Blocks every write for the duration of the test so the in-flight count can be observed.
      const block = new Promise<void>(() => {})
      const storage = memoryStorage()
      const started: Array<string> = []
      storage.writeItem = async (itemPath: string) => {
        started.push(itemPath)
        await block
      }
      const manager = new FileManager()
      const files = Array.from({ length: 200 }, (_, index) => makeFileWithSources(`f${index}.ts`, [`/* ${index} */`]))

      manager.write(files, { storage }).catch(() => {})
      await delay(20)

      // Unbounded `Promise.all(files.map(...))` would have started all 200 writes. The pool keeps
      // at most WRITE_CONCURRENCY (50) parsed sources in flight at once.
      expect(started.length).toBeLessThan(files.length)
      expect(started.length).toBe(50)
    })
  })
})

describe('FileManager#dispatch', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an element without a renderer', { kind: 'element' }],
  ])('does not upsert when the result is %s', (_name, result) => {
    const fileManager = new FileManager()
    const upsert = vi.spyOn(fileManager, 'upsert')

    fileManager.dispatch({ result })

    expect(upsert).not.toHaveBeenCalled()
  })

  it('upserts every file when the result is an Array<FileNode>', () => {
    const fileManager = new FileManager()
    const files = [makeFile('a.ts'), makeFile('b.ts')]

    fileManager.dispatch({ result: files })

    expect(fileManager.files.map((f) => f.name)).toStrictEqual(['a', 'b'])
  })

  it('routes element results through the renderer, upserting its files', async () => {
    const fileManager = new FileManager()
    const renderer = {
      render: vi.fn(async () => {}),
      files: [makeFile('async-1.ts')],
      [Symbol.dispose]: () => {},
    }
    const factory = vi.fn(() => renderer)

    await fileManager.dispatch({ result: { kind: 'element' }, renderer: factory as never })

    expect(renderer.render).toHaveBeenCalledOnce()
    expect(fileManager.files.map((f) => f.name)).toStrictEqual(['async-1'])
  })
})
