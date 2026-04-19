import { describe, expect, it } from 'vitest'
import { useDriver, useFiles } from './composables.ts'
import { generatorContextStorage } from './generatorContext.ts'
import type { GeneratorContext } from './types.ts'

function makeMockContext(overrides: Partial<GeneratorContext> = {}): GeneratorContext {
  return {
    config: { root: '.', output: { path: './gen' } } as GeneratorContext['config'],
    driver: {
      fileManager: {
        files: [{ path: 'a.ts', baseName: 'a.ts', name: 'a' } as any],
      },
    } as GeneratorContext['driver'],
    inputNode: {
      kind: 'Input',
      schemas: [],
      operations: [],
    } as GeneratorContext['inputNode'],
    resolver: {} as GeneratorContext['resolver'],
    ...overrides,
  } as GeneratorContext
}

describe('composables — inside a generator context', () => {
  it('useFiles() returns current files from the FileManager', async () => {
    const ctx = makeMockContext()
    await generatorContextStorage.run(ctx, async () => {
      const result = useFiles()
      expect(result).toHaveLength(1)
      expect(result[0]?.baseName).toBe('a.ts')
    })
  })

  it('useDriver() returns the PluginDriver from the context', async () => {
    const ctx = makeMockContext()
    await generatorContextStorage.run(ctx, async () => {
      expect(useDriver()).toBe(ctx.driver)
    })
  })

  it('useFiles() returns live data — reflects FileManager mutations mid-run', async () => {
    const files: any[] = []
    const ctx = makeMockContext({
      driver: { fileManager: { files } } as GeneratorContext['driver'],
    })
    await generatorContextStorage.run(ctx, async () => {
      expect(useFiles()).toHaveLength(0)
      files.push({ path: 'b.ts', baseName: 'b.ts', name: 'b' })
      expect(useFiles()).toHaveLength(1)
    })
  })
})

describe('composables — outside a generator context', () => {
  it('useFiles() throws a helpful error', () => {
    expect(() => useFiles()).toThrow(/called outside a generator context/)
  })

  it('useDriver() throws a helpful error', () => {
    expect(() => useDriver()).toThrow(/called outside a generator context/)
  })
})
