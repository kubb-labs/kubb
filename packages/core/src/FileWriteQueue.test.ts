import { AsyncEventEmitter } from '@internals/utils'
import { createFile, createSource, createText } from '@kubb/ast'
import { describe, expect, it, vi } from 'vitest'
import { FileProcessor } from './FileProcessor.ts'
import { FileWriteQueue } from './FileWriteQueue.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import type { Config, KubbHooks } from './types.ts'

function makeFile(path: string) {
  return createFile({
    path,
    baseName: path.split('/').pop() as `${string}.${string}`,
    sources: [createSource({ name: 'src', nodes: [createText(`/* ${path} */`)] })],
    imports: [],
    exports: [],
  })
}

function makeQueue(overrides: { storage?: ReturnType<typeof memoryStorage> } = {}) {
  const storage = overrides.storage ?? memoryStorage()
  const queue = new FileWriteQueue({
    processor: new FileProcessor(),
    parsers: new Map(),
    storage,
    hooks: new AsyncEventEmitter<KubbHooks>(),
    config: { root: '.', output: { path: './gen' } } as unknown as Config,
  })
  return { queue, storage }
}

describe('FileWriteQueue — enqueue', () => {
  it('dedupes files by path so a second enqueue replaces the first', () => {
    const { queue } = makeQueue()

    queue.enqueue(makeFile('a.ts'))
    queue.enqueue(makeFile('a.ts'))
    queue.enqueue(makeFile('b.ts'))

    expect(queue.size).toBe(2)
  })

  it('tracks pending count', () => {
    const { queue } = makeQueue()

    expect(queue.size).toBe(0)
    queue.enqueue(makeFile('a.ts'))
    queue.enqueue(makeFile('b.ts'))
    expect(queue.size).toBe(2)
  })
})

describe('FileWriteQueue — flush', () => {
  it('is a no-op when nothing is queued', async () => {
    const { queue, storage } = makeQueue()
    const setItem = vi.spyOn(storage, 'setItem')

    await queue.flush()

    expect(setItem).not.toHaveBeenCalled()
  })

  it('clears pending and writes every file in the batch', async () => {
    const { queue, storage } = makeQueue()
    queue.enqueue(makeFile('a.ts'))
    queue.enqueue(makeFile('b.ts'))

    await queue.flush()
    await queue.drain()

    expect(queue.size).toBe(0)
    expect(await storage.getItem('a.ts')).toContain('/* a.ts */')
    expect(await storage.getItem('b.ts')).toContain('/* b.ts */')
  })

  it('returns before the in-flight batch finishes so the caller can pipeline', async () => {
    // Slow storage simulates IO that takes longer than the dispatch round.
    const writes: Array<string> = []
    let resolveFirstWrite!: () => void
    const firstWriteBlocker = new Promise<void>((resolve) => {
      resolveFirstWrite = resolve
    })
    const storage = memoryStorage()
    const realSetItem = storage.setItem.bind(storage)
    storage.setItem = async (path: string, source: string) => {
      writes.push(path)
      if (path === 'a.ts') await firstWriteBlocker
      await realSetItem(path, source)
    }
    const { queue } = makeQueue({ storage })

    queue.enqueue(makeFile('a.ts'))
    const flushPromise = queue.flush()

    // flush() should resolve immediately (no previous in-flight).
    await flushPromise
    expect(queue.size).toBe(0)
    // The actual write is still pending because we haven't unblocked the first storage call.
    expect(await storage.getItem('a.ts')).toBeNull()

    resolveFirstWrite()
    await queue.drain()
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
    const { queue } = makeQueue({ storage })

    queue.enqueue(makeFile('first.ts'))
    await queue.flush()

    queue.enqueue(makeFile('second.ts'))
    const secondFlush = queue.flush()

    // The second flush should not have called setItem('second.ts') yet — it's waiting for the first.
    await new Promise((resolve) => setTimeout(resolve, 5))
    expect(order).toStrictEqual(['set:first.ts'])

    resolveFirst()
    await secondFlush
    await queue.drain()

    expect(order).toStrictEqual(['set:first.ts', 'done:first.ts', 'set:second.ts', 'done:second.ts'])
  })
})

describe('FileWriteQueue — drain', () => {
  it('writes everything still pending and waits for the in-flight batch', async () => {
    const { queue, storage } = makeQueue()
    queue.enqueue(makeFile('a.ts'))
    await queue.flush()
    queue.enqueue(makeFile('b.ts'))

    await queue.drain()

    expect(queue.size).toBe(0)
    expect(await storage.getItem('a.ts')).toContain('/* a.ts */')
    expect(await storage.getItem('b.ts')).toContain('/* b.ts */')
  })

  it('is a no-op when nothing is queued and no batch is in flight', async () => {
    const { queue, storage } = makeQueue()
    const setItem = vi.spyOn(storage, 'setItem')

    await queue.drain()

    expect(setItem).not.toHaveBeenCalled()
  })
})
