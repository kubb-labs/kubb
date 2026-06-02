import { createFile, createSource, createText } from '@kubb/ast'
import { describe, expect, it, vi } from 'vitest'
import { FileProcessor } from './FileProcessor.ts'
import { memoryStorage } from './storages/memoryStorage.ts'

function makeFile(path: string, sources: Array<string> = []) {
  return createFile({
    path,
    baseName: path.split('/').pop() as `${string}.${string}`,
    sources: sources.map((value) => createSource({ nodes: [createText(value)] })),
    imports: [],
    exports: [],
  })
}

describe('FileProcessor', () => {
  describe('parse', () => {
    it('joins source values when no parsers are provided', async () => {
      const processor = new FileProcessor()
      const file = makeFile('/src/foo.ts', ['const a = 1', 'const b = 2'])
      const result = await processor.parse(file)
      expect(result).toBe('const a = 1\n\nconst b = 2')
    })

    it('joins source values when no matching parser is registered', async () => {
      const processor = new FileProcessor({ parsers: new Map() })
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
      const processor = new FileProcessor({ parsers })
      const result = await processor.parse(file)
      expect(mockParse).toHaveBeenCalledWith(file, { extname: undefined })
      expect(result).toBe('// formatted\nconst a = 1')
    })
  })

  describe('run', () => {
    it('emits start and end events with the full files list', async () => {
      const processor = new FileProcessor()
      const files = [makeFile('/src/a.ts', ['a']), makeFile('/src/b.ts', ['b'])]
      const onStart = vi.fn()
      const onEnd = vi.fn()

      processor.events.on('start', onStart)
      processor.events.on('end', onEnd)

      await processor.run(files)

      expect(onStart).toHaveBeenCalledWith(files)
      expect(onEnd).toHaveBeenCalledWith(files)
    })

    it('emits update event once per file', async () => {
      const processor = new FileProcessor()
      const files = [makeFile('/src/a.ts', ['a']), makeFile('/src/b.ts', ['b'])]
      const onUpdate = vi.fn()

      processor.events.on('update', onUpdate)

      await processor.run(files)

      expect(onUpdate).toHaveBeenCalledTimes(2)
    })

    it('passes correct percentage and processed count via update event', async () => {
      const processor = new FileProcessor()
      const files = [makeFile('/src/a.ts', ['a']), makeFile('/src/b.ts', ['b'])]
      const updates: Array<{
        processed: number
        percentage: number
        total: number
      }> = []

      processor.events.on('update', ({ processed, percentage, total }) => {
        updates.push({ processed, percentage, total })
      })

      await processor.run(files)

      expect(updates[0]).toStrictEqual({ processed: 1, percentage: 50, total: 2 })
      expect(updates[1]).toStrictEqual({ processed: 2, percentage: 100, total: 2 })
    })

    it('returns the original files array', async () => {
      const processor = new FileProcessor()
      const files = [makeFile('/src/a.ts')]
      const result = await processor.run(files)
      expect(result).toBe(files)
    })

    it('processes files sequentially by default', async () => {
      const processor = new FileProcessor()
      const order: Array<string> = []
      const files = [makeFile('/src/a.ts', ['a']), makeFile('/src/b.ts', ['b'])]

      processor.events.on('update', ({ file }) => {
        order.push(file.path)
      })

      await processor.run(files)

      expect(order).toStrictEqual(['/src/a.ts', '/src/b.ts'])
    })

    it('runs without errors', async () => {
      const processor = new FileProcessor()
      const files = [makeFile('/src/a.ts', ['a']), makeFile('/src/b.ts', ['b'])]
      const onUpdate = vi.fn()

      processor.events.on('update', onUpdate)

      await processor.run(files)

      expect(onUpdate).toHaveBeenCalledTimes(2)
    })

    it('handles an empty files array', async () => {
      const processor = new FileProcessor()
      const onStart = vi.fn()
      const onEnd = vi.fn()
      const onUpdate = vi.fn()

      processor.events.on('start', onStart)
      processor.events.on('end', onEnd)
      processor.events.on('update', onUpdate)

      const result = await processor.run([])

      expect(onStart).toHaveBeenCalledWith([])
      expect(onEnd).toHaveBeenCalledWith([])
      expect(onUpdate).not.toHaveBeenCalled()
      expect(result).toStrictEqual([])
    })
  })
})

