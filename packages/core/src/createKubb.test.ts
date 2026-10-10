import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { ast, type OperationNode, type SchemaNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, describe, expect, it, test, vi } from 'vitest'
import { createKubb } from './createKubb.ts'
import { type Diagnostic, Diagnostics } from './Diagnostics.ts'
import { definePlugin } from './definePlugin.ts'
import type { Config, KubbHooks, UserConfig } from './types.ts'
import type { Adapter } from './createAdapter.ts'
import type { Plugin } from './definePlugin.ts'
import { resolveCacheDir } from './storages/cacheStorage.ts'
import { fsStorage } from './storages/fsStorage.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import { Hookable } from './Hookable.ts'

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    root: '.',
    input: './petStore.yaml',
    output: { path: './gen' },
    parsers: [],
    reporters: [],
    adapter: createMockedAdapter(),
    plugins: [],
    storage: memoryStorage(),
    ...overrides,
  }
}

function makeAdapter({ schemas = [], operations = [] }: { schemas?: Array<SchemaNode>; operations?: Array<OperationNode> } = {}): Adapter {
  return createMockedAdapter({
    parse: async () => ({
      kind: 'Input' as const,
      meta: { circularNames: [] as Array<string>, enumNames: [] as Array<string> },
      schemas,
      operations,
    }),
  })
}

function makeFile(filePath: string, source: string) {
  return ast.factory.createFile({
    path: filePath,
    baseName: filePath.split('/').pop() as `${string}.${string}`,
    sources: [ast.factory.createSource({ nodes: [ast.factory.createText(source)] })],
    imports: [],
    exports: [],
  })
}

/**
 * A plugin whose generator emits one file per schema node, under `/gen/<plugin>/`.
 */
function makeSchemaPlugin(name: string, onSchema?: (node: SchemaNode) => void): Plugin {
  return definePlugin(() => ({
    name,
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.addGenerator({
          name: `${name}-generator`,
          schema(node) {
            onSchema?.(node)
            return [makeFile(`/gen/${name}/${node.name}.ts`, `export const ${name.replaceAll('-', '_')} = null`)]
          },
        })
      },
    },
  }))()
}

function makeSchemas(count: number, prefix = 'Schema'): Array<SchemaNode> {
  return Array.from({ length: count }, (_, i) => ast.factory.createSchema({ name: `${prefix}${i}`, type: 'string' }))
}

