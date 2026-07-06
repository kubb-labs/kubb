import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ast, type FileNode } from '@kubb/ast'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FileProcessor } from './FileProcessor.ts'
import { memoryStorage } from './storages/memoryStorage.ts'

function makeFile(path: string, sources: Array<string> = []) {
  return ast.factory.createFile({
    path,
    baseName: path.split('/').pop() as `${string}.${string}`,
    sources: sources.map((value) => ast.factory.createSource({ nodes: [ast.factory.createText(value)] })),
    imports: [],
    exports: [],
  })
}

describe('FileProcessor', () => {
  describe('parse', () => {
    it('joins source values when no parsers are provided', async () => {
      const processor = new FileProcessor({ storage: memoryStorage() })
      const file = makeFile('/src/foo.ts', ['const a = 1', 'const b = 2'])
      const result = await processor.parse(file)
      expect(result).toBe('const a = 1\n\nconst b = 2')
    })

    it('joins source values when no matching parser is registered', async () => {
      const processor = new FileProcessor({ storage: memoryStorage(), parsers: new Map() })
      const file = makeFile('/src/foo.ts', ['const a = 1'])
      const result = await processor.parse(file)
      expect(result).toBe('const a = 1')
    })

    it('calls the registered parser for a matching extension', async () => {
      const file = makeFile('/src/foo.ts', ['const a = 1'])
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
      const processor = new FileProcessor({ storage: memoryStorage(), parsers })
      const result = await processor.parse(file)
      expect(mockParse).toHaveBeenCalledWith(file, { extname: undefined })
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
        const processor = new FileProcessor({ storage: memoryStorage(), parsers: new Map([['.ts' as const, parser]]) })

        const file = ast.factory.createFile({ path: '/src/client.ts', baseName: 'client.ts', copy: template })
        const result = await processor.parse(file)

        expect(parse).not.toHaveBeenCalled()
        expect(result).toBe(content.trimEnd())
      })

      it('wraps the copied content with banner and footer', async () => {
        dir = mkdtempSync(path.join(tmpdir(), 'kubb-copy-'))
        const template = path.join(dir, 'template.ts')
        writeFileSync(template, 'export const z = 1')

        const processor = new FileProcessor({ storage: memoryStorage() })
        const file = ast.factory.createFile({ path: '/src/client.ts', baseName: 'client.ts', copy: template, banner: '/* top */', footer: '/* bottom */' })
        const result = await processor.parse(file)

        expect(result).toBe('/* top */\nexport const z = 1\n/* bottom */')
      })

      it('throws a clear error when the file is missing', async () => {
        const processor = new FileProcessor({ storage: memoryStorage() })
        const file = ast.factory.createFile({ path: '/src/client.ts', baseName: 'client.ts', copy: '/does/not/exist.ts' })

        await expect(processor.parse(file)).rejects.toThrow(/Could not copy file into output/)
      })
    })
  })
})

describe('FileProcessor — write', () => {
  it('is a no-op for an empty batch', async () => {
    const storage = memoryStorage()
    const setItem = vi.spyOn(storage, 'setItem')
    const processor = new FileProcessor({ storage })

    await processor.write([])

    expect(setItem).not.toHaveBeenCalled()
  })

  it('writes every file in the batch', async () => {
    const storage = memoryStorage()
    const processor = new FileProcessor({ storage })

    await processor.write([makeFile('a.ts', ['/* a.ts */']), makeFile('b.ts', ['/* b.ts */'])])

    expect(await storage.getItem('a.ts')).toContain('/* a.ts */')
    expect(await storage.getItem('b.ts')).toContain('/* b.ts */')
  })

  it('parses each file before writing it', async () => {
    const parsed: Array<string> = []
    const written: Array<string> = []
    const storage = memoryStorage()
    const realSetItem = storage.setItem.bind(storage)
    storage.setItem = async (path: string, source: string) => {
      written.push(path)
      await realSetItem(path, source)
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
    const processor = new FileProcessor({ storage, parsers: new Map([['.ts' as const, parser]]) })

    await processor.write([makeFile('a.ts', ['/* a */']), makeFile('b.ts', ['/* b */'])])

    expect(parsed.toSorted()).toStrictEqual(['a.ts', 'b.ts'])
    expect(written.toSorted()).toStrictEqual(['a.ts', 'b.ts'])
  })

  it('fires start once, update per file, then end once, writing every file concurrently', async () => {
    const events: Array<string> = []
    const storage = memoryStorage()
    const processor = new FileProcessor({ storage })
    processor.hooks.on('start', (files) => {
      events.push(`start:${files.length}`)
    })
    processor.hooks.on('update', (item) => {
      events.push(`update:${item.file.path}`)
    })
    processor.hooks.on('end', (files) => {
      events.push(`end:${files.length}`)
    })

    await processor.write([makeFile('a.ts', ['/* a */']), makeFile('b.ts', ['/* b */'])])

    expect(events[0]).toBe('start:2')
    expect(events.at(-1)).toBe('end:2')
    expect(events.slice(1, -1).toSorted()).toStrictEqual(['update:a.ts', 'update:b.ts'])
  })

  it('runs writes concurrently instead of pacing itself between files', async () => {
    const { promise: blockA, resolve: unblockA } = Promise.withResolvers<void>()
    const storage = memoryStorage()
    const realSetItem = storage.setItem.bind(storage)
    const started: Array<string> = []
    storage.setItem = async (path: string, source: string) => {
      started.push(path)
      if (path === 'a.ts') await blockA
      await realSetItem(path, source)
    }
    const processor = new FileProcessor({ storage })

    const writing = processor.write([makeFile('a.ts', ['/* a */']), makeFile('b.ts', ['/* b */'])])
    await new Promise((resolve) => setTimeout(resolve, 5))

    // b.ts's write started without waiting for a.ts's still-blocked write to finish.
    expect(started.toSorted()).toStrictEqual(['a.ts', 'b.ts'])

    unblockA()
    await writing
  })

  it('waits for every write to finish before resolving', async () => {
    const { promise: blocker, resolve: unblock } = Promise.withResolvers<void>()
    const storage = memoryStorage()
    const realSetItem = storage.setItem.bind(storage)
    let settled = false
    storage.setItem = async (path: string, source: string) => {
      await blocker
      await realSetItem(path, source)
    }
    const processor = new FileProcessor({ storage })

    const writing = processor.write([makeFile('a.ts', ['/* a */'])]).then(() => {
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
    const processor = new FileProcessor({ storage })

    await expect(processor.write([makeFile('a.ts', ['/* a */'])])).rejects.toThrow('disk full')
  })
})
