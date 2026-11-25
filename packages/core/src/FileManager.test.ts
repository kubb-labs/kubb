import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { ast, type FileNode } from '@kubb/ast'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type Diagnostic, Diagnostics } from './Diagnostics.ts'
import { Hookable } from './Hookable.ts'
import type { Config, KubbHooks } from './types.ts'
import { FileManager } from './FileManager.ts'
import type { Lockfile } from './lockfile.ts'
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

function stubLockfile({ upToDate }: { upToDate: boolean }): Lockfile & { tracked: Array<string> } {
  const tracked: Array<string> = []

  return {
    tracked,
    exists: true,
    allFilesUpToDate: upToDate,
    inputs: () => undefined,
    matchesOutput: async () => upToDate,
    isUpToDate() {
      return upToDate
    },
    track({ key }) {
      tracked.push(key)
    },
    async write() {},
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
    it('merges two files with the same path passed in a single call', () => {
      const manager = new FileManager()
      manager.add(makeFile('/src/foo.ts', 'const a = 1'), makeFile('/src/foo.ts', 'const b = 2'))
      expect(manager.files).toHaveLength(1)
      expect(manager.files[0]?.sources).toHaveLength(2)
    })
  })

  describe('upsert', () => {
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
    // With no lockfile in play, the stored bytes decide. A storage keeping bytes verbatim stores
    // leading whitespace back, so comparing against a trimmed source would rewrite every build.
    it.each([['a source with leading whitespace, verbatim', '\n/* a.ts */', '\n/* a.ts */']])(
      'skips a file when the storage holds %s',
      async (_name, stored, source) => {
        const storage = memoryStorage()
        await storage.writeItem('a.ts', stored)
        const writeItem = vi.spyOn(storage, 'writeItem')
        const manager = new FileManager()

        await manager.write([makeFileWithSources('a.ts', [source])], { storage })

        expect(writeItem).not.toHaveBeenCalled()
      },
    )

    it('reports a shared file another config of this run wrote differently, and not one it wrote the same', async () => {
      const storage = memoryStorage()
      const reported: Array<Diagnostic> = []
      const shared = { path: '/common', written: new Map<string, string>() }

      await Diagnostics.scope(
        (diagnostic) => reported.push(diagnostic),
        async () => {
          await new FileManager().write([makeFileWithSources('/common/pet.ts', ['/* a */']), makeFileWithSources('/common/name.ts', ['/* a */'])], {
            storage,
            shared,
          })
          await new FileManager().write([makeFileWithSources('/common/pet.ts', ['/* b */']), makeFileWithSources('/common/name.ts', ['/* a */'])], {
            storage,
            shared,
          })
        },
      )

      expect(reported).toMatchObject([
        { code: 'KUBB_SHARED_FILE_MISMATCH', severity: 'warning', message: 'Shared files that differ from what another config wrote: /common/pet.ts.' },
      ])
    })

    it('warns about a file written outside output.path and shared.path, and still writes it', async () => {
      const storage = memoryStorage()
      const diagnostics: Array<Diagnostic> = []
      const config = { root: '/repo', output: { path: './gen' }, shared: { path: './common' } } as Config
      const files = ['/repo/gen/pet.ts', '/repo/common/name.ts', '/repo/src/user.ts'].map((file) => makeFileWithSources(file, ['/* a */']))

      await Diagnostics.scope(
        (diagnostic) => diagnostics.push(diagnostic),
        () => new FileManager().write(files, { storage, config }),
      )

      expect(diagnostics).toStrictEqual([
        expect.objectContaining({ code: 'KUBB_OUTSIDE_OUTPUT', severity: 'warning', message: expect.stringContaining('/repo/src/user.ts.') }),
      ])
      expect(await storage.readItem('/repo/src/user.ts')).toContain('/* a */')
    })

    // Every generated file is tracked, so the lockfile lists it whether this run wrote it or not.
    it.each([
      ['writes', 'a file that is not on disk yet, whatever the lockfile says', null, true, ['a.ts']],
      ['skips', 'a file the lockfile knows as up to date, and still tracks it', 'formatted', true, []],
    ])('%s %s', async (_verb, _name, stored, upToDate, written) => {
      const storage = memoryStorage()
      if (stored !== null) await storage.writeItem('a.ts', stored)
      const writeItem = vi.spyOn(storage, 'writeItem')
      const lockfile = stubLockfile({ upToDate })
      const manager = new FileManager()

      await manager.write([makeFileWithSources('a.ts', ['/* a.ts */'])], { storage, lockfile })

      expect(writeItem.mock.calls.map(([key]) => key)).toStrictEqual(written)
      expect(lockfile.tracked).toStrictEqual(['a.ts'])
    })

    it('hands each parsed source to kubb:file:processed, including files the storage already held', async () => {
      const storage = memoryStorage()
      await storage.writeItem('a.ts', '/* a */')
      const hooks = new Hookable<KubbHooks>()
      const processed: Array<string> = []
      hooks.hook('kubb:file:processed', ({ file, source }) => {
        processed.push(`${file.path}:${source}`)
      })

      await new FileManager().write([makeFileWithSources('a.ts', ['/* a */']), makeFileWithSources('b.ts', ['/* b */'])], { storage, hooks })

      expect(processed.toSorted()).toStrictEqual(['a.ts:/* a */', 'b.ts:/* b */'])
    })

    it('hands kubb:file:processed what the storage held before the write, and null under a folder that was just cleaned', async () => {
      const storage = memoryStorage()
      await storage.writeItem('/gen/a.ts', '/* old */')
      await storage.writeItem('/other/b.ts', '/* b */')
      const readItem = vi.spyOn(storage, 'readItem')
      const hooks = new Hookable<KubbHooks>()
      const stored = new Map<string, string | null | undefined>()
      hooks.hook('kubb:file:processed', ({ file, stored: previous }) => {
        stored.set(file.path, previous)
      })
      const files = [
        makeFileWithSources('/gen/a.ts', ['/* a */']),
        makeFileWithSources('/other/b.ts', ['/* b */']),
        makeFileWithSources('/other/c.ts', ['/* c */']),
      ]

      await new FileManager().write(files, { storage, hooks })
      expect(Object.fromEntries(stored)).toStrictEqual({ '/gen/a.ts': '/* old */', '/other/b.ts': '/* b */', '/other/c.ts': null })
      // One read per file serves both the write decision and the hook.
      expect(readItem).toHaveBeenCalledTimes(files.length)

      stored.clear()
      await new FileManager().write(files, { storage, hooks, cleaned: ['/gen'] })
      expect(stored.get('/gen/a.ts')).toBeNull()
      expect(stored.get('/other/b.ts')).toBe('/* b */')
    })

    it('lists the files the storage already held as unchanged on the end hook', async () => {
      const storage = memoryStorage()
      await storage.writeItem('a.ts', '/* a */')
      const hooks = new Hookable<KubbHooks>()
      const ends: Array<Array<string>> = []
      hooks.hook('kubb:files:processing:end', ({ unchanged }) => {
        ends.push(unchanged)
      })

      await new FileManager().write([makeFileWithSources('a.ts', ['/* a */']), makeFileWithSources('b.ts', ['/* b */'])], { storage, hooks })

      expect(ends).toStrictEqual([['a.ts']])
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

describe('FileManager#delete', () => {
  it('removes stored and pending files from the listing', () => {
    const manager = new FileManager()
    manager.add(makeFile('/gen/a.ts', 'const a = 1'), makeFile('/gen/b.ts', 'const b = 1'))
    void manager.dispatch({ result: [makeFile('/gen/c.ts', 'const c = 1')] })

    manager.delete('/gen/a.ts', '/gen/c.ts')

    expect(manager.files.map((file) => file.path)).toEqual(['/gen/b.ts'])
  })
})

describe('FileManager#dispatch', () => {
  it.each([null, undefined])('does not render when the result is %s', async (result) => {
    const fileManager = new FileManager()
    const renderer = vi.fn()

    await expect(fileManager.dispatch({ result, renderer: renderer as never })).resolves.toBeUndefined()
    expect(renderer).not.toHaveBeenCalled()
  })

  it.each([['an element without a renderer', { kind: 'element' }]])('does not upsert when the result is %s', (_name, result) => {
    const fileManager = new FileManager()
    const upsert = vi.spyOn(fileManager, 'upsert')

    fileManager.dispatch({ result })

    expect(upsert).not.toHaveBeenCalled()
  })

  it('links each source without a pointer to the node it was generated from', () => {
    const fileManager = new FileManager()
    const file = ast.factory.createFile({
      baseName: 'pet.ts',
      path: '/out/pet.ts',
      sources: [
        ast.factory.createSource({ name: 'Pet', nodes: [] }),
        ast.factory.createSource({ name: 'PetStatus', pointer: '#/components/schemas/Pet/properties/status', nodes: [] }),
      ],
    })

    fileManager.dispatch({ result: [file], pointer: '#/components/schemas/Pet' })

    expect(fileManager.files[0]?.sources.map((source) => source.pointer)).toStrictEqual([
      '#/components/schemas/Pet',
      '#/components/schemas/Pet/properties/status',
    ])
    expect(file.sources[0]?.pointer).toBeUndefined()
  })

  it('stores a single file node as it is, without calling the renderer', async () => {
    const fileManager = new FileManager()
    const renderer = vi.fn()
    const file = ast.factory.createFile({ baseName: 'pet.ts', path: '/out/pet.ts', sources: [ast.factory.createSource({ name: 'Pet', nodes: [] })] })

    await fileManager.dispatch({ result: file, renderer: renderer as never, pointer: '#/components/schemas/Pet' })

    expect(renderer).not.toHaveBeenCalled()
    expect(fileManager.files.map((f) => f.path)).toStrictEqual(['/out/pet.ts'])
    expect(fileManager.files[0]?.sources[0]?.pointer).toBe('#/components/schemas/Pet')
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

  it('normalizes fragments of one file once, when the files are read', () => {
    const fileManager = new FileManager()
    const fragments = ['a', 'b', 'c'].map((value) => makeFile('index.ts', value))
    const createFile = vi.spyOn(ast.factory, 'createFile')

    for (const fragment of fragments) fileManager.dispatch({ result: [fragment] })
    expect(createFile).not.toHaveBeenCalled()

    const [file] = fileManager.files
    expect(createFile).toHaveBeenCalledOnce()
    expect(file?.sources.map((source) => source.nodes?.map((node) => ('value' in node ? node.value : '')).join(''))).toStrictEqual(['a', 'b', 'c'])
    createFile.mockRestore()
  })

  it('leaves dispatched fragments unchanged while merging them', () => {
    const fileManager = new FileManager()
    const fragments = ['a', 'b', 'c'].map((value) => makeFile('index.ts', value))

    for (const fragment of fragments) fileManager.dispatch({ result: [fragment] })

    expect(fileManager.files[0]?.sources).toHaveLength(3)
    expect(fragments.map((fragment) => fragment.sources.length)).toStrictEqual([1, 1, 1])
  })

  it('drops an import used only by a duplicate source the file does not keep', () => {
    const fragment = (name: string, value: string, imports: Array<{ name: Array<string>; path: string }>) =>
      ast.factory.createFile({
        path: 'index.ts',
        baseName: 'index.ts',
        sources: [ast.factory.createSource({ name, nodes: [ast.factory.createText(value)] })],
        imports: imports.map((item) => ast.factory.createImport(item)),
        exports: [],
      })
    const fragments = [
      fragment('Pet', 'type Pet = A', [{ name: ['A'], path: './a.ts' }]),
      fragment('Pet', 'type Pet = B', [{ name: ['B'], path: './b.ts' }]),
      fragment('Order', 'type Order = string', []),
    ]
    const dispatched = new FileManager()
    const upserted = new FileManager()

    for (const item of fragments) {
      dispatched.dispatch({ result: [item] })
      upserted.upsert(item)
    }

    for (const manager of [dispatched, upserted]) {
      expect(manager.files[0]?.imports.map((item) => item.path)).toStrictEqual(['./a.ts'])
    }
  })
})