function makeQueueProcessor(overrides: { storage?: ReturnType<typeof memoryStorage> } = {}) {
  const storage = overrides.storage ?? memoryStorage()
  const processor = new FileProcessor({ storage })
  return { processor, storage }
}

describe('FileProcessor — queue: enqueue', () => {
  it('dedupes files by path so a second enqueue replaces the first', () => {
    const { processor } = makeQueueProcessor()

    processor.enqueue(makeFile('a.ts'))
    processor.enqueue(makeFile('a.ts'))
    processor.enqueue(makeFile('b.ts'))

    expect(processor.size).toBe(2)
  })

  it('fires the enqueue event for every call', () => {
    const { processor } = makeQueueProcessor()
    const onEnqueue = vi.fn()
    processor.events.on('enqueue', onEnqueue)

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

    expect(processor.size).toBe(0)
    expect(await storage.getItem('a.ts')).toContain('/* a.ts */')
    expect(await storage.getItem('b.ts')).toContain('/* b.ts */')
  })

  it('returns before the in-flight batch finishes so the caller can pipeline', async () => {
    let resolveFirstWrite!: () => void
    const firstWriteBlocker = new Promise<void>((resolve) => {
      resolveFirstWrite = resolve
    })
    const storage = memoryStorage()
    const realSetItem = storage.setItem.bind(storage)
    storage.setItem = async (path: string, source: string) => {
      if (path === 'a.ts') await firstWriteBlocker
      await realSetItem(path, source)
    }
    const { processor } = makeQueueProcessor({ storage })

    processor.enqueue(makeFile('a.ts', ['/* a.ts */']))
    await processor.flush()

    expect(processor.size).toBe(0)
    expect(await storage.getItem('a.ts')).toBeNull()

    resolveFirstWrite()
    await processor.drain()
    expect(await storage.getItem('a.ts')).toContain('/* a.ts */')
  })

  it('runs in-flight batches one at a time: a second flush waits for the first', async () => {
    const order: Array<string> = []
    let resolveFirst!: () => void
    const firstBlocker = new Promise<void>((resolve) => {
      resolveFirst = resolve
    })
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

describe('FileProcessor — queue: drain', () => {
  it('writes everything still pending and waits for the in-flight batch', async () => {
    const { processor, storage } = makeQueueProcessor()
    processor.enqueue(makeFile('a.ts', ['/* a */']))
    await processor.flush()
    processor.enqueue(makeFile('b.ts', ['/* b */']))

    await processor.drain()

    expect(processor.size).toBe(0)
    expect(await storage.getItem('a.ts')).toContain('/* a */')
    expect(await storage.getItem('b.ts')).toContain('/* b */')
  })

  it('fires the drain event once everything is written', async () => {
    const { processor } = makeQueueProcessor()
    const onDrain = vi.fn()
    processor.events.on('drain', onDrain)

    processor.enqueue(makeFile('a.ts', ['/* a */']))
    await processor.drain()

    expect(onDrain).toHaveBeenCalledOnce()
  })
})

describe('FileProcessor — queue: errors', () => {
  it('throws synchronously when flush is called without storage', async () => {
    const processor = new FileProcessor()
    processor.enqueue(makeFile('a.ts'))

    await expect(processor.flush()).rejects.toThrow(/storage/)
  })

  it('throws synchronously when drain is called without storage', async () => {
    const processor = new FileProcessor()
    processor.enqueue(makeFile('a.ts'))

    await expect(processor.drain()).rejects.toThrow(/storage/)
  })
})
