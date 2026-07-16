import os from 'node:os'
import path from 'node:path'
import { ast, type OperationNode, type SchemaNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, describe, expect, it, test, vi } from 'vitest'
import { createKubb } from './createKubb.ts'
import { type Diagnostic, Diagnostics } from './Diagnostics.ts'
import { definePlugin } from './definePlugin.ts'
import type { Adapter, Config, KubbHooks, Plugin, UserConfig } from './types.ts'
import { fsStorage } from './storages/fsStorage.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import { Hookable } from './Hookable.ts'

describe('createKubb', () => {
  const pluginMocks = {
    buildStart: vi.fn(),
    resolvePath: vi.fn(),
  } as const

  const file = ast.factory.createFile({
    path: 'hello/world.json',
    baseName: 'world.json',
    sources: [ast.factory.createSource({ nodes: [ast.factory.createText(`{ "hello": "world" }`)] })],
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
      hooks: new Hookable<KubbHooks>(),
    }).build()

    expect(files).toBeDefined()
    expect(driver).toBeDefined()
    // The plugin's buildStart already added the file during build
    expect(files.some((f) => f.baseName === file.baseName)).toBe(true)
  })

  test('resolves config defaults in the constructor, before setup', () => {
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
      hooks: new Hookable<KubbHooks>(),
    })

    expect(kubb.config.root).toBe(process.cwd())
    expect(kubb.config.parsers).toStrictEqual([])
  })

  test('output.clean raises a KUBB_CLEAN_ROOT diagnostic when the output is the project root', async () => {
    // A nonexistent temp dir as root, so a regression in the guard can only touch a throwaway path.
    const root = path.join(os.tmpdir(), 'kubb-clean-guard')
    const kubb = createKubb(
      {
        ...config,
        root,
        output: { path: '.', clean: true },
      },
      { hooks: new Hookable<KubbHooks>() },
    )

    await expect(kubb.setup()).rejects.toMatchObject({
      name: 'DiagnosticError',
      diagnostic: { code: Diagnostics.code.cleanRoot, severity: 'error', location: { kind: 'config' } },
    })
  })

  test('output.clean raises a KUBB_CLEAN_ROOT diagnostic when the output is a parent of the project root', async () => {
    const root = path.join(os.tmpdir(), 'kubb-clean-guard', 'nested')
    const kubb = createKubb(
      {
        ...config,
        root,
        output: { path: '..', clean: true },
      },
      { hooks: new Hookable<KubbHooks>() },
    )

    await expect(kubb.setup()).rejects.toMatchObject({
      name: 'DiagnosticError',
      diagnostic: { code: Diagnostics.code.cleanRoot },
    })
  })

  test('if build with one plugin is running the different hooks in the correct order', async () => {
    const { files } = await createKubb(config, {
      hooks: new Hookable<KubbHooks>(),
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
      hooks: new Hookable<KubbHooks>(),
    }).safeBuild()

    const problems = diagnostics.filter(Diagnostics.isProblem)
    expect(problems).toHaveLength(1)
    const diagnostic = problems[0]
    expect(diagnostic?.plugin).toBe('errorPlugin')
    // Hookable wraps the error; the original message survives on the diagnostic or its cause
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
      { hooks: new Hookable<KubbHooks>() },
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
      hooks: new Hookable<KubbHooks>(),
    }).safeBuild()

    expect(Diagnostics.hasError(result.diagnostics)).toBe(true)
  })

  it('should track plugin timings as performance diagnostics', async () => {
    const { diagnostics } = await createKubb(config, {
      hooks: new Hookable<KubbHooks>(),
    }).build()

    const timings = diagnostics.filter(Diagnostics.isPerformance)
    expect(timings.length).toBeGreaterThan(0)
    expect(timings.every((diagnostic) => typeof diagnostic.duration === 'number')).toBe(true)
  })

  it('should emit plugin lifecycle hooks', async () => {
    const hooks = new Hookable<KubbHooks>()
    const startSpy = vi.fn()
    const endSpy = vi.fn()

    hooks.hook('kubb:plugin:start', startSpy)
    hooks.hook('kubb:plugin:end', endSpy)

    await createKubb(config, { hooks }).build()

    expect(startSpy).toHaveBeenCalled()
    expect(endSpy).toHaveBeenCalled()
  })

  it('writes every generated file in one batch after plugin:end fires for each plugin', async () => {
    const hooks = new Hookable<KubbHooks>()
    const batches: Array<number> = []
    hooks.hook('kubb:files:processing:start', ({ files }) => {
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
                  ast.factory.createFile({
                    path: filePath,
                    baseName: filePath.split('/').pop() as `${string}.${string}`,
                    sources: [ast.factory.createSource({ nodes: [ast.factory.createText(`export const ${name.replaceAll('-', '_')} = null`)] })],
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
          schemas: [ast.factory.createSchema({ name: 'Pet', type: 'string' })],
          operations: [],
        }),
      }),
      plugins: [makePlugin('plugin-one', '/workspace/src/gen/one.ts'), makePlugin('plugin-two', '/workspace/src/gen/two.ts')] as unknown as Array<Plugin>,
    } satisfies Config

    const endOrder: Array<string> = []
    hooks.hook('kubb:plugin:end', ({ plugin }) => {
      endOrder.push(plugin.name)
    })

    const { files } = await createKubb(streamingConfig, { hooks }).build()

    // Plugins still run their generator pass sequentially, so `plugin:end` fires in
    // declaration order, which drives the CLI counter. Writing to storage happens once,
    // after every plugin (and post-processing) has finished generating.
    expect(batches).toStrictEqual([2])
    expect(endOrder).toStrictEqual(['plugin-one', 'plugin-two'])
    expect(files.map((file) => file.path)).toStrictEqual(['/workspace/src/gen/one.ts', '/workspace/src/gen/two.ts'])
  })

  it('cleans up hook-style plugin listeners between builds on shared hooks', async () => {
    const hooks = new Hookable<KubbHooks>()
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
                  ast.factory.createFile({
                    path,
                    baseName: `${node.name}.ts` as `${string}.ts`,
                    sources: [ast.factory.createSource({ nodes: [ast.factory.createText(`export const x = null`)] })],
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

    it('generates all files when the schema count spans several write batches', async () => {
      const count = 25
      const schemas = Array.from({ length: count }, (_, i) => ast.factory.createSchema({ name: `Schema${i}`, type: 'string' }))
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
        { hooks: new Hookable<KubbHooks>() },
      ).build()

      expect(files).toHaveLength(count)
      expect(generatedPaths).toHaveLength(count)
      expect(generatedPaths).toStrictEqual(schemas.map((s) => `/gen/${s.name}.ts`))
    })

    it('passes operations to gen.operations() in insertion order', async () => {
      const opCount = 19
      const operations = Array.from({ length: opCount }, (_, i) =>
        ast.factory.createOperation({ operationId: `op${i}`, method: 'GET', path: `/path${i}`, parameters: [], responses: [], tags: [] }),
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
        { hooks: new Hookable<KubbHooks>() },
      ).build()

      expect(receivedOrder).toStrictEqual(operations.map((o) => o.operationId))
    })
  })

  describe('per-node options and transform reuse', () => {
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

    it('resolves per-node options when an override matches', async () => {
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
          adapter: makeAdapter({ schemas: [ast.factory.createSchema({ name: 'A', type: 'string' }), ast.factory.createSchema({ name: 'B', type: 'string' })] }),
          plugins: [overridePlugin as unknown as Plugin],
        },
        { hooks: new Hookable<KubbHooks>() },
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
            ctx.setMacros([{ name: 'suffix-operation-id', operation: (node) => ({ ...node, operationId: `${node.operationId}X` }) }])
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
            operations: [ast.factory.createOperation({ operationId: 'getPet', method: 'GET', path: '/pet', parameters: [], responses: [], tags: [] })],
          }),
          plugins: [transformPlugin as unknown as Plugin],
        },
        { hooks: new Hookable<KubbHooks>() },
      ).build()

      expect(perNode).toHaveLength(1)
      expect(batch).toHaveLength(1)
      expect(perNode[0]?.operationId).toBe('getPetX')
      expect(batch[0]).toBe(perNode[0])
    })
  })

  describe('write batch after generation', () => {
    it('writes all generated files in a single batch, regardless of schema count', async () => {
      const count = 60
      const schemas = Array.from({ length: count }, (_, i) => ast.factory.createSchema({ name: `FlushSchema${i}`, type: 'string' }))
      const hooks = new Hookable<KubbHooks>()
      const batches: Array<number> = []
      hooks.hook('kubb:files:processing:start', ({ files }) => {
        batches.push(files.length)
      })

      const flushPlugin = definePlugin(() => ({
        name: 'flush-plugin',
        hooks: {
          'kubb:plugin:setup'(ctx) {
            ctx.addGenerator({
              name: 'flush-gen',
              schema(node) {
                return [
                  ast.factory.createFile({
                    path: `/gen/${node.name}.ts`,
                    baseName: `${node.name}.ts` as `${string}.ts`,
                    sources: [ast.factory.createSource({ nodes: [ast.factory.createText('export const x = null')] })],
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
      expect(batches).toStrictEqual([count])
    })
  })

  describe('large file writes', () => {
    it('writes every file exactly once', async () => {
      const fileCount = 105
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
                ast.factory.createFile({
                  path: `/gen/file${i}.ts`,
                  baseName: `file${i}.ts` as `${string}.ts`,
                  sources: [ast.factory.createSource({ nodes: [ast.factory.createText(`export const v${i} = ${i}`)] })],
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
        { hooks: new Hookable<KubbHooks>() },
      ).build()

      expect(files).toHaveLength(fileCount)
      expect(writtenPaths).toHaveLength(fileCount)
      expect(new Set(writtenPaths).size).toBe(fileCount)
    })
  })
})

describe('Kubb#generate', () => {
  const makeConfig = (overrides: Partial<Config> = {}): Config => ({
    root: '.',
    input: { path: './petStore.yaml' },
    output: { path: './gen' },
    parsers: [],
    reporters: [],
    adapter: createMockedAdapter(),
    plugins: [],
    storage: memoryStorage(),
    ...overrides,
  })

  const failingAdapter = (): Adapter =>
    createMockedAdapter({
      parse: async () => {
        throw new Error('boom')
      },
    })

  let hooks: Hookable<KubbHooks>
  afterEach(() => hooks?.removeAllHooks())

  it('emits generation:start before generation:end and ends with success', async () => {
    hooks = new Hookable<KubbHooks>()
    const events: Array<string> = []
    let endStatus: string | undefined
    hooks.hook('kubb:generation:start', () => {
      events.push('start')
    })
    hooks.hook('kubb:generation:end', ({ status }) => {
      events.push('end')
      endStatus = status
    })

    const result = await createKubb(makeConfig(), { hooks }).generate()

    expect(events).toStrictEqual(['start', 'end'])
    expect(endStatus).toBe('success')
    expect(result.success).toBe(true)
  })

  it('reports failure and ends failed when processOutput returns an error', async () => {
    hooks = new Hookable<KubbHooks>()
    const diagnostic: Diagnostic = { code: Diagnostics.code.formatFailed, severity: 'error', message: 'formatter failed', location: { kind: 'config' } }
    let endStatus: string | undefined
    hooks.hook('kubb:generation:end', ({ status }) => {
      endStatus = status
    })

    const result = await createKubb(makeConfig(), { hooks }).generate({
      processOutput: async () => [diagnostic],
    })

    expect(result.success).toBe(false)
    expect(result.diagnostics).toContain(diagnostic)
    expect(endStatus).toBe('failed')
  })

  it('stops after a build error without running processOutput', async () => {
    hooks = new Hookable<KubbHooks>()
    let ranProcessOutput = false

    const result = await createKubb(makeConfig({ adapter: failingAdapter() }), { hooks }).generate({
      processOutput: async () => {
        ranProcessOutput = true
        return []
      },
    })

    expect(result.success).toBe(false)
    expect(ranProcessOutput).toBe(false)
  })

  it('routes an unknown-code build error to the kubb:error hook', async () => {
    hooks = new Hookable<KubbHooks>()
    const messages: Array<string> = []
    hooks.hook('kubb:error', ({ error }) => {
      messages.push(error.message)
    })

    await createKubb(makeConfig({ adapter: failingAdapter() }), { hooks }).generate()

    expect(messages).toContain('boom')
  })
})
