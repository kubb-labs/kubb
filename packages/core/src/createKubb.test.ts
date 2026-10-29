import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { ast, type OperationNode, type SchemaNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, describe, expect, it, test, vi } from 'vitest'
import { createKubb } from './createKubb.ts'
import { type Diagnostic, Diagnostics } from './Diagnostics.ts'
import { defineExtension } from './defineExtension.ts'
import type { Config, KubbHooks } from './types.ts'
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
      meta: {},
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
  return defineExtension({
    kind: 'plugin',
    meta: { name },
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
  })()
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
  const plugin = defineExtension({
    kind: 'plugin',
    meta: { name: 'plugin' },
    hooks: {
      'kubb:plugin:setup'(ctx) {
        pluginMocks.buildStart()
        ctx.injectFile(file)
      },
    },
  })()

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

  test('moves inline sources into the files that import them and does not write the virtual file', async () => {
    const types = ast.factory.createFile({
      path: '/gen/types/AddPet.ts',
      baseName: 'AddPet.ts',
      sources: [ast.factory.createSource({ name: 'AddPetBody', inline: { expression: '{ name: string }' }, nodes: [ast.factory.createText('')] })],
    })
    const client = ast.factory.createFile({
      path: '/gen/clients/addPet.ts',
      baseName: 'addPet.ts',
      imports: [
        ast.factory.createImport({ name: ['AddPetBody', 'AddPetStatus404', 'AddPetStatus500'], path: '/gen/types/AddPet.ts', root: '/gen/clients/addPet.ts' }),
      ],
      sources: [
        ast.factory.createSource({
          nodes: [ast.factory.createText('export function addPet(body: AddPetBody, status: AddPetStatus404 | AddPetStatus500) {}')],
        }),
      ],
    })
    const injector = defineExtension({
      kind: 'plugin',
      meta: { name: 'injector' },
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.injectFile(types)
          ctx.injectFile(client)
        },
      },
    })()

    // A parser whose language treats every word as a reference.
    const words = defineExtension({
      kind: 'parser',
      meta: { name: 'words' },
      build: () => ({
        extNames: ['.ts'],
        parse: () => '',
        print: () => '',
        inline: {
          replaceIdentifiers: (text, replace) => text.replace(/[A-Za-z_$][\w$]*/g, (name) => replace(name) ?? name),
          wrap: (expression) => `(${expression})`,
        },
      }),
    })()

    const { files, diagnostics } = await createKubb(makeConfig({ plugins: [injector] as unknown as Array<Plugin>, parsers: [words] }), {
      hooks: new Hookable<KubbHooks>(),
    }).safeBuild()

    expect(files.map(({ path, imports, sources }) => ({ path, imports, code: sources[0]?.nodes })).filter(({ path }) => path.startsWith('/gen/'))).toEqual([
      {
        path: '/gen/clients/addPet.ts',
        imports: [],
        code: [{ kind: 'Text', value: 'export function addPet(body: ({ name: string }), status: AddPetStatus404 | AddPetStatus500) {}' }],
      },
    ])
    // Both missing names survive `Diagnostics.dedupe`, in one diagnostic.
    const inlineFailed = diagnostics.filter((diagnostic) => 'code' in diagnostic && diagnostic.code === Diagnostics.code.inlineFailed)
    expect(inlineFailed).toEqual([expect.objectContaining({ severity: 'error', message: expect.stringMatching(/AddPetStatus404[\s\S]*AddPetStatus500/) })])
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

  it('raises a KUBB_INCOMPATIBLE_EXTENSION diagnostic when a plugin requires a newer Kubb', async () => {
    const future = defineExtension({ kind: 'plugin', meta: { name: 'plugin-future', compatibility: { kubb: '>=99' } } })()
    const kubb = createKubb(makeConfig({ ...config, plugins: [future] }), { hooks: new Hookable<KubbHooks>() })

    await expect(kubb.setup()).rejects.toMatchObject({
      name: 'DiagnosticError',
      diagnostic: { code: Diagnostics.code.incompatibleExtension, severity: 'error', plugin: 'plugin-future', location: { kind: 'config' } },
    })
  })

  it('names the plugin whose setup threw, so the summary counts it as failed', async () => {
    const throwingSetup = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-throws' },
      hooks: {
        'kubb:plugin:setup'() {
          throw new Error('query.methods.some is not a function')
        },
      },
    })()

    const { diagnostics } = await createKubb(makeConfig({ ...config, plugins: [throwingSetup] }), { hooks: new Hookable<KubbHooks>() }).safeBuild()

    expect(Diagnostics.failedPlugins(diagnostics)).toStrictEqual(['plugin-throws'])
  })

  it('does not report a dependency missing from the config', async () => {
    const dependent = defineExtension({ kind: 'plugin', meta: { name: 'plugin-dependent' }, dependencies: ['plugin-missing'], hooks: {} })()

    const { diagnostics } = await createKubb(makeConfig({ ...config, plugins: [dependent] }), { hooks: new Hookable<KubbHooks>() }).safeBuild()

    expect(diagnostics.filter(Diagnostics.isProblem)).toStrictEqual([])
  })

  it('fails the run when setup requires a plugin the config lacks, naming the plugin that needs it', async () => {
    const dependent = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-dependent' },
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.requirePlugin('plugin-missing')
        },
      },
    })()

    const { diagnostics } = await createKubb(makeConfig({ ...config, plugins: [dependent] }), { hooks: new Hookable<KubbHooks>() }).safeBuild()

    expect(diagnostics.filter(Diagnostics.isProblem)).toStrictEqual([
      expect.objectContaining({
        code: Diagnostics.code.pluginNotFound,
        severity: 'error',
        plugin: 'plugin-dependent',
        message: 'Plugin "plugin-missing" is required by "plugin-dependent" but not found. Make sure it is included in your Kubb config.',
      }),
    ])
  })

  it('keeps the previous output when output.clean is set and the run fails before writing', async () => {
    const storage = memoryStorage()
    const outputFile = path.resolve('.', 'gen', 'previous.ts')
    await storage.writeItem(outputFile, 'export const previous = 1\n')
    const failingAdapter = createMockedAdapter({
      parse: async () => {
        throw new Error('The spec is not valid')
      },
    })

    const result = await createKubb(makeConfig({ ...config, adapter: failingAdapter, storage, output: { path: './gen', clean: true } }), {
      hooks: new Hookable<KubbHooks>(),
    }).generate()

    expect(result.success).toBe(false)
    expect(await storage.readItem(outputFile)).toBe('export const previous = 1\n')
  })

  it('returns a failed plugin as one error diagnostic naming the plugin from safeBuild', async () => {
    const errorPlugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'errorPlugin' },
      hooks: {
        'kubb:plugin:start'() {
          throw new Error('Installation failed')
        },
      },
    })()

    const { diagnostics } = await createKubb(makeConfig({ ...config, plugins: [errorPlugin] }), { hooks: new Hookable<KubbHooks>() }).safeBuild()

    const problems = diagnostics.filter(Diagnostics.isProblem)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatchObject({ plugin: 'errorPlugin', severity: 'error' })
    // Hookable wraps the error; the original message survives on the diagnostic or its cause
    expect(`${problems[0]?.message} ${problems[0]?.cause?.message ?? ''}`).toContain('Installation failed')
    expect(Diagnostics.hasError(diagnostics)).toBe(true)
  })

  // Plugins generate sequentially, so `plugin:end` fires in declaration order; storage is written once at the end.
  it.each([[60, 2]])('writes all %i generated files in one batch after plugin:end fired for each of %i plugins', async (schemaCount, pluginCount) => {
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
    const hookPlugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'hook-plugin' },
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({
            name: 'hook-gen',
            operations: vi.fn(),
          })
        },
      },
    })()
    const hookConfig = makeConfig({ ...config, plugins: [hookPlugin] })

    await createKubb(hookConfig, { hooks }).build()
    await createKubb(hookConfig, { hooks }).build()

    expect(hooks.listenerCount('kubb:plugin:setup')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:schema')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:operation')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:operations')).toBe(0)
  })

  describe('per-node options and transform reuse', () => {
    it('resolves per-node options when an override matches', async () => {
      const seen: Array<{ name: string | null | undefined; options: { marker?: string } }> = []
      const overridePlugin = defineExtension({
        kind: 'plugin',
        meta: { name: 'override-plugin' },
        hooks: {
          'kubb:plugin:setup'(ctx) {
            ctx.setOptions({
              output: { path: '.' },
              exclude: [],
              override: [{ type: 'schemaName' as const, pattern: 'B', options: { marker: 'overridden' } }],
            })
            ctx.addGenerator({
              name: 'override-gen',
              schema(node, generatorCtx) {
                seen.push({ name: node.name, options: generatorCtx.options as { marker?: string } })
              },
            })
          },
        },
      })()

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

    it('filters operations by vendor extension in exclude, include, and override', async () => {
      const operation = (operationId: string, extensions?: Record<string, unknown>) =>
        ast.factory.createOperation({ operationId, method: 'GET', path: `/${operationId}`, parameters: [], responses: [], tags: [], extensions })
      const operations = [operation('hidden', { 'x-org-ignore': true }), operation('shown', { 'x-org-ignore': false, 'x-org-beta': 'yes' }), operation('plain')]
      const run = async (options: Record<string, unknown>) => {
        const seen: Array<{ operationId: string; marker?: string }> = []
        const plugin = defineExtension({
          kind: 'plugin',
          meta: { name: 'extension-filter-plugin' },
          hooks: {
            'kubb:plugin:setup'(ctx) {
              ctx.setOptions({ output: { path: '.' }, exclude: [], override: [], ...options })
              ctx.addGenerator({
                name: 'extension-filter-gen',
                operation(node, generatorCtx) {
                  seen.push({ operationId: node.operationId, marker: (generatorCtx.options as { marker?: string }).marker })
                },
              })
            },
          },
        })()

        await createKubb(makeConfig({ adapter: makeAdapter({ operations }), plugins: [plugin as unknown as Plugin] }), {
          hooks: new Hookable<KubbHooks>(),
        }).build()

        return seen
      }

      expect((await run({ exclude: [{ type: 'extension', key: 'x-org-ignore', value: true }] })).map(({ operationId }) => operationId)).toEqual([
        'shown',
        'plain',
      ])
      expect((await run({ include: [{ type: 'extension', key: 'x-org-beta' }] })).map(({ operationId }) => operationId)).toEqual(['shown'])
      expect(await run({ override: [{ type: 'extension', key: 'x-org-ignore', options: { marker: 'flagged' } }] })).toEqual([
        { operationId: 'hidden', marker: 'flagged' },
        { operationId: 'shown', marker: 'flagged' },
        { operationId: 'plain', marker: undefined },
      ])
    })

    it('passes the same transformed node to operation and operations generators', async () => {
      const perNode: Array<OperationNode> = []
      let batch: Array<OperationNode> = []
      const transformPlugin = defineExtension({
        kind: 'plugin',
        meta: { name: 'transform-plugin' },
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
      })()

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

  it('turns a setup failure into an emitted diagnostic and a failed generation:end', async () => {
    hooks = new Hookable<KubbHooks>()
    const emitted: Array<string> = []
    let end: { status?: string; diagnostics?: Array<Diagnostic> } | undefined
    hooks.hook('kubb:diagnostic', ({ diagnostic }) => {
      emitted.push(diagnostic.code)
    })
    hooks.hook('kubb:generation:end', (ctx) => {
      end = ctx
    })

    const result = await createKubb(makeConfig({ plugins: [null as unknown as Plugin] }), { hooks }).generate()

    expect(result.success).toBe(false)
    expect(emitted).toStrictEqual([Diagnostics.code.invalidPluginOptions])
    expect(end?.status).toBe('failed')
    expect(end?.diagnostics).toMatchObject([{ code: Diagnostics.code.invalidPluginOptions, message: 'plugins[0] is null, not a plugin.' }])
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

  it.each([
    ['skips processOutput when the storage keeps the output in memory', memoryStorage, 0],
    ['runs processOutput once when the storage writes the output to disk', fsStorage, 1],
  ])('%s', async (_name, storage, calls) => {
    hooks = new Hookable<KubbHooks>()
    const formatStarted = vi.fn()
    hooks.hook('kubb:format:start', formatStarted)
    const processOutput = vi.fn(async () => [])

    const result = await createKubb(makeConfig({ root: tempRoot(), storage: storage(), output: { path: './gen', format: 'prettier' } }), { hooks }).generate({
      processOutput,
    })

    expect(result.success).toBe(true)
    expect(processOutput).toHaveBeenCalledTimes(calls)
    expect(formatStarted).not.toHaveBeenCalled()
  })

  it('reports an adapter crash as KUBB_ADAPTER_FAILED and stops without running processOutput', async () => {
    hooks = new Hookable<KubbHooks>()
    const messages: Array<string> = []
    hooks.hook('kubb:diagnostic', ({ diagnostic }) => {
      messages.push(`${diagnostic.code} ${diagnostic.message}`)
    })
    let ranProcessOutput = false

    const result = await createKubb(makeConfig({ adapter: failingAdapter() }), { hooks }).generate({
      processOutput: async () => {
        ranProcessOutput = true
        return []
      },
    })

    expect(result.success).toBe(false)
    expect(messages).toStrictEqual(['KUBB_ADAPTER_FAILED adapter "oas" crashed: boom'])
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
      const plugin = defineExtension({
        kind: 'plugin',
        meta: { name: 'plugin' },
        hooks: {
          'kubb:plugin:setup'(ctx) {
            ctx.injectFile(makeFile(filePath, source))
          },
        },
      })()

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