describe('createKubb', () => {
  const pluginMocks = {
    buildStart: vi.fn(),
    resolvePath: vi.fn(),
  } as const

  const file = makeFile('hello/world.json', `{ "hello": "world" }`)
  const plugin = definePlugin(() => ({
    name: 'plugin',
    hooks: {
      'kubb:plugin:setup'(ctx) {
        pluginMocks.buildStart()
        ctx.injectFile(file)
      },
    },
  }))()

  const config = makeConfig({ output: { path: './gen', clean: true }, plugins: [plugin] as unknown as Array<Plugin> })

  afterEach(() => {
    Object.keys(pluginMocks).forEach((key) => {
      const mock = pluginMocks[key as keyof typeof pluginMocks]

      mock.mockClear()
    })
  })

  test('returns the files a plugin injected during setup from build', async () => {
    const { driver, files } = await createKubb(config, {
      hooks: new Hookable<KubbHooks>(),
    }).build()

    expect(driver).toBeDefined()
    expect(files.map(({ baseName, sources }) => ({ baseName, sources }))).toStrictEqual([
      {
        baseName: 'world.json',
        sources: [{ kind: 'Source', nodes: [{ kind: 'Text', value: '{ "hello": "world" }' }] }],
      },
    ])
    expect(pluginMocks.buildStart).toHaveBeenCalledTimes(1)
  })

  test('resolves config defaults in the constructor, before setup', () => {
    const userConfig = {
      input: 'https://petstore3.swagger.io/api/v3/openapi.json',
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

  test('stops before setup when its signal is aborted', async () => {
    const controller = new AbortController()
    controller.abort(new Error('Canceled'))

    await expect(createKubb(config, { signal: controller.signal }).build()).rejects.toThrow('Canceled')
  })

  test('stops mid-build when its signal aborts during parsing', async () => {
    const controller = new AbortController()
    let releaseParse: (() => void) | undefined
    const parseStarted = new Promise<void>((resolve) => {
      releaseParse = resolve
    })

    const waitingAdapter = createMockedAdapter({
      parse: async (_source, { signal } = {}) => {
        releaseParse?.()
        await delay(50)
        signal?.throwIfAborted()
        return ast.factory.createInput()
      },
    })

    const promise = createKubb(makeConfig({ adapter: waitingAdapter, plugins: config.plugins }), {
      hooks: new Hookable<KubbHooks>(),
      signal: controller.signal,
    }).generate()

    await parseStarted
    controller.abort(new Error('Canceled'))

    await expect(promise).rejects.toThrow('Canceled')
  })

  // A nonexistent temp dir as root, so a regression in the guard can only touch a throwaway path.
  test.each([
    ['the project root', path.join(os.tmpdir(), 'kubb-clean-guard'), '.'],
    ['a parent of the project root', path.join(os.tmpdir(), 'kubb-clean-guard', 'nested'), '..'],
  ])('output.clean raises a KUBB_CLEAN_ROOT diagnostic when the output is %s', async (_name, root, outputPath) => {
    const kubb = createKubb(makeConfig({ ...config, root, output: { path: outputPath, clean: true } }), { hooks: new Hookable<KubbHooks>() })

    await expect(kubb.setup()).rejects.toMatchObject({
      name: 'DiagnosticError',
      diagnostic: { code: Diagnostics.code.cleanRoot, severity: 'error', location: { kind: 'config' } },
    })
  })

  it('returns a failed plugin as one error diagnostic naming the plugin from safeBuild', async () => {
    const errorPlugin = definePlugin(() => ({
      name: 'errorPlugin',
      hooks: {
        'kubb:plugin:start'() {
          throw new Error('Installation failed')
        },
      },
    }))()

    const { diagnostics } = await createKubb(makeConfig({ ...config, plugins: [errorPlugin] }), { hooks: new Hookable<KubbHooks>() }).safeBuild()

    const problems = diagnostics.filter(Diagnostics.isProblem)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatchObject({ plugin: 'errorPlugin', severity: 'error' })
    // Hookable wraps the error; the original message survives on the diagnostic or its cause
    expect(`${problems[0]?.message} ${problems[0]?.cause?.message ?? ''}`).toContain('Installation failed')
    expect(Diagnostics.hasError(diagnostics)).toBe(true)
  })

  it('should track plugin timings as performance diagnostics', async () => {
    const { diagnostics } = await createKubb(config, {
      hooks: new Hookable<KubbHooks>(),
    }).build()

    const timings = diagnostics.filter(Diagnostics.isPerformance)
    expect(timings.length).toBeGreaterThan(0)
    expect(timings.every((diagnostic) => typeof diagnostic.duration === 'number')).toBe(true)
  })

  // Plugins generate sequentially, so `plugin:end` fires in declaration order; storage is written once at the end.
  it.each([
    [2, 1],
    [25, 1],
    [60, 1],
    [2, 2],
  ])('writes all %i generated files in one batch after plugin:end fired for each of %i plugins', async (schemaCount, pluginCount) => {
    const hooks = new Hookable<KubbHooks>()
    const batches: Array<number> = []
    const endOrder: Array<string> = []
    hooks.hook('kubb:files:processing:start', ({ files }) => {
      batches.push(files.length)
    })
    hooks.hook('kubb:plugin:end', ({ plugin }) => {
      endOrder.push(plugin.name)
    })
    const names = Array.from({ length: pluginCount }, (_, i) => `plugin-${i}`)

    const { files } = await createKubb(
      makeConfig({ adapter: makeAdapter({ schemas: makeSchemas(schemaCount) }), plugins: names.map((name) => makeSchemaPlugin(name)) }),
      { hooks },
    ).build()

    expect(batches).toStrictEqual([schemaCount * pluginCount])
    expect(endOrder).toStrictEqual(names)
    expect(files.map((file) => file.path).toSorted()).toStrictEqual(
      names.flatMap((name) => makeSchemas(schemaCount).map((schema) => `/gen/${name}/${schema.name}.ts`)).toSorted(),
    )
  })

  it('streams file-processing updates in generation order with a sequential counter and no source', async () => {
    const hooks = new Hookable<KubbHooks>()
    const updateRows: Array<{ path: string; processed: number; total: number; hasSource: boolean }> = []
    hooks.hook('kubb:files:processing:update', ({ files }) => {
      for (const row of files) {
        updateRows.push({ path: row.file.path, processed: row.processed, total: row.total, hasSource: 'source' in row })
      }
    })

    await createKubb(
      makeConfig({
        adapter: makeAdapter({ schemas: [ast.factory.createSchema({ name: 'Pet', type: 'string' })] }),
        plugins: [makeSchemaPlugin('plugin-one'), makeSchemaPlugin('plugin-two'), makeSchemaPlugin('plugin-three')],
      }),
      { hooks },
    ).build()

    // Order matches the generated files, and the counter is a clean 1..N, regardless of the
    // order the concurrent write pass finished each file in. Buffering the source is what used to
    // hold the whole output tree in memory for the batch, so a row carries none.
    expect(updateRows).toStrictEqual([
      { path: '/gen/plugin-one/Pet.ts', processed: 1, total: 3, hasSource: false },
      { path: '/gen/plugin-two/Pet.ts', processed: 2, total: 3, hasSource: false },
      { path: '/gen/plugin-three/Pet.ts', processed: 3, total: 3, hasSource: false },
    ])
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
    const hookConfig = makeConfig({ ...config, plugins: [hookPlugin] })

    await createKubb(hookConfig, { hooks }).build()
    await createKubb(hookConfig, { hooks }).build()

    expect(hooks.listenerCount('kubb:plugin:setup')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:schema')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:operation')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:operations')).toBe(0)
  })

  it('does not throw when userConfig.plugins is undefined', async () => {
    const { plugins: _plugins, ...userConfig } = makeConfig()

    await expect(createKubb(userConfig).safeBuild()).resolves.not.toThrow()
  })

  it('passes operations to gen.operations() in insertion order', async () => {
    const operations = Array.from({ length: 19 }, (_, i) =>
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

    await createKubb(makeConfig({ adapter: makeAdapter({ operations }), plugins: [orderPlugin] }), { hooks: new Hookable<KubbHooks>() }).build()

    expect(receivedOrder).toStrictEqual(operations.map((o) => o.operationId))
  })

  describe('per-node options and transform reuse', () => {
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
        makeConfig({
          adapter: makeAdapter({ schemas: [ast.factory.createSchema({ name: 'A', type: 'string' }), ast.factory.createSchema({ name: 'B', type: 'string' })] }),
          plugins: [overridePlugin as unknown as Plugin],
        }),
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
        makeConfig({
          adapter: makeAdapter({
            operations: [ast.factory.createOperation({ operationId: 'getPet', method: 'GET', path: '/pet', parameters: [], responses: [], tags: [] })],
          }),
          plugins: [transformPlugin],
        }),
        { hooks: new Hookable<KubbHooks>() },
      ).build()

      expect(perNode).toHaveLength(1)
      expect(batch).toHaveLength(1)
      expect(perNode[0]?.operationId).toBe('getPetX')
      expect(batch[0]).toBe(perNode[0])
    })
  })

  describe('large file writes', () => {
    it('writes every file exactly once', async () => {
      const fileCount = 105
      const writtenPaths: Array<string> = []
      const storage = memoryStorage()
      const originalWriteItem = storage.writeItem.bind(storage)
      storage.writeItem = async (key, value) => {
        writtenPaths.push(key)
        return originalWriteItem(key, value)
      }

      const plugin = definePlugin(() => ({
        name: 'write-plugin',
        hooks: {
          'kubb:plugin:setup'(ctx) {
            for (let i = 0; i < fileCount; i++) {
              ctx.injectFile(makeFile(`/gen/file${i}.ts`, `export const v${i} = ${i}`))
            }
          },
        },
      }))()

      const { files } = await createKubb(makeConfig({ storage, plugins: [plugin] }), { hooks: new Hookable<KubbHooks>() }).build()

      expect(files).toHaveLength(fileCount)
      expect(writtenPaths).toHaveLength(fileCount)
      expect(new Set(writtenPaths).size).toBe(fileCount)
    })
  })
})

type ProjectBuild = {
  source?: string
  processOutput?: () => Promise<Array<Diagnostic>>
}

describe('Kubb#generate', () => {
  const roots: Array<string> = []

  // Each root also seeds a cache directory outside it, so both have to be removed.
  afterEach(() => {
    for (const root of roots.splice(0)) {
      fs.rmSync(root, { recursive: true, force: true })
      fs.rmSync(resolveCacheDir(root), { recursive: true, force: true })
    }
  })

  const tempRoot = () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kubb-generate-'))
    roots.push(root)
    return root
  }

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

    const result = await createKubb(makeConfig({ root: tempRoot(), storage: fsStorage() }), { hooks }).generate({
      processOutput: async () => [diagnostic],
    })

    expect(result.success).toBe(false)
    expect(result.diagnostics).toContain(diagnostic)
    expect(endStatus).toBe('failed')
  })

  it('skips processOutput and the format pass when the storage keeps the output in memory', async () => {
    hooks = new Hookable<KubbHooks>()
    const formatStarted = vi.fn()
    hooks.hook('kubb:format:start', formatStarted)
    const processOutput = vi.fn(async () => [])

    const result = await createKubb(makeConfig({ root: tempRoot(), storage: memoryStorage(), output: { path: './gen', format: 'prettier' } }), {
      hooks,
    }).generate({
      processOutput,
    })

    expect(result.success).toBe(true)
    expect(processOutput).not.toHaveBeenCalled()
    expect(formatStarted).not.toHaveBeenCalled()
  })

  it('runs processOutput once when the storage writes the output to disk', async () => {
    hooks = new Hookable<KubbHooks>()
    const processOutput = vi.fn(async () => [])

    await createKubb(makeConfig({ root: tempRoot(), storage: fsStorage(), output: { path: './gen', format: 'prettier' } }), { hooks }).generate({
      processOutput,
    })

    expect(processOutput).toHaveBeenCalledTimes(1)
  })

  it('routes a build error to the kubb:error hook and stops without running processOutput', async () => {
    hooks = new Hookable<KubbHooks>()
    const messages: Array<string> = []
    hooks.hook('kubb:error', ({ error }) => {
      messages.push(error.message)
    })
    let ranProcessOutput = false

    const result = await createKubb(makeConfig({ adapter: failingAdapter() }), { hooks }).generate({
      processOutput: async () => {
        ranProcessOutput = true
        return []
      },
    })

    expect(result.success).toBe(false)
    expect(messages).toStrictEqual(['boom'])
    expect(ranProcessOutput).toBe(false)
  })

  /**
   * A throwaway project with one generated file, so the manifest tests can regenerate it with a
   * different source or a different output pass without repeating the setup.
   */
  const createProject = ({ format = 'oxfmt' as Config['output']['format'] } = {}) => {
    const root = tempRoot()

    const filePath = path.join(root, 'gen', 'world.ts')
    const storage = fsStorage()

    const generate = ({ source = `export const hello = 'world'`, processOutput = async () => [] }: ProjectBuild = {}) => {
      const plugin = definePlugin(() => ({
        name: 'plugin',
        hooks: {
          'kubb:plugin:setup'(ctx) {
            ctx.injectFile(makeFile(filePath, source))
          },
        },
      }))()

      const config = makeConfig({ root, output: { path: './gen', format }, storage, plugins: [plugin] })
      return createKubb(config, { hooks: new Hookable<KubbHooks>() }).generate({ processOutput })
    }

    return {
      filePath,
      storage,
      generate,
      read: () => fs.readFileSync(filePath, { encoding: 'utf-8' }),
      mtime: () => fs.statSync(filePath).mtimeMs,
      hasManifest: () => fs.existsSync(path.join(resolveCacheDir(root), 'output-manifest.json')),
    }
  }

  it('does not rewrite the output on a rebuild after the formatter reflowed it', async () => {
    const project = createProject()

    // Stands in for the formatter: reflows what Kubb wrote, exactly as prettier or biome would on a
    // config that disagrees with Kubb's style, and like them leaves an already-formatted file alone.
    const formatted = 'export const hello = "world";\n'
    const processOutput = async () => {
      if (project.read() !== formatted) fs.writeFileSync(project.filePath, formatted, { encoding: 'utf-8' })
      return []
    }

    await project.generate({ processOutput })
    const afterFirst = project.mtime()

    // Long enough that a rewrite would move mtime, which is what the issue reports watchers seeing.
    await delay(10)
    const writeItem = vi.spyOn(project.storage, 'writeItem')
    await project.generate({ processOutput })

    // The manifest itself still goes through the storage, so scope this to the generated file.
    expect(writeItem).not.toHaveBeenCalledWith(project.filePath, expect.anything())
    expect(project.mtime()).toBe(afterFirst)
    expect(project.read()).toBe(formatted)
  })

  it('rewrites the output when the generated source actually changed', async () => {
    const project = createProject()
    await project.generate()

    await project.generate({ source: `export const hello = 'moon'` })

    expect(project.read()).toBe(`export const hello = 'moon'\n`)
  })

  it.each<[string, Parameters<typeof createProject>[0], ProjectBuild]>([
    [
      'an output pass failed',
      {},
      {
        processOutput: async () => [{ code: Diagnostics.code.formatFailed, severity: 'error', message: 'formatter failed', location: { kind: 'config' } }],
      },
    ],
    ['nothing runs over the output', { format: false }, {}],
  ])('keeps no manifest when %s', async (_name, projectOptions, build) => {
    const project = createProject(projectOptions)

    await project.generate(build)

    expect(project.hasManifest()).toBe(false)
  })
})
