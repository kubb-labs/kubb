import { AsyncEventEmitter } from '@internals/utils'
import { createFile, createInput, createSchema } from '@kubb/ast'
import type { FileNode, SchemaNode } from '@kubb/ast'
import { describe, expect, it, vi } from 'vitest'
import { definePlugin } from '../definePlugin.ts'
import { FileManager } from '../FileManager.ts'
import { KubbDriver } from '../KubbDriver.ts'
import { createMockedAdapter } from '../mocks.ts'
import { memoryStorage } from '../storages/memoryStorage.ts'
import type { Config, KubbHooks, Plugin } from '../types.ts'
import { Generate, type GenerateHost } from './Generate.ts'
import { Transform } from './Transform.ts'

function file(name: string): FileNode {
  return createFile({ baseName: `${name}.ts`, path: `${name}.ts` })
}

describe('Generate.apply', () => {
  it('does nothing on null, undefined, or false-y results', () => {
    const fileManager = new FileManager()
    const upsert = vi.spyOn(fileManager, 'upsert')

    Generate.apply({ result: null, fileManager })
    Generate.apply({ result: undefined, fileManager })

    expect(upsert).not.toHaveBeenCalled()
  })

  it('upserts every file when the result is an Array<FileNode>', () => {
    const fileManager = new FileManager()
    const files = [file('a'), file('b')]

    Generate.apply({ result: files, fileManager })

    expect(fileManager.files).toHaveLength(2)
    expect(fileManager.files.map((f) => f.name)).toStrictEqual(['a', 'b'])
  })

  it('ignores non-array results when no rendererFactory is provided', () => {
    const fileManager = new FileManager()
    const upsert = vi.spyOn(fileManager, 'upsert')

    Generate.apply({ result: { kind: 'element' }, fileManager })

    expect(upsert).not.toHaveBeenCalled()
  })

  it('routes element results through the rendererFactory stream when present', () => {
    const fileManager = new FileManager()
    const rendered = [file('rendered-1'), file('rendered-2')]
    const rendererFactory = vi.fn(() => ({
      stream: vi.fn(function* () {
        yield* rendered
      }),
      [Symbol.dispose]: () => {},
    }))

    Generate.apply({ result: { kind: 'element' }, fileManager, rendererFactory: rendererFactory as never })

    expect(rendererFactory).toHaveBeenCalledOnce()
    expect(fileManager.files.map((f) => f.name)).toStrictEqual(['rendered-1', 'rendered-2'])
  })

  it('routes element results through the async render path when no stream is exposed', async () => {
    const fileManager = new FileManager()
    const renderer = {
      render: vi.fn(async () => {}),
      files: [file('async-1')],
      [Symbol.dispose]: () => {},
    }
    const rendererFactory = vi.fn(() => renderer)

    const result = Generate.apply({ result: { kind: 'element' }, fileManager, rendererFactory: rendererFactory as never })
    await result

    expect(renderer.render).toHaveBeenCalledOnce()
    expect(fileManager.files.map((f) => f.name)).toStrictEqual(['async-1'])
  })
})

describe('Generate.run — pipeline wiring', () => {
  function makeConfig(plugin: Plugin): Config {
    return {
      root: '.',
      input: { path: './petStore.yaml' },
      output: { path: './src/gen', clean: true },
      parsers: [],
      adapter: createMockedAdapter({
        parse: async () => createInput({ schemas: [createSchema({ type: 'string', name: 'Pet' })] }),
      }),
      storage: memoryStorage(),
      plugins: [plugin],
    } satisfies Config
  }

  it('routes nodes through the registered transformer before the generator sees them', async () => {
    const received: Array<SchemaNode> = []
    const plugin = definePlugin(() => ({
      name: 'capture',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.setTransformer({
            schema: (node) => (node.name === 'Pet' ? { ...node, name: 'PetTransformed' } : undefined),
          })
          ctx.addGenerator({
            name: 'cap',
            schema: (node) => {
              received.push(node)
              return undefined
            },
          })
        },
      },
    }))() as unknown as Plugin

    const driver = new KubbDriver(makeConfig(plugin), { hooks: new AsyncEventEmitter<KubbHooks>() })
    await driver.setup()
    await driver.run({ storage: memoryStorage() })

    expect(received).toHaveLength(1)
    expect(received[0]?.name).toBe('PetTransformed')
  })

  it('leaves the node untouched when no transformer is registered', async () => {
    const received: Array<SchemaNode> = []
    const plugin = definePlugin(() => ({
      name: 'capture',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({
            name: 'cap',
            schema: (node) => {
              received.push(node)
              return undefined
            },
          })
        },
      },
    }))() as unknown as Plugin

    const driver = new KubbDriver(makeConfig(plugin), { hooks: new AsyncEventEmitter<KubbHooks>() })
    await driver.setup()
    await driver.run({ storage: memoryStorage() })

    expect(received).toHaveLength(1)
    expect(received[0]?.name).toBe('Pet')
  })

  it('returns empty timings and closes no plugin ends when entries is empty', async () => {
    const emitPluginEnd = vi.fn()
    const host = {
      hooks: { listenerCount: () => 0, emit: vi.fn() },
      fileManager: new FileManager(),
      inputNode: null,
      getResolver: () => ({}) as never,
    } as unknown as GenerateHost

    const result = await Generate.run({
      host,
      transforms: new Transform(),
      entries: [],
      flushPending: async () => {},
      emitPluginEnd,
    })

    expect(emitPluginEnd).not.toHaveBeenCalled()
    expect(result.timings.size).toBe(0)
    expect(result.failed.size).toBe(0)
  })

  it('closes out every entry with kubb:plugin:end when host.inputNode is null', async () => {
    const emitPluginEnd = vi.fn()
    const host = {
      hooks: { listenerCount: () => 0, emit: vi.fn() },
      fileManager: new FileManager(),
      inputNode: null,
      getResolver: () => ({}) as never,
    } as unknown as GenerateHost
    const plugin = { name: 'no-input', options: {} } as unknown as Plugin
    const entries = [{ plugin: plugin as never, context: {} as never, hrStart: process.hrtime() }]

    const result = await Generate.run({
      host,
      transforms: new Transform(),
      entries,
      flushPending: async () => {},
      emitPluginEnd,
    })

    expect(emitPluginEnd).toHaveBeenCalledOnce()
    expect(emitPluginEnd).toHaveBeenCalledWith(expect.objectContaining({ plugin, success: true }))
    expect(result.timings.get('no-input')).toBeGreaterThanOrEqual(0)
    expect(result.failed.size).toBe(0)
  })
})
