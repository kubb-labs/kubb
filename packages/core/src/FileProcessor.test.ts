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

  describe('stream', () => {
    it('yields one item per file in order with processed count and percentage', async () => {
      const processor = new FileProcessor({ storage: memoryStorage() })
      const files = [makeFile('/src/a.ts', ['a']), makeFile('/src/b.ts', ['b'])]

      const items = []
      for await (const item of processor.stream(files)) {
        items.push({ path: item.file.path, processed: item.processed, percentage: item.percentage, total: item.total })
      }

      expect(items).toStrictEqual([
        { path: '/src/a.ts', processed: 1, percentage: 50, total: 2 },
        { path: '/src/b.ts', processed: 2, percentage: 100, total: 2 },
      ])
    })

    it('yields nothing for an empty files array', async () => {
      const processor = new FileProcessor({ storage: memoryStorage() })
      const items = []
      for await (const item of processor.stream([])) {
        items.push(item)
      }
      expect(items).toStrictEqual([])
    })
  })
})

function makeQueueProcessor(overrides: { storage?: ReturnType<typeof memoryStorage> } = {}) {
  const storage = overrides.storage ?? memoryStorage()
  const processor = new FileProcessor({ storage })
  return { processor, storage }
}

describe('FileProcessor — queue: enqueue', () => {
  it('dedupes files by path so a second enqueue replaces the first', async () => {
    const { processor, storage } = makeQueueProcessor()

    processor.enqueue(makeFile('a.ts', ['/* first */']))
    processor.enqueue(makeFile('a.ts', ['/* second */']))
    processor.enqueue(makeFile('b.ts', ['/* b */']))

    await processor.drain()

    expect(await storage.getItem('a.ts')).toContain('/* second */')
    expect(await storage.getItem('b.ts')).toContain('/* b */')
  })

  it('fires the enqueue event for every call', () => {
    const { processor } = makeQueueProcessor()
    const onEnqueue = vi.fn()
    processor.hooks.on('enqueue', onEnqueue)

    processor.enqueue(makeFile('a.ts'))
    processor.enqueue(makeFile('a.ts'))

    expect(onEnqueue).toHaveBeenCalledTimes(2)
  })
})

describe('FileProcessor — queue: flush', () => {
  it('is a no-op when nothing is queued', async () => {
    const { processor, storage } = makeQueueProcessor()
    const setItem = vi.spyOn(storage, 'setItem')

    await processor.flush()

    expect(setItem).not.toHaveBeenCalled()
  })

  it('clears pending and writes every file in the batch', async () => {
    const { processor, storage } = makeQueueProcessor()
    processor.enqueue(makeFile('a.ts', ['/* a.ts */']))
    processor.enqueue(makeFile('b.ts', ['/* b.ts */']))

    await processor.flush()
    await processor.drain()

    expect(await storage.getItem('a.ts')).toContain('/* a.ts */')
    expect(await storage.getItem('b.ts')).toContain('/* b.ts */')
  })

  it('returns before the in-flight batch finishes so the caller can pipeline', async () => {
    const { promise: firstWriteBlocker, resolve: resolveFirstWrite } = Promise.withResolvers<void>()
    const storage = memoryStorage()
    const realSetItem = storage.setItem.bind(storage)
    storage.setItem = async (path: string, source: string) => {
      if (path === 'a.ts') await firstWriteBlocker
      await realSetItem(path, source)
    }
    const { processor } = makeQueueProcessor({ storage })

    processor.enqueue(makeFile('a.ts', ['/* a.ts */']))
    await processor.flush()

    expect(await storage.getItem('a.ts')).toBeNull()

    resolveFirstWrite()
    await processor.drain()
    expect(await storage.getItem('a.ts')).toContain('/* a.ts */')
  })

  it('runs in-flight batches one at a time: a second flush waits for the first', async () => {
    const order: Array<string> = []
    const { promise: firstBlocker, resolve: resolveFirst } = Promise.withResolvers<void>()
    const storage = memoryStorage()
    const realSetItem = storage.setItem.bind(storage)
    storage.setItem = async (path: string, source: string) => {
      order.push(`set:${path}`)
      if (path === 'first.ts') await firstBlocker
      await realSetItem(path, source)
      order.push(`done:${path}`)
    }
    const { processor } = makeQueueProcessor({ storage })

    processor.enqueue(makeFile('first.ts', ['/* first */']))
    await processor.flush()

    processor.enqueue(makeFile('second.ts', ['/* second */']))
    const secondFlush = processor.flush()

    await new Promise((resolve) => setTimeout(resolve, 5))
    expect(order).toStrictEqual(['set:first.ts'])

    resolveFirst()
    await secondFlush
    await processor.drain()

    expect(order).toStrictEqual(['set:first.ts', 'done:first.ts', 'set:second.ts', 'done:second.ts'])
  })
})

describe('FileProcessor — queue: streaming writes', () => {
  it('starts writing a file before parsing the next one', async () => {
    const order: Array<string> = []
    const storage = memoryStorage()
    const realSetItem = storage.setItem.bind(storage)
    storage.setItem = async (path: string, source: string) => {
      order.push(`set:${path}`)
      await realSetItem(path, source)
    }
    const parser = {
      name: 'ts',
      type: 'parser' as const,
      extNames: ['.ts' as const],
      install: vi.fn(),
      parse: vi.fn((file: FileNode) => {
        order.push(`parse:${file.path}`)
        return `/* ${file.path} */`
      }),
      print: vi.fn().mockReturnValue(''),
    }
    const processor = new FileProcessor({ storage, parsers: new Map([['.ts' as const, parser]]) })

    processor.enqueue(makeFile('a.ts', ['/* a */']))
    processor.enqueue(makeFile('b.ts', ['/* b */']))
    await processor.drain()

    expect(order).toStrictEqual(['parse:a.ts', 'set:a.ts', 'parse:b.ts', 'set:b.ts'])
  })

  it('fires end only after the last write has finished', async () => {
    const events: Array<string> = []
    const { promise: blocker, resolve: unblock } = Promise.withResolvers<void>()
    const storage = memoryStorage()
    const realSetItem = storage.setItem.bind(storage)
    storage.setItem = async (path: string, source: string) => {
      await blocker
      await realSetItem(path, source)
      events.push(`done:${path}`)
    }
    const { processor } = makeQueueProcessor({ storage })
    processor.hooks.on('end', () => {
      events.push('end')
    })

    processor.enqueue(makeFile('a.ts', ['/* a */']))
    const draining = processor.drain()
    await new Promise((resolve) => setTimeout(resolve, 5))
    expect(events).toStrictEqual([])

    unblock()
    await draining

    expect(events).toStrictEqual(['done:a.ts', 'end'])
  })
})

describe('FileProcessor — queue: drain', () => {
  it('writes everything still pending and waits for the in-flight batch', async () => {
    const { processor, storage } = makeQueueProcessor()
    processor.enqueue(makeFile('a.ts', ['/* a */']))
    await processor.flush()
    processor.enqueue(makeFile('b.ts', ['/* b */']))

    await processor.drain()

    expect(await storage.getItem('a.ts')).toContain('/* a */')
    expect(await storage.getItem('b.ts')).toContain('/* b */')
  })

  it('fires the drain event once everything is written', async () => {
    const { processor } = makeQueueProcessor()
    const onDrain = vi.fn()
    processor.hooks.on('drain', onDrain)

    processor.enqueue(makeFile('a.ts', ['/* a */']))
    await processor.drain()

    expect(onDrain).toHaveBeenCalledOnce()
  })
})
