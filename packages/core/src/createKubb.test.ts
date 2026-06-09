import { AsyncEventEmitter } from '@internals/utils'
import type { OperationNode, SchemaNode } from '@kubb/ast'
import { createFile, createOperation, createSchema, createSource, createStreamInput, createText } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, describe, expect, it, test, vi } from 'vitest'
import { createKubb } from './createKubb.ts'
import { Diagnostics } from './diagnostics.ts'
import { definePlugin } from './definePlugin.ts'
import type { Config, KubbHooks, Plugin, UserConfig } from './types.ts'
import { HOOK_LISTENERS_PER_PLUGIN, SCHEMA_PARALLEL, STREAM_FLUSH_EVERY } from './constants.ts'
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
    reporters: [],
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
    expect(kubb.config?.parsers).toStrictEqual([])
  })

  test('keeps the hooks ceiling at 10 for a single plugin', async () => {
    const kubb = createKubb(config, { hooks: new AsyncEventEmitter<KubbHooks>() })

    await kubb.setup()

    expect(kubb.hooks.getMaxListeners()).toBe(10)
  })

  test('scales the hooks ceiling with the plugin count during setup', async () => {
    const plugins = ['a', 'b', 'c', 'd'].map((name) => definePlugin(() => ({ name, hooks: {} }))())
    const kubb = createKubb({ ...config, plugins: plugins as unknown as Array<Plugin> }, { hooks: new AsyncEventEmitter<KubbHooks>() })

    await kubb.setup()

    expect(kubb.hooks.getMaxListeners()).toBe(plugins.length * HOOK_LISTENERS_PER_PLUGIN)
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

    const { diagnostics } = await createKubb(errorConfig, {
      hooks: new AsyncEventEmitter<KubbHooks>(),
    }).safeBuild()

    const problems = diagnostics.filter(Diagnostics.isProblem)
    expect(problems).toHaveLength(1)
    const diagnostic = problems[0]
    expect(diagnostic?.plugin).toBe('errorPlugin')
    // AsyncEventEmitter wraps the error; the original message survives on the diagnostic or its cause
    expect(`${diagnostic?.message} ${diagnostic?.cause?.message ?? ''}`).toContain('Installation failed')
  })

  it('should collect a failed plugin as a diagnostic with the plugin name', async () => {
    const errorPlugin = definePlugin(() => ({
      name: 'errorPlugin',
      hooks: {
        'kubb:plugin:start'() {
          throw new Error('Installation failed')
        },
      },
    }))()

    const { diagnostics } = await createKubb(
      { ...config, plugins: [errorPlugin] as unknown as Array<Plugin> },
      { hooks: new AsyncEventEmitter<KubbHooks>() },
    ).safeBuild()

    const problems = diagnostics.filter(Diagnostics.isProblem)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatchObject({ plugin: 'errorPlugin', severity: 'error' })
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

    expect(Diagnostics.hasError(result.diagnostics)).toBe(true)
  })

  it('should track plugin timings as performance diagnostics', async () => {
    const { diagnostics } = await createKubb(config, {
      hooks: new AsyncEventEmitter<KubbHooks>(),
    }).build()

    const timings = diagnostics.filter(Diagnostics.isPerformance)
    expect(timings.length).toBeGreaterThan(0)
    expect(timings.every((diagnostic) => typeof diagnostic.duration === 'number')).toBe(true)
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

  it('flushes generated files per plugin so kubb:plugin:end fires progressively', async () => {
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
          meta: { circularNames: [] as Array<string>, enumNames: [] as Array<string> },
          schemas: [createSchema({ name: 'Pet', type: 'string' })],
          operations: [],
        }),
      }),
      plugins: [makePlugin('plugin-one', '/workspace/src/gen/one.ts'), makePlugin('plugin-two', '/workspace/src/gen/two.ts')] as unknown as Array<Plugin>,
    } satisfies Config

    const endOrder: Array<string> = []
    hooks.on('kubb:plugin:end', ({ plugin }) => {
      endOrder.push(plugin.name)
    })

    const { files } = await createKubb(streamingConfig, { hooks }).build()

    // Each plugin runs its generator pass sequentially, so its file batch flushes
    // before the next plugin starts. Two plugins, two single-file flushes — and the
    // `plugin:end` order matches that progression, which drives the CLI counter.
    expect(batches).toStrictEqual([1, 1])
    expect(endOrder).toStrictEqual(['plugin-one', 'plugin-two'])
    expect(files.map((file) => file.path)).toStrictEqual(['/workspace/src/gen/one.ts', '/workspace/src/gen/two.ts'])
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
    function makeBatchPlugin(generatedPaths: Array<string>) {
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
      const generatedPaths: Array<string> = []

      const { files } = await createKubb(
        {
          ...config,
          storage: memoryStorage(),
          adapter: createMockedAdapter({
            parse: async () => ({
              kind: 'Input' as const,
              meta: { circularNames: [] as Array<string>, enumNames: [] as Array<string> },
              schemas,
              operations: [],
            }),
          }),
          plugins: [makeBatchPlugin(generatedPaths) as unknown as Plugin],
        },
        { hooks: new AsyncEventEmitter<KubbHooks>() },
      ).build()

      expect(files).toHaveLength(count)
      expect(generatedPaths).toHaveLength(count)
      expect(generatedPaths).toStrictEqual(schemas.map((s) => `/gen/${s.name}.ts`))
    })

    it('preserves operation insertion order for collectedOperations across batches', async () => {
      const opCount = SCHEMA_PARALLEL * 2 + 3
      const operations = Array.from({ length: opCount }, (_, i) =>
        createOperation({ operationId: `op${i}`, method: 'GET', path: `/path${i}`, parameters: [], responses: [], tags: [] }),
      )
      const receivedOrder: Array<string> = []

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
            parse: async () => ({
              kind: 'Input' as const,
              meta: { circularNames: [] as Array<string>, enumNames: [] as Array<string> },
              schemas: [],
              operations,
            }),
          }),
          plugins: [orderPlugin as unknown as Plugin],
        },
        { hooks: new AsyncEventEmitter<KubbHooks>() },
      ).build()

      expect(receivedOrder).toStrictEqual(operations.map((o) => o.operationId))
    })

    it('processes schemas from adapter.stream() across batches', async () => {
      const count = SCHEMA_PARALLEL * 2 + 1
      const schemas = Array.from({ length: count }, (_, i) => createSchema({ name: `StreamSchema${i}`, type: 'string' }))
      const generatedPaths: Array<string> = []

      async function* asyncSchemas() {
        for (const s of schemas) yield s
      }
      async function* asyncOps() {}

      const streamAdapter = createMockedAdapter({
        parse: async () => ({
          kind: 'Input' as const,
          meta: { circularNames: [] as Array<string>, enumNames: [] as Array<string> },
          schemas: [],
          operations: [],
        }),
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

  describe('generator context and transform reuse', () => {
    function makeAdapter({ schemas = [], operations = [] }: { schemas?: Array<SchemaNode>; operations?: Array<OperationNode> }) {
      return createMockedAdapter({
        parse: async () => ({
          kind: 'Input' as const,
          meta: { circularNames: [] as Array<string>, enumNames: [] as Array<string> },
          schemas,
          operations,
        }),
      })
    }

    it('reuses one generator ctx across nodes when plugin options are static', async () => {
      const ctxs: Array<unknown> = []
      const capturePlugin = definePlugin(() => ({
        name: 'capture-plugin',
        hooks: {
          'kubb:plugin:setup'(ctx) {
            ctx.addGenerator({
              name: 'capture-gen',
              schema(_node, generatorCtx) {
                ctxs.push(generatorCtx)
              },
            })
          },
        },
      }))()

      await createKubb(
        {
          ...config,
          storage: memoryStorage(),
          adapter: makeAdapter({ schemas: [createSchema({ name: 'A', type: 'string' }), createSchema({ name: 'B', type: 'string' })] }),
          plugins: [capturePlugin as unknown as Plugin],
        },
        { hooks: new AsyncEventEmitter<KubbHooks>() },
      ).build()

      expect(ctxs).toHaveLength(2)
      expect(ctxs[1]).toBe(ctxs[0])
    })

    it('still resolves per-node options when an override matches', async () => {
      const seen: Array<{ name: string | null | undefined; options: { marker?: string } }> = []
      const overridePlugin = definePlugin(() => ({
        name: 'override-plugin',
        options: {
          output: { path: '.' },
          exclude: [],
          override: [{ type: 'schemaName' as const, pattern: 'B', options: { marker: 'overridden' } }],
        },
        hooks: {
          'kubb:plugin:setup'(ctx) {
            ctx.addGenerator({
              name: 'override-gen',
              schema(node, generatorCtx) {
                seen.push({ name: node.name, options: generatorCtx.options as { marker?: string } })
              },
            })
          },
        },
      }))()

      await createKubb(
        {
          ...config,
          storage: memoryStorage(),
          adapter: makeAdapter({ schemas: [createSchema({ name: 'A', type: 'string' }), createSchema({ name: 'B', type: 'string' })] }),
          plugins: [overridePlugin as unknown as Plugin],
        },
        { hooks: new AsyncEventEmitter<KubbHooks>() },
      ).build()

      expect(seen).toHaveLength(2)
      expect(seen.find((entry) => entry.name === 'A')?.options.marker).toBeUndefined()
      expect(seen.find((entry) => entry.name === 'B')?.options.marker).toBe('overridden')
    })

    it('passes the same transformed node to operation and operations generators', async () => {
      const perNode: Array<OperationNode> = []
      let batch: Array<OperationNode> = []
      const transformPlugin = definePlugin(() => ({
        name: 'transform-plugin',
        hooks: {
          'kubb:plugin:setup'(ctx) {
            ctx.setTransformer({ operation: (node) => ({ ...node, operationId: `${node.operationId}X` }) })
            ctx.addGenerator({
              name: 'transform-gen',
              operation(node) {
                perNode.push(node)
              },
              operations(nodes) {
                batch = nodes
              },
            })
          },
        },
      }))()

      await createKubb(
        {
          ...config,
          storage: memoryStorage(),
          adapter: makeAdapter({
            operations: [createOperation({ operationId: 'getPet', method: 'GET', path: '/pet', parameters: [], responses: [], tags: [] })],
          }),
          plugins: [transformPlugin as unknown as Plugin],
        },
        { hooks: new AsyncEventEmitter<KubbHooks>() },
      ).build()

      expect(perNode).toHaveLength(1)
      expect(batch).toHaveLength(1)
      expect(perNode[0]?.operationId).toBe('getPetX')
      expect(batch[0]).toBe(perNode[0])
    })
  })

  describe('streaming flush during generation', () => {
    it('flushes files mid-generation when schema count exceeds STREAM_FLUSH_EVERY', async () => {
      const count = STREAM_FLUSH_EVERY + 10
      const schemas = Array.from({ length: count }, (_, i) => createSchema({ name: `FlushSchema${i}`, type: 'string' }))
      const hooks = new AsyncEventEmitter<KubbHooks>()
      const flushEvents: Array<number> = []
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
            parse: async () => ({
              kind: 'Input' as const,
              meta: { circularNames: [] as Array<string>, enumNames: [] as Array<string> },
              schemas,
              operations: [],
            }),
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
      const writtenPaths: Array<string> = []
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
