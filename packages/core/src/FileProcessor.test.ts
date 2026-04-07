import { createFile, createSource, createText } from '@kubb/ast'
import { describe, expect, it, vi } from 'vitest'
import { FileProcessor } from './FileProcessor.ts'

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
      const processor = new FileProcessor()
      const file = makeFile('/src/foo.ts', ['const a = 1'])
      const result = await processor.parse(file, { parsers: new Map() })
      expect(result).toBe('const a = 1')
    })

    it('calls the registered parser for a matching extension', async () => {
      const processor = new FileProcessor()
      const file = makeFile('/src/foo.ts', ['const a = 1'])
      const mockParse = vi.fn().mockResolvedValue('// formatted\nconst a = 1')
      const parser = { name: 'ts', type: 'parser' as const, extNames: ['.ts' as const], install: vi.fn(), parse: mockParse }
      const parsers = new Map([['.ts' as const, parser]])
      const result = await processor.parse(file, { parsers })
      expect(mockParse).toHaveBeenCalledWith(file, { extname: undefined })
      expect(result).toBe('// formatted\nconst a = 1')
    })
  })

  describe('run', () => {
    it('calls onStart and onEnd with the full files list', async () => {
      const processor = new FileProcessor()
      const files = [makeFile('/src/a.ts', ['a']), makeFile('/src/b.ts', ['b'])]
      const onStart = vi.fn()
      const onEnd = vi.fn()

      await processor.run(files, { onStart, onEnd })

      expect(onStart).toHaveBeenCalledWith(files)
      expect(onEnd).toHaveBeenCalledWith(files)
    })

    it('calls onUpdate once per file', async () => {
      const processor = new FileProcessor()
      const files = [makeFile('/src/a.ts', ['a']), makeFile('/src/b.ts', ['b'])]
      const onUpdate = vi.fn()

      await processor.run(files, { onUpdate })

      expect(onUpdate).toHaveBeenCalledTimes(2)
    })

    it('passes correct percentage and processed count to onUpdate', async () => {
      const processor = new FileProcessor()
      const files = [makeFile('/src/a.ts', ['a']), makeFile('/src/b.ts', ['b'])]
      const updates: Array<{ processed: number; percentage: number; total: number }> = []

      await processor.run(files, {
        onUpdate: ({ processed, percentage, total }) => {
          updates.push({ processed, percentage, total })
        },
      })

      expect(updates[0]).toEqual({ processed: 1, percentage: 50, total: 2 })
      expect(updates[1]).toEqual({ processed: 2, percentage: 100, total: 2 })
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

      await processor.run(files, {
        onUpdate: ({ file }) => {
          order.push(file.path)
        },
      })

      expect(order).toEqual(['/src/a.ts', '/src/b.ts'])
    })

    it('runs in parallel mode without errors', async () => {
      const processor = new FileProcessor()
      const files = [makeFile('/src/a.ts', ['a']), makeFile('/src/b.ts', ['b'])]
      const onUpdate = vi.fn()

      await processor.run(files, { mode: 'parallel', onUpdate })

      expect(onUpdate).toHaveBeenCalledTimes(2)
    })

    it('handles an empty files array', async () => {
      const processor = new FileProcessor()
      const onStart = vi.fn()
      const onEnd = vi.fn()
      const onUpdate = vi.fn()

      const result = await processor.run([], { onStart, onEnd, onUpdate })

      expect(onStart).toHaveBeenCalledWith([])
      expect(onEnd).toHaveBeenCalledWith([])
      expect(onUpdate).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })
  })
})
