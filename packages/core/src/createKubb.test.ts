import { AsyncEventEmitter } from '@internals/utils'
import { createFile, createOperation, createSchema, createSource, createStreamInput, createText } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, describe, expect, it, test, vi } from 'vitest'
import { createKubb } from './createKubb.ts'
import { definePlugin } from './definePlugin.ts'
import type { Config, KubbHooks, Plugin, UserConfig } from './types.ts'
import { SCHEMA_PARALLEL, STREAM_FLUSH_EVERY } from './constants.ts'
import { fsStorage } from './storages/fsStorage.ts'
import { memoryStorage } from './storages/memoryStorage.ts'

describe('createKubb', () => {
  const pluginMocks = {
    buildStart: vi.fn(),
    resolvePath: vi.fn(),
  } as const

  const file = createFile({
    path: 'hello/world.json',
    baseName: 'world.json',
    sources: [createSource({ nodes: [createText(`{ "hello": "world" }`)] })],
    imports: [],
    exports: [],
  })
  const plugin = definePlugin(() => ({
    name: 'plugin',
    hooks: {
      'kubb:plugin:setup'(ctx) {
        pluginMocks.buildStart()
        ctx.injectFile(file)
      },
    },
  }))()

  const config = {
    root: '.',
    input: {
      path: 'https://petstore3.swagger.io/api/v3/openapi.json',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [plugin] as unknown as Array<Plugin>,
    storage: fsStorage(),
  } satisfies Config

  afterEach(() => {
    Object.keys(pluginMocks).forEach((key) => {
      const mock = pluginMocks[key as keyof typeof pluginMocks]

      mock.mockClear()
    })
  })

  test('if build can run and return created files and the pluginDriver', async () => {
    const { driver, files } = await createKubb(config, {
      hooks: new AsyncEventEmitter<KubbHooks>(),
    }).build()

    expect(files).toBeDefined()
    expect(driver).toBeDefined()
    // The plugin's buildStart already added the file during build
    expect(files.some((f) => f.baseName === file.baseName)).toBe(true)
  })

  test('accepts a user config and resolves defaults during setup', async () => {
    const userConfig = {
      input: {
        path: 'https://petstore3.swagger.io/api/v3/openapi.json',
      },
      output: {
        path: './src/gen',
      },
      adapter: createMockedAdapter(),
      plugins: [plugin],
    } satisfies UserConfig

    const kubb = createKubb(userConfig, {
      hooks: new AsyncEventEmitter<KubbHooks>(),
    })

    await kubb.setup()

    expect(kubb.config?.root).toBe(process.cwd())
    expect(kubb.config?.parsers).toEqual([])
  })

  test('if build with one plugin is running the different hooks in the correct order', async () => {
    const { files } = await createKubb(config, {
      hooks: new AsyncEventEmitter<KubbHooks>(),
    }).build()

    expect(
      files.map((file) => ({
        ...file,
        id: undefined,
        path: undefined,
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "baseName": "world.json",
          "exports": [],
          "extname": ".json",
          "id": undefined,
          "imports": [],
          "kind": "File",
          "meta": {},
          "name": "world",
          "path": undefined,
          "sources": [
            {
              "kind": "Source",
              "nodes": [
                {
                  "kind": "Text",
                  "value": "{ "hello": "world" }",
                },
              ],
            },
          ],
        },
      ]
    `)

    expect(pluginMocks.buildStart).toHaveBeenCalledTimes(1)
  })

  it('should handle plugin installation errors', async () => {
    const errorPlugin = definePlugin(() => ({
      name: 'errorPlugin',
      hooks: {
        'kubb:plugin:start'() {
          throw new Error('Installation failed')
        },
      },
    }))()

    const errorConfig = {
      ...config,
      plugins: [errorPlugin] as unknown as Array<Plugin>,
    }

    const { failedPlugins } = await createKubb(errorConfig, {
      hooks: new AsyncEventEmitter<KubbHooks>(),
    }).safeBuild()

    expect(failedPlugins.size).toBe(1)
    const failedPlugin = Array.from(failedPlugins)[0]
    expect(failedPlugin?.plugin.name).toBe('errorPlugin')
    // AsyncEventEmitter wraps the error; the original is accessible via cause
    const originalError = (failedPlugin?.error.cause ?? failedPlugin?.error) as Error | undefined
    expect(originalError?.message).toContain('Installation failed')
  })

  it('should emit debug events during build process', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const debugSpy = vi.fn()
    hooks.on('kubb:debug', debugSpy)

    await createKubb(config, { hooks }).build()
  })

  test('safeBuild should return error instead of throwing', async () => {
    const throwingPlugin = definePlugin(() => ({
      name: 'throwingPlugin',
      hooks: {
        'kubb:plugin:start'() {
          throw new Error('Critical error')
        },
      },
    }))()

    const throwingConfig = {
      ...config,
      plugins: [throwingPlugin] as unknown as Array<Plugin>,
    }

    const result = await createKubb(throwingConfig, {
      hooks: new AsyncEventEmitter<KubbHooks>(),
    }).safeBuild()

    expect(result.failedPlugins.size).toBeGreaterThan(0)
  })

  it('should track plugin timings', async () => {
    const { pluginTimings } = await createKubb(config, {
      hooks: new AsyncEventEmitter<KubbHooks>(),
    }).build()

    expect(pluginTimings).toBeDefined()
    expect(pluginTimings.size).toBeGreaterThan(0)
  })

  it('should emit plugin lifecycle events', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const startSpy = vi.fn()
    const endSpy = vi.fn()

    hooks.on('kubb:plugin:start', startSpy)
    hooks.on('kubb:plugin:end', endSpy)

    await createKubb(config, { hooks }).build()

    expect(startSpy).toHaveBeenCalled()
    expect(endSpy).toHaveBeenCalled()
  })

  it('flushes generated files after each schema batch across all active plugins', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const batches: Array<number> = []
    hooks.on('kubb:files:processing:start', ({ files }) => {
      batches.push(files.length)
    })

    const makePlugin = (name: string, filePath: string) =>
      definePlugin(() => ({
        name,
        hooks: {
          'kubb:plugin:setup'(ctx) {
            ctx.addGenerator({
              name: `${name}-generator`,
              schema() {
                return [
                  createFile({
                    path: filePath,
                    baseName: filePath.split('/').pop() as `${string}.${string}`,
                    sources: [createSource({ nodes: [createText(`export const ${name.replaceAll('-', '_')} = null`)] })],
                    imports: [],
                    exports: [],
                  }),
                ]
              },
            })
          },
        },
      }))()

    const streamingConfig = {
      ...config,
      storage: memoryStorage(),
      adapter: createMockedAdapter({
        parse: async () => ({
          kind: 'Input' as const,
          meta: { circularNames: [] as string[], enumNames: [] as string[] },
          schemas: [createSchema({ name: 'Pet', type: 'string' })],
          operations: [],
        }),
      }),
      plugins: [makePlugin('plugin-one', '/workspace/src/gen/one.ts'), makePlugin('plugin-two', '/workspace/src/gen/two.ts')] as unknown as Array<Plugin>,
    } satisfies Config

    const { files } = await createKubb(streamingConfig, { hooks }).build()

    // In the always-stream path all plugins fan-out together: both files are
    // produced in the same batch and flushed as a single event.
    expect(batches).toEqual([2])
    expect(files.map((file) => file.path)).toEqual(['/workspace/src/gen/one.ts', '/workspace/src/gen/two.ts'])
  })

  it('cleans up hook-style plugin listeners between builds on shared hooks', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({
            name: 'hook-gen',
            operations: vi.fn(),
          })
        },
      },
    }))()
    const hookConfig = {
      ...config,
      plugins: [hookPlugin as unknown as Plugin],
      storage: fsStorage(),
    } satisfies Config

    await createKubb(hookConfig, { hooks }).build()
    await createKubb(hookConfig, { hooks }).build()

    expect(hooks.listenerCount('kubb:plugin:setup')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:schema')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:operation')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:operations')).toBe(0)
  })

  it('does not throw when userConfig.plugins is undefined', async () => {
    const userConfig: UserConfig = {
      root: '.',
      input: {
        path: 'https://petstore3.swagger.io/api/v3/openapi.json',
      },
      output: {
        path: './src/gen',
      },
      parsers: [],
      adapter: createMockedAdapter(),
    }

    await expect(createKubb(userConfig).safeBuild()).resolves.not.toThrow()
  })

  describe('schema-level parallelism', () => {
    function makeBatchPlugin(generatedPaths: string[]) {
      return definePlugin(() => ({
        name: 'batch-plugin',
        hooks: {
          'kubb:plugin:setup'(ctx) {
            ctx.addGenerator({
              name: 'batch-gen',
              schema(node) {
                const path = `/gen/${node.name}.ts`
                generatedPaths.push(path)
                return [
                  createFile({
                    path,
                    baseName: `${node.name}.ts` as `${string}.ts`,
                    sources: [createSource({ nodes: [createText(`export const x = null`)] })],
                    imports: [],
                    exports: [],
                  }),
                ]
              },
            })
          },
        },
      }))()
    }

    it('generates all files when schema count exceeds SCHEMA_PARALLEL', async () => {
      const count = SCHEMA_PARALLEL * 3 + 1
      const schemas = Array.from({ length: count }, (_, i) => createSchema({ name: `Schema${i}`, type: 'string' }))
      const generatedPaths: string[] = []

      const { files } = await createKubb(
        {
          ...config,
          storage: memoryStorage(),
          adapter: createMockedAdapter({
            parse: async () => ({ kind: 'Input' as const, meta: { circularNames: [] as string[], enumNames: [] as string[] }, schemas, operations: [] }),
          }),
          plugins: [makeBatchPlugin(generatedPaths) as unknown as Plugin],
        },
        { hooks: new AsyncEventEmitter<KubbHooks>() },
      ).build()

      expect(files).toHaveLength(count)
      expect(generatedPaths).toHaveLength(count)
      expect(generatedPaths).toEqual(schemas.map((s) => `/gen/${s.name}.ts`))
    })

    it('preserves operation insertion order for collectedOperations across batches', async () => {
      const opCount = SCHEMA_PARALLEL * 2 + 3
      const operations = Array.from({ length: opCount }, (_, i) =>
        createOperation({ operationId: `op${i}`, method: 'GET', path: `/path${i}`, parameters: [], responses: [], tags: [] }),
      )
      const receivedOrder: string[] = []

      const orderPlugin = definePlugin(() => ({
        name: 'order-plugin',
        hooks: {
          'kubb:plugin:setup'(ctx) {
            ctx.addGenerator({
              name: 'order-gen',
              operations(nodes) {
                receivedOrder.push(...nodes.map((n) => n.operationId))
                return []
              },
            })
          },
        },
      }))()

      await createKubb(
        {
          ...config,
          storage: memoryStorage(),
          adapter: createMockedAdapter({
            parse: async () => ({ kind: 'Input' as const, meta: { circularNames: [] as string[], enumNames: [] as string[] }, schemas: [], operations }),
          }),
          plugins: [orderPlugin as unknown as Plugin],
        },
        { hooks: new AsyncEventEmitter<KubbHooks>() },
      ).build()

      expect(receivedOrder).toEqual(operations.map((o) => o.operationId))
    })

    it('processes schemas from adapter.stream() across batches', async () => {
      const count = SCHEMA_PARALLEL * 2 + 1
      const schemas = Array.from({ length: count }, (_, i) => createSchema({ name: `StreamSchema${i}`, type: 'string' }))
      const generatedPaths: string[] = []

      async function* asyncSchemas() {
        for (const s of schemas) yield s
      }
      async function* asyncOps() {}

      const streamAdapter = createMockedAdapter({
        parse: async () => ({ kind: 'Input' as const, meta: { circularNames: [] as string[], enumNames: [] as string[] }, schemas: [], operations: [] }),
      })
      Object.assign(streamAdapter, {
        stream: async () => createStreamInput(asyncSchemas(), asyncOps()),
      })

      const { files } = await createKubb(
        {
          ...config,
          storage: memoryStorage(),
          adapter: streamAdapter,
          plugins: [makeBatchPlugin(generatedPaths) as unknown as Plugin],
        },
        { hooks: new AsyncEventEmitter<KubbHooks>() },
      ).build()

      expect(files).toHaveLength(count)
      expect(generatedPaths).toHaveLength(count)
    })
  })

  describe('streaming flush during generation', () => {
    it('flushes files mid-generation when schema count exceeds STREAM_FLUSH_EVERY', async () => {
      const count = STREAM_FLUSH_EVERY + 10
      const schemas = Array.from({ length: count }, (_, i) => createSchema({ name: `FlushSchema${i}`, type: 'string' }))
      const hooks = new AsyncEventEmitter<KubbHooks>()
      const flushEvents: number[] = []
      hooks.on('kubb:files:processing:start', ({ files }) => {
        flushEvents.push(files.length)
      })

      const flushPlugin = definePlugin(() => ({
        name: 'flush-plugin',
        hooks: {
          'kubb:plugin:setup'(ctx) {
            ctx.addGenerator({
              name: 'flush-gen',
              schema(node) {
                return [
                  createFile({
                    path: `/gen/${node.name}.ts`,
                    baseName: `${node.name}.ts` as `${string}.ts`,
                    sources: [createSource({ nodes: [createText('export const x = null')] })],
                    imports: [],
                    exports: [],
                  }),
                ]
              },
            })
          },
        },
      }))()

      const { files } = await createKubb(
        {
          ...config,
          storage: memoryStorage(),
          adapter: createMockedAdapter({
            parse: async () => ({ kind: 'Input' as const, meta: { circularNames: [] as string[], enumNames: [] as string[] }, schemas, operations: [] }),
          }),
          plugins: [flushPlugin as unknown as Plugin],
        },
        { hooks },
      ).build()

      expect(files).toHaveLength(count)
      expect(flushEvents.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('parallel file writes', () => {
    it('writes all files correctly when flush batch exceeds STREAM_FLUSH_EVERY', async () => {
      const fileCount = STREAM_FLUSH_EVERY * 2 + 5
      const writtenPaths: string[] = []
      const storage = memoryStorage()
      const originalSetItem = storage.setItem.bind(storage)
      storage.setItem = async (key, value) => {
        writtenPaths.push(key)
        return originalSetItem(key, value)
      }

      const plugin = definePlugin(() => ({
        name: 'write-plugin',
        hooks: {
          'kubb:plugin:setup'(ctx) {
            for (let i = 0; i < fileCount; i++) {
              ctx.injectFile(
                createFile({
                  path: `/gen/file${i}.ts`,
                  baseName: `file${i}.ts` as `${string}.ts`,
                  sources: [createSource({ nodes: [createText(`export const v${i} = ${i}`)] })],
                  imports: [],
                  exports: [],
                }),
              )
            }
          },
        },
      }))()

      const { files } = await createKubb(
        {
          ...config,
          storage,
          adapter: createMockedAdapter(),
          plugins: [plugin as unknown as Plugin],
        },
        { hooks: new AsyncEventEmitter<KubbHooks>() },
      ).build()

      expect(files).toHaveLength(fileCount)
      expect(writtenPaths).toHaveLength(fileCount)
      expect(new Set(writtenPaths).size).toBe(fileCount)
    })
  })
})
