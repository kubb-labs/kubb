import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { ast, type OperationNode, type SchemaNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, describe, expect, it, test, vi } from 'vitest'
import { createKubb, Kubb } from './kubb.ts'
import { type Diagnostic, Diagnostics } from './Diagnostics.ts'
import { defineExtension } from './defineExtension.ts'
import type { Config, KubbHooks, UserConfig } from './types.ts'
import type { Adapter } from './createAdapter.ts'
import type { Plugin } from './definePlugin.ts'
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
 * A plugin whose visit hook emits one file per schema node, under `/gen/<plugin>/`.
 */
function makeSchemaPlugin(name: string, onSchema?: (node: SchemaNode) => void): Plugin {
  return defineExtension({
    kind: 'plugin',
    meta: { name },
    hooks: {
      async 'kubb:plugin:visit:schema'(node, ctx) {
        onSchema?.(node)
        await ctx.dispatch({ result: [makeFile(`/gen/${name}/${node.name}.ts`, `export const ${name.replaceAll('-', '_')} = null`)], pointer: node.pointer })
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
  test('output.clean raises a KUBB_CLEAN_ROOT diagnostic when the output is the project root', async () => {
    const root = path.join(os.tmpdir(), 'kubb-clean-guard')
    const kubb = createKubb(makeConfig({ ...config, root, output: { path: '.', clean: true } }), { hooks: new Hookable<KubbHooks>() })

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

  it('output.clean raises a KUBB_CLEAN_ROOT diagnostic when shared.path is the project root', async () => {
    const root = path.join(os.tmpdir(), 'kubb-clean-guard')
    const shared = makeConfig({ ...config, root, output: { path: './gen', clean: true }, shared: { path: '.' } })

    const [first] = await Array.fromAsync(Kubb.generate([shared, shared]))

    expect(first!.diagnostics).toContainEqual(expect.objectContaining({ code: Diagnostics.code.cleanRoot, help: expect.stringContaining('`shared.path`') }))
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

  it('names the plugin whose kubb:plugins:end hook threw, instead of an unknown error', async () => {
    const throwing = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-barrel-like' },
      hooks: {
        'kubb:plugins:end'() {
          throw new Error('barrel crashed')
        },
      },
    })()

    const { diagnostics } = await createKubb(makeConfig({ ...config, plugins: [throwing] }), { hooks: new Hookable<KubbHooks>() }).safeBuild()

    expect(diagnostics.filter(Diagnostics.isProblem)).toStrictEqual([
      expect.objectContaining({ code: Diagnostics.code.pluginFailed, plugin: 'plugin-barrel-like', message: expect.stringContaining('barrel crashed') }),
    ])
  })

  it('leaves no plugin listener behind when setup fails on an invalid input', async () => {
    const hooks = new Hookable<KubbHooks>()
    const onBuildEnd = vi.fn()
    const listener = defineExtension({ kind: 'plugin', meta: { name: 'plugin-listener' }, hooks: { 'kubb:build:end': onBuildEnd } })()

    await expect(createKubb(makeConfig({ ...config, input: undefined as unknown as string, plugins: [listener] }), { hooks }).setup()).rejects.toThrow()
    await hooks.callHook('kubb:build:end', {} as never)

    expect(onBuildEnd).not.toHaveBeenCalled()
  })

  it('runs each plugin listener once when setup is called before generate', async () => {
    const onPluginsEnd = vi.fn()
    const listener = defineExtension({ kind: 'plugin', meta: { name: 'plugin-listener' }, hooks: { 'kubb:plugins:end': onPluginsEnd } })()
    const kubb = createKubb(makeConfig({ ...config, plugins: [listener] }), { hooks: new Hookable<KubbHooks>() })

    await kubb.setup()
    await kubb.generate()

    expect(onPluginsEnd).toHaveBeenCalledTimes(1)
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

  describe('per-node options and transform reuse', () => {
    it('rejects a single-file override output under a group, like the plugin output', async () => {
      const plugin = defineExtension({
        kind: 'plugin',
        meta: { name: 'override-group-plugin' },
        hooks: {
          'kubb:plugin:setup'(ctx) {
            ctx.setOptions({
              output: { path: 'types' },
              group: { type: 'tag' },
              override: [{ type: 'schemaName', pattern: 'A', options: { output: { path: 'admin.ts' } } }],
            } as never)
          },
        },
      })()

      const { diagnostics } = await createKubb(makeConfig({ plugins: [plugin as unknown as Plugin] }), { hooks: new Hookable<KubbHooks>() }).safeBuild()

      expect(diagnostics.map((diagnostic) => diagnostic.code)).toContain(Diagnostics.code.invalidPluginOptions)
    })
  })
})

type ProjectBuild = {
  source?: string
  processOutput?: (context: { config: Config }) => Promise<Array<Diagnostic>>
  force?: boolean
}

describe('Kubb#generate', () => {
  const roots: Array<string> = []

  afterEach(() => {
    for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true })
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
    let summary: unknown
    hooks.hook('kubb:generation:summary', (ctx) => {
      // Emitted after `kubb:generation:end`.
      if (endStatus) summary = ctx
    })

    const result = await createKubb(makeConfig({ root: tempRoot(), storage: fsStorage() }), { hooks }).generate({
      processOutput: async () => [diagnostic],
    })

    expect(result.success).toBe(false)
    expect(result.diagnostics).toContain(diagnostic)
    expect(endStatus).toBe('failed')
    expect(summary).toStrictEqual({ duration: expect.any(Number), fileCount: 0, failedPlugins: 0, status: 'failed' })
  })

  it.each([['skips processOutput when the storage keeps the output in memory', memoryStorage, 0]])('%s', async (_name, storage, calls) => {
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
    expect(result.diagnostics).toMatchObject([
      { code: 'KUBB_OUTPUT_PASSES_SKIPPED', severity: 'warning', message: 'Skipped output.format because storage "memory" is not "fs".' },
    ])
  })

  it('does not warn about skipped output passes when the code is ignored', async () => {
    hooks = new Hookable<KubbHooks>()
    const config = makeConfig({
      root: tempRoot(),
      output: { path: './gen', format: 'prettier' },
      diagnostics: { ignore: ['KUBB_OUTPUT_PASSES_SKIPPED'] },
    })

    const result = await createKubb(config, { hooks }).generate()

    expect(result.diagnostics).toStrictEqual([])
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
   * A throwaway project with one generated file, so the lockfile tests can regenerate it with a
   * different source or a different output pass without repeating the setup.
   */
  const createProject = ({ format = 'oxfmt' as Config['output']['format'], postGenerate = [] as Array<string> } = {}) => {
    const root = tempRoot()
    // The installed package versions are part of what a build reads.
    fs.writeFileSync(path.join(root, 'package.json'), '{}')

    const filePath = path.join(root, 'gen', 'world.ts')
    const storage = fsStorage()

    const config = (source = `export const hello = 'world'`) => {
      const plugin = defineExtension({
        kind: 'plugin',
        meta: { name: 'plugin' },
        hooks: {
          'kubb:plugin:setup'(ctx) {
            ctx.injectFile(makeFile(filePath, source))
          },
        },
      })()

      // Without an adapter: the mocked one does not list the files it read, so its inputs are never recorded.
      return makeConfig({ root, output: { path: './gen', format, postGenerate }, storage, adapter: undefined, plugins: [plugin] })
    }
    const generate = ({ source, processOutput = async () => [], force }: ProjectBuild = {}) =>
      createKubb(config(source), { hooks: new Hookable<KubbHooks>() }).generate({ processOutput, force })

    return {
      filePath,
      storage,
      config,
      generate,
      read: () => fs.readFileSync(filePath, { encoding: 'utf-8' }),
      mtime: () => fs.statSync(filePath).mtimeMs,
      hasLockfile: () => fs.existsSync(path.join(root, 'kubb-lock.json')),
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

    // The lockfile itself still goes through the storage, so scope this to the generated file.
    expect(writeItem).not.toHaveBeenCalledWith(project.filePath, expect.anything())
    expect(project.mtime()).toBe(afterFirst)
    expect(project.read()).toBe(formatted)
  })

  it('turns the formatter and linter off for a rebuild that left every file as it was', async () => {
    const project = createProject()
    const formatted = 'export const hello = "world";\n'
    const formats: Array<Config['output']['format']> = []
    const processOutput: ProjectBuild['processOutput'] = async ({ config }) => {
      formats.push(config.output.format)
      fs.writeFileSync(project.filePath, formatted, { encoding: 'utf-8' })
      return []
    }

    await project.generate({ processOutput })
    await project.generate({ processOutput })
    await project.generate({ processOutput, force: true })
    await project.generate({ processOutput, source: `export const hello = 'there'` })

    expect(formats).toStrictEqual(['oxfmt', false, 'oxfmt', 'oxfmt'])
  })

  it.each<[string, (project: ReturnType<typeof createProject>) => void, Parameters<typeof createProject>[0], boolean]>([
    ['nothing changed', () => {}, { format: false }, true],
    ['a generated file was edited', (project) => fs.writeFileSync(project.filePath, 'export {}\n'), { format: false }, false],
    ['output.postGenerate is set', () => {}, { format: false, postGenerate: ['echo done'] }, false],
  ])('reports a generated project as up to date when %s: %s', async (_name, change, options, expected) => {
    const project = createProject(options)
    await project.generate()
    change(project)

    expect(await Kubb.isUpToDate(project.config())).toBe(expected)
  })

  it('records the inputs under the output path of a config without a name', async () => {
    const project = createProject({ format: false })
    await project.generate()

    expect(Object.keys(JSON.parse(fs.readFileSync(path.join(path.dirname(path.dirname(project.filePath)), 'kubb-lock.json'), 'utf8')).inputs)).toStrictEqual([
      'gen',
    ])
  })

  it('records no inputs for an adapter that does not list the files it read', async () => {
    const root = tempRoot()
    fs.writeFileSync(path.join(root, 'package.json'), '{}')
    const config = makeConfig({ root, input: './openapi.yaml', output: { path: './gen' }, storage: fsStorage(), adapter: createMockedAdapter(), plugins: [] })

    await createKubb(config, { hooks: new Hookable<KubbHooks>() }).generate()

    expect(JSON.parse(fs.readFileSync(path.join(root, 'kubb-lock.json'), 'utf8'))).toStrictEqual({ lockfileVersion: 1, files: {} })
    expect(await Kubb.isUpToDate(config)).toBe(false)
  })

  it('reports a project that was never generated as not up to date', async () => {
    expect(await Kubb.isUpToDate(createProject({ format: false }).config())).toBe(false)
  })

  it('rewrites the output when the generated source actually changed', async () => {
    const project = createProject()
    await project.generate()

    await project.generate({ source: `export const hello = 'moon'` })

    expect(project.read()).toBe(`export const hello = 'moon'\n`)
  })

  it('writes no lockfile when an output pass failed', async () => {
    const project = createProject()

    await project.generate({
      processOutput: async () => [{ code: Diagnostics.code.formatFailed, severity: 'error', message: 'formatter failed', location: { kind: 'config' } }],
    })

    expect(project.hasLockfile()).toBe(false)
  })

  it('writes the lockfile when nothing runs over the output', async () => {
    const project = createProject({ format: false })

    await project.generate()

    expect(project.hasLockfile()).toBe(true)
  })
})

describe('Kubb.generate', () => {
  it('builds again from the same instance after a build released its driver', async () => {
    const kubb = createKubb(makeConfig({ adapter: makeAdapter({ schemas: makeSchemas(2) }), plugins: [makeSchemaPlugin('types')] }))

    const first = await kubb.safeBuild()
    const second = await kubb.safeBuild()

    expect(second.files.map((file) => file.path)).toStrictEqual(first.files.map((file) => file.path))
    expect(second.files).toHaveLength(2)
  })

  it("yields a config's result before it builds the next config", async () => {
    const parse = vi.fn(async () => ast.factory.createInput())
    const later = makeConfig({ adapter: createMockedAdapter({ parse }) })

    const results = Kubb.generate([makeConfig(), later])
    await results.next()

    expect(parse).not.toHaveBeenCalled()
    await results.return()
  })

  it('generates the configs after one that fails, and marks only that one failed', async () => {
    const config = (parse?: () => Promise<never>) =>
      ({
        root: '/project',
        input: './spec.json',
        output: { path: './gen' },
        adapter: createMockedAdapter({ parse }),
        storage: memoryStorage(),
      }) satisfies UserConfig
    const broken = config(async () => {
      throw new Error('Cannot read the spec')
    })

    const results = await Array.fromAsync(Kubb.generate([broken, config()]))

    expect(results.map((result) => result.success)).toStrictEqual([false, true])
    expect(results.map((result) => result.kubb.config.adapter)).toStrictEqual([broken.adapter, expect.anything()])
  })
})
