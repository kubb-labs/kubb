import { ast, type FileNode, type OperationNode, type SchemaNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import { type Diagnostic, Diagnostics } from './Diagnostics.ts'
import { KubbDriver } from './KubbDriver.ts'
import type { Config, KubbHooks } from './types.ts'
import type { KubbPluginSetupContext, Plugin } from './definePlugin.ts'
import type { Generator, GeneratorContext } from './defineGenerator.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import { Hookable } from './Hookable.ts'
import { Resolver } from './Resolver.ts'

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

function makeDriver(config: Config, hooks = new Hookable<KubbHooks>()): KubbDriver {
  return new KubbDriver(config, { hooks })
}

describe('KubbDriver#setup', () => {
  test('enforce: pre plugins run before normal and post plugins', async () => {
    const prePlugin = { name: 'pre', enforce: 'pre' as const, hooks: {} }
    const normalPlugin = { name: 'normal', hooks: {} }
    const postPlugin = { name: 'post', enforce: 'post' as const, hooks: {} }

    // intentionally declared in reverse order to verify sorting
    const driver = makeDriver(makeConfig({ plugins: [postPlugin, normalPlugin, prePlugin] }))
    await driver.setup()
    const names = [...driver.plugins.keys()]

    expect(names.indexOf('pre')).toBeLessThan(names.indexOf('normal'))
    expect(names.indexOf('normal')).toBeLessThan(names.indexOf('post'))
  })

  test('orders a transitive dependency chain so dependencies always run first', async () => {
    const pluginTop = { name: 'top', dependencies: ['middle'], hooks: {} }
    const pluginMiddle = { name: 'middle', dependencies: ['base'], hooks: {} }
    const pluginBase = { name: 'base', hooks: {} }

    // declared dependents-first so declaration order alone cannot produce the result
    const driver = makeDriver(makeConfig({ plugins: [pluginTop, pluginMiddle, pluginBase] }))
    await driver.setup()

    expect([...driver.plugins.keys()]).toStrictEqual(['base', 'middle', 'top'])
  })

  test('setup rejects with a config diagnostic when plugin dependencies form a cycle', async () => {
    const first = { name: 'first', dependencies: ['second'], hooks: {} }
    const second = { name: 'second', dependencies: ['first'], hooks: {} }

    const driver = makeDriver(makeConfig({ plugins: [first, second] }))

    await expect(driver.setup()).rejects.toThrow('Plugin dependencies form a cycle')
  })

  test.each([
    ['an uncalled factory', [function pluginTs() {}], 'plugins[0] is a function ("pluginTs"), not a plugin.', 'Call it: pluginTs()'],
    ['a null entry', [null], 'plugins[0] is null, not a plugin.', undefined],
    [
      'a duplicate name',
      [
        { name: 'dup', hooks: {} },
        { name: 'dup', hooks: {} },
      ],
      'Plugin "dup" appears twice in `plugins`.',
      'Remove the duplicate, or merge its options.',
    ],
  ])('setup rejects %s with KUBB_INVALID_PLUGIN_OPTIONS', async (_label, plugins, message, help) => {
    const driver = makeDriver(makeConfig({ plugins: plugins as unknown as Array<Plugin> }))

    const error = await driver.setup().catch((caught: unknown) => caught)

    expect(Diagnostics.from(error)).toMatchObject({
      code: Diagnostics.code.invalidPluginOptions,
      message,
      location: { kind: 'config' },
      ...(help ? { help } : {}),
    })
  })

  test('plugin and post-plugin listeners fire in order, and dispose drops both for the next build', async () => {
    const calls: Array<string> = []
    const pluginHook = vi.fn(() => void calls.push('plugin'))
    const postPluginHook = vi.fn(() => void calls.push('post-plugin'))

    const plugin = { name: 'order-plugin', hooks: { 'kubb:plugin:start': pluginHook } } as unknown as Plugin
    const postPlugin = { name: 'order-post-plugin', enforce: 'post' as const, hooks: { 'kubb:plugin:start': postPluginHook } } as unknown as Plugin

    const hooks = new Hookable<KubbHooks>()
    const driver = makeDriver(makeConfig({ plugins: [plugin, postPlugin] }), hooks)
    await driver.setup()
    await hooks.callHook('kubb:plugin:start', { plugin: plugin as never })

    expect(calls).toStrictEqual(['plugin', 'post-plugin'])
    expect(hooks.listenerCount('kubb:plugin:start')).toBe(2)

    driver.dispose()

    expect(hooks.listenerCount('kubb:plugin:start')).toBe(0)

    await hooks.callHook('kubb:plugin:start', { plugin: plugin as never })

    expect(pluginHook).toHaveBeenCalledTimes(1)
    expect(postPluginHook).toHaveBeenCalledTimes(1)
  })
})

describe('GeneratorContext diagnostics', () => {
  let driver: KubbDriver

  beforeEach(async () => {
    driver = makeDriver(makeConfig({ plugins: [{ name: 'pluginA', hooks: {} }] }))
    await driver.setup()
  })

  afterEach(() => {
    driver.hooks.removeAllHooks()
  })

  function context() {
    return driver.getContext(driver.plugins.get('pluginA')!)
  }

  function collect(fn: (ctx: ReturnType<typeof context>) => void): Array<Diagnostic> {
    const diagnostics: Array<Diagnostic> = []
    Diagnostics.scope(
      (diagnostic) => diagnostics.push(diagnostic),
      () => fn(context()),
    )
    return diagnostics
  }

  // Only an error fails the build; every level is attributed to the plugin.
  it.each<['error' | 'warn' | 'info', string, string, boolean]>([
    ['error', Diagnostics.code.pluginFailed, 'error', true],
    ['warn', Diagnostics.code.pluginWarning, 'warning', false],
    ['info', Diagnostics.code.pluginInfo, 'info', false],
  ])('reports ctx.%s as a %s diagnostic attributed to the plugin', (method, code, severity, failsBuild) => {
    const diagnostics = collect((ctx) => ctx[method]('boom'))

    expect(diagnostics).toMatchObject([{ code, severity, message: 'boom', plugin: 'pluginA' }])
    expect(Diagnostics.hasError(diagnostics)).toBe(failsBuild)
  })

  it('keeps the original Error as the cause when ctx.error is passed an Error', () => {
    const cause = new Error('underlying')
    const diagnostics = collect((ctx) => ctx.error(cause))

    const [diagnostic] = diagnostics
    expect(diagnostic && Diagnostics.isProblem(diagnostic) ? diagnostic.cause : undefined).toBe(cause)
  })

  it('collects the diagnostic only and does not emit a live hook', () => {
    const onError = vi.fn()
    driver.hooks.hook('kubb:error', onError)

    collect((ctx) => ctx.error('boom'))

    expect(onError).not.toHaveBeenCalled()
  })

  it('keeps the code, help, and location of a Diagnostics.Error passed to ctx.error', () => {
    const error = new Diagnostics.Error({
      code: Diagnostics.code.refNotFound,
      severity: 'error',
      message: 'Could not find #/components/schemas/Pet',
      help: 'Add the schema.',
      location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
    })

    expect(collect((ctx) => ctx.error(error))).toMatchObject([
      { code: Diagnostics.code.refNotFound, help: 'Add the schema.', location: { pointer: '#/components/schemas/Pet' }, plugin: 'pluginA' },
    ])
  })

  it('lets a Diagnostics.Error passed to ctx.error keep its own code over the options', () => {
    const error = new Diagnostics.Error({ code: Diagnostics.code.refNotFound, severity: 'error', message: 'missing', help: 'own help' })

    expect(collect((ctx) => ctx.error(error, { code: Diagnostics.code.pluginFailed, help: 'other', location: { kind: 'config' } }))).toMatchObject([
      { code: Diagnostics.code.refNotFound, help: 'own help', location: { kind: 'config' } },
    ])
  })

  it('applies the help and location options to ctx.warn', () => {
    const location = { kind: 'schema', pointer: '#/components/schemas/Status' } as const

    expect(collect((ctx) => ctx.warn('Enum has no values', { help: 'Add values.', location }))).toMatchObject([
      { code: Diagnostics.code.pluginWarning, severity: 'warning', message: 'Enum has no values', help: 'Add values.', location },
    ])
  })

  it.each([
    ['ctx.requirePlugin', () => context().requirePlugin('missing'), /Plugin "missing" is required by "pluginA" but not found/],
    ['driver.requirePlugin', () => driver.requirePlugin('missing'), /Plugin "missing" is required but not found/],
  ])('throws with the caller in the message when %s misses', (_name, requirePlugin, message) => {
    expect(requirePlugin).toThrowError(message)
  })
})

function fileNode(path: string): FileNode {
  return ast.factory.createFile({ baseName: path.split('/').at(-1) as `${string}.${string}`, path })
}

function inputAdapter() {
  const schemas: Array<SchemaNode> = [
    ast.factory.createSchema({ type: 'object', name: 'Pet', properties: [], pointer: '#/components/schemas/Pet' }),
    ast.factory.createSchema({ type: 'object', name: 'Store', properties: [], pointer: '#/components/schemas/Store' }),
  ]
  const operations: Array<OperationNode> = [
    ast.factory.createOperation({ operationId: 'getPet', method: 'GET', path: '/pet', pointer: '#/paths/~1pet/get' }),
    ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets', pointer: '#/paths/~1pets/get' }),
  ]
  return createMockedAdapter({ parse: async () => ast.factory.createInput({ schemas, operations }) })
}

test.each([true, false])('reserves component names only for schema-generating plugins (%s)', async (generatesSchemas) => {
  const names: Array<string> = []
  const base = new Resolver({ pluginName: 'names', name: (name) => `Api${name}` })
  const plugin: Plugin = {
    name: 'names',
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setResolver(base)
        ctx.addGenerator({
          name: 'names',
          ...(generatesSchemas
            ? {
                schema(_node: SchemaNode, { resolver }: GeneratorContext) {
                  names.push(resolver.resolveName({ key: 'inline', name: 'ApiStore' }))
                },
              }
            : {}),
          operation(_node, { resolver }) {
            names.push(resolver.resolveName({ key: 'inline', name: 'ApiStore' }))
          },
        })
      },
    },
  }

  for (let run = 0; run < 2; run++) {
    const driver = makeDriver(makeConfig({ adapter: inputAdapter(), plugins: [plugin] }))
    try {
      await driver.setup()
      const { diagnostics } = await driver.run()
      expect(diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toEqual([])
    } finally {
      driver.dispose()
    }
  }
  expect(names).toEqual(Array.from({ length: generatesSchemas ? 8 : 4 }, () => (generatesSchemas ? 'ApiStore2' : 'ApiStore')))
})

type Recorder = {
  schema: Array<{ plugin: string; name: string | null | undefined }>
  operation: Array<{ plugin: string; id: string }>
  operations: Array<{ plugin: string; ids: Array<string> }>
  pairs: Array<{ generator: string; ctx: string }>
}

test.each([
  { label: 'renamed', rename: 'StoreRenamed', options: {}, preferred: 'ApiStoreRenamed', expected: 'ApiStoreRenamed2', schemas: ['ApiPet', 'ApiStoreRenamed'] },
  {
    label: 'excluded',
    rename: null,
    options: { exclude: [{ type: 'schemaName' as const, pattern: '^Store$' }] },
    preferred: 'ApiStore',
    expected: 'ApiStore',
    schemas: ['ApiPet'],
  },
  {
    label: 'not included',
    rename: null,
    options: { include: [{ type: 'schemaName' as const, pattern: '^Pet$' }] },
    preferred: 'ApiStore',
    expected: 'ApiStore',
    schemas: ['ApiPet'],
  },
  {
    label: 'unreachable from included operations',
    rename: null,
    options: { include: [{ type: 'operationId' as const, pattern: '^getPet$' }] },
    preferred: 'ApiStore',
    expected: 'ApiStore',
    schemas: [],
  },
])('reserves prepared schema names when a component is $label', async ({ rename, options, preferred, expected, schemas }) => {
  const emittedSchemas: Array<string> = []
  const inlineNames: Array<string> = []
  const schemaMacro = vi.fn((node: SchemaNode) => (node.name === 'Store' && rename ? { ...node, name: rename } : undefined))
  const plugin: Plugin = {
    name: 'names',
    options,
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setResolver(new Resolver({ pluginName: 'names', name: (name) => `Api${name}` }))
        ctx.addMacro({ name: 'rename', schema: schemaMacro })
        ctx.addGenerator({
          name: 'names',
          schema(node, { resolver }) {
            inlineNames.push(resolver.resolveName({ key: 'inline', name: preferred }))
            emittedSchemas.push(resolver.name(node.name!))
          },
          operation(_node, { resolver }) {
            inlineNames.push(resolver.resolveName({ key: 'inline', name: preferred }))
          },
        })
      },
    },
  }
  const driver = makeDriver(makeConfig({ adapter: inputAdapter(), plugins: [plugin] }))
  try {
    await driver.setup()
    const { diagnostics } = await driver.run()
    expect(diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toEqual([])
    expect(emittedSchemas).toEqual(schemas)
    expect(new Set(inlineNames)).toEqual(new Set([expected]))
    expect(schemaMacro.mock.calls.map(([node]) => node.name)).toEqual(['Pet', 'Store'])
  } finally {
    driver.dispose()
  }
})

test('preserves earlier schema output when preparation of a later schema fails', async () => {
  const plugin: Plugin = {
    name: 'names',
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.addMacro({
          name: 'fail-store',
          schema(node) {
            if (node.name === 'Store') throw new Error('Cannot prepare Store')
          },
        })
        ctx.addGenerator({ name: 'schemas', schema: (node) => [fileNode(`${node.name}.ts`)] })
      },
    },
  }
  const driver = makeDriver(makeConfig({ adapter: inputAdapter(), plugins: [plugin] }))
  try {
    await driver.setup()
    const { diagnostics } = await driver.run()
    expect(driver.fileManager.files.map((file) => file.baseName)).toEqual(['Pet.ts'])
    expect(diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toMatchObject([
      { message: 'While generating schema "Store": Cannot prepare Store' },
    ])
  } finally {
    driver.dispose()
  }
})

// A generator that records every call and emits one file per node, prefixed by plugin name so the
// produced file set proves which plugin's generator ran for which node.
function recordingGenerator(pluginName: string, rec: Recorder): Generator {
  return {
    name: `${pluginName}-gen`,
    schema(node: SchemaNode, ctx: GeneratorContext) {
      rec.schema.push({ plugin: ctx.plugin.name, name: node.name })
      rec.pairs.push({ generator: pluginName, ctx: ctx.plugin.name })
      return [fileNode(`${pluginName}/schema-${node.name}.ts`)]
    },
    operation(node: OperationNode, ctx: GeneratorContext) {
      rec.operation.push({ plugin: ctx.plugin.name, id: node.operationId })
      rec.pairs.push({ generator: pluginName, ctx: ctx.plugin.name })
      return [fileNode(`${pluginName}/op-${node.operationId}.ts`)]
    },
    operations(nodes: Array<OperationNode>, ctx: GeneratorContext) {
      rec.operations.push({ plugin: ctx.plugin.name, ids: nodes.map((node) => node.operationId) })
      rec.pairs.push({ generator: pluginName, ctx: ctx.plugin.name })
      return [fileNode(`${pluginName}/operations.ts`)]
    },
  }
}

function makePlugin(name: string, rec: Recorder): Plugin {
  return {
    name,
    hooks: {
      'kubb:plugin:setup'(ctx: KubbPluginSetupContext) {
        ctx.addGenerator(recordingGenerator(name, rec))
      },
    },
  }
}

describe('KubbDriver generator dispatch', () => {
  let rec: Recorder
  let driver: KubbDriver
  let hooks: Hookable<KubbHooks>

  const build = async () => {
    rec = { schema: [], operation: [], operations: [], pairs: [] }
    hooks = new Hookable<KubbHooks>()
    driver = makeDriver(makeConfig({ adapter: inputAdapter(), plugins: [makePlugin('pluginA', rec), makePlugin('pluginB', rec)] }), hooks)
    await driver.setup()
  }

  beforeEach(build)
  afterEach(() => hooks.removeAllHooks())

  it('walks each node once, fans it out to every plugin in order, and collects one file per generator return', async () => {
    await driver.run()

    // Node-outer: each schema is visited once, both plugins run before the next schema.
    expect(rec.schema).toStrictEqual([
      { plugin: 'pluginA', name: 'Pet' },
      { plugin: 'pluginB', name: 'Pet' },
      { plugin: 'pluginA', name: 'Store' },
      { plugin: 'pluginB', name: 'Store' },
    ])
    expect(rec.operation).toStrictEqual([
      { plugin: 'pluginA', id: 'getPet' },
      { plugin: 'pluginB', id: 'getPet' },
      { plugin: 'pluginA', id: 'listPets' },
      { plugin: 'pluginB', id: 'listPets' },
    ])
    // The batch still fires once per plugin, in plugin order, after the operation walk.
    expect(rec.operations).toStrictEqual([
      { plugin: 'pluginA', ids: ['getPet', 'listPets'] },
      { plugin: 'pluginB', ids: ['getPet', 'listPets'] },
    ])
    expect(rec.pairs).toStrictEqual([
      { generator: 'pluginA', ctx: 'pluginA' },
      { generator: 'pluginB', ctx: 'pluginB' },
      { generator: 'pluginA', ctx: 'pluginA' },
      { generator: 'pluginB', ctx: 'pluginB' },
      { generator: 'pluginA', ctx: 'pluginA' },
      { generator: 'pluginB', ctx: 'pluginB' },
      { generator: 'pluginA', ctx: 'pluginA' },
      { generator: 'pluginB', ctx: 'pluginB' },
      { generator: 'pluginA', ctx: 'pluginA' },
      { generator: 'pluginB', ctx: 'pluginB' },
    ])
    expect(driver.fileManager.files.map((file) => file.path).sort()).toStrictEqual([
      'pluginA/op-getPet.ts',
      'pluginA/op-listPets.ts',
      'pluginA/operations.ts',
      'pluginA/schema-Pet.ts',
      'pluginA/schema-Store.ts',
      'pluginB/op-getPet.ts',
      'pluginB/op-listPets.ts',
      'pluginB/operations.ts',
      'pluginB/schema-Pet.ts',
      'pluginB/schema-Store.ts',
    ])
  })

  it('emits the public generate hooks to external listeners, once per plugin-node pair', async () => {
    const onSchema = vi.fn()
    const onOperation = vi.fn()
    const onOperations = vi.fn()
    hooks.hook('kubb:generate:schema', onSchema)
    hooks.hook('kubb:generate:operation', onOperation)
    hooks.hook('kubb:generate:operations', onOperations)

    await driver.run()

    expect(onSchema).toHaveBeenCalledTimes(4)
    expect(onOperation).toHaveBeenCalledTimes(4)
    expect(onOperations).toHaveBeenCalledTimes(2)
  })

  it('runs added macros in order, isolated per plugin, before the generators see a node', async () => {
    rec = { schema: [], operation: [], operations: [], pairs: [] }
    const rename = (suffix: string) => ({ name: suffix, schema: (node: SchemaNode) => ({ ...node, name: `${node.name}${suffix}` }) })
    const macroPlugin = (name: string, macros: Array<ReturnType<typeof rename>>): Plugin => ({
      name,
      hooks: {
        'kubb:plugin:setup'(ctx: KubbPluginSetupContext) {
          for (const macro of macros) ctx.addMacro(macro)
          ctx.addGenerator(recordingGenerator(name, rec))
        },
      },
    })
    driver = makeDriver(
      makeConfig({ adapter: inputAdapter(), plugins: [macroPlugin('pluginA', [rename('-1'), rename('-2')]), macroPlugin('pluginB', [])] }),
      hooks,
    )
    await driver.setup()

    await driver.run()

    expect(rec.schema.filter((entry) => entry.name?.startsWith('Pet'))).toStrictEqual([
      { plugin: 'pluginA', name: 'Pet-1-2' },
      { plugin: 'pluginB', name: 'Pet' },
    ])
  })

  it('stops a throwing plugin without aborting the rest', async () => {
    rec = { schema: [], operation: [], operations: [], pairs: [] }
    const boomPlugin: Plugin = {
      name: 'boom',
      meta: { name: 'boom', issues: 'https://github.com/example/boom/issues' },
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({
            name: 'boom-gen',
            schema() {
              throw new Error('boom in schema')
            },
          })
        },
      },
    }
    const boomDriver = makeDriver(makeConfig({ adapter: inputAdapter(), plugins: [boomPlugin, makePlugin('after', rec)] }))
    await boomDriver.setup()

    const { diagnostics } = await boomDriver.run()

    // The plugin after the failing one still runs every node.
    expect(rec.schema.map((entry) => entry.name)).toStrictEqual(['Pet', 'Store'])
    expect(diagnostics.find((diagnostic) => 'plugin' in diagnostic && diagnostic.plugin === 'boom' && diagnostic.severity === 'error')).toMatchObject({
      code: 'KUBB_PLUGIN_FAILED',
      message: 'While generating schema "Pet": boom in schema',
      location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
      issues: 'https://github.com/example/boom/issues',
    })
  })

  it('names the operation a generator crashed on, with the pointer the adapter set', async () => {
    const boomPlugin: Plugin = {
      name: 'boom',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({
            name: 'boom-gen',
            operation(node) {
              if (node.operationId === 'listPets') throw new TypeError('x is undefined')
              return []
            },
          })
        },
      },
    }
    const boomDriver = makeDriver(makeConfig({ adapter: inputAdapter(), plugins: [boomPlugin] }))
    await boomDriver.setup()

    const { diagnostics } = await boomDriver.run()

    expect(diagnostics.find((diagnostic) => diagnostic.severity === 'error')).toMatchObject({
      code: 'KUBB_PLUGIN_FAILED',
      message: 'While generating operation "listPets" (GET /pets): x is undefined',
      location: { kind: 'operation', pointer: '#/paths/~1pets/get' },
    })
  })

  it('shares one cache per node across plugins and gives each node a fresh one', async () => {
    const seen: Array<{ plugin: string; node: string; token: number }> = []
    let counter = 0
    const cachePlugin = (name: string): Plugin => ({
      name,
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({
            name: `${name}-cache`,
            schema(node: SchemaNode, gctx: GeneratorContext) {
              // The first plugin to reach a node fills the token, and the rest read the same value.
              const token = gctx.cache.ensureItem('token', () => ++counter)
              seen.push({ plugin: gctx.plugin.name, node: node.name!, token })
              return null
            },
          })
        },
      },
    })

    const cacheDriver = makeDriver(makeConfig({ adapter: inputAdapter(), plugins: [cachePlugin('one'), cachePlugin('two')] }))
    await cacheDriver.setup()
    await cacheDriver.run()

    expect(seen).toStrictEqual([
      { plugin: 'one', node: 'Pet', token: 1 },
      { plugin: 'two', node: 'Pet', token: 1 },
      { plugin: 'one', node: 'Store', token: 2 },
      { plugin: 'two', node: 'Store', token: 2 },
    ])
  })

  it('normalizes plugin options after setup even when setOptions is never called', async () => {
    const plugin = {
      name: 'opts-plugin',
      options: { output: { path: 'types' }, enumType: 'asConst' },
      hooks: {},
    } as unknown as Plugin
    const optsDriver = makeDriver(makeConfig({ adapter: inputAdapter(), plugins: [plugin] }))
    await optsDriver.setup()
    await optsDriver.run()

    const normalized = optsDriver.plugins.get('opts-plugin')!.options
    expect(normalized.output).toStrictEqual({ path: 'types', mode: 'directory' })
    expect(normalized.exclude).toStrictEqual([])
    expect(normalized.override).toStrictEqual([])
    expect((normalized as Record<string, unknown>).enumType).toBe('asConst')
  })

  it("skips a generator's schema and operation calls for a node its match predicate resolves false for, and still calls them when true", async () => {
    rec = { schema: [], operation: [], operations: [], pairs: [] }
    const petOnly: Generator = {
      ...recordingGenerator('petOnly', rec),
      match: (node) => ('operationId' in node ? node.operationId === 'getPet' : node.name === 'Pet'),
    }
    const plugin: Plugin = {
      name: 'petOnlyPlugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator(petOnly)
        },
      },
    }
    const matchDriver = makeDriver(makeConfig({ adapter: inputAdapter(), plugins: [plugin] }))
    await matchDriver.setup()
    await matchDriver.run()

    expect(rec.schema).toStrictEqual([{ plugin: 'petOnlyPlugin', name: 'Pet' }])
    expect(rec.operation).toStrictEqual([{ plugin: 'petOnlyPlugin', id: 'getPet' }])
  })

  it('filters per generator, not per plugin, when a matched and an unmatched generator share a plugin', async () => {
    rec = { schema: [], operation: [], operations: [], pairs: [] }
    // Operation-only generators (no `schema`/`operations`) so the emitted file set below only
    // reflects the operation loop's match filtering, with no schema/batch noise to account for.
    const matched: Generator = {
      name: 'matched-gen',
      match: (node) => ('operationId' in node ? node.operationId === 'getPet' : true),
      operation(node: OperationNode, ctx: GeneratorContext) {
        rec.operation.push({ plugin: ctx.plugin.name, id: node.operationId })
        return [fileNode(`matched/op-${node.operationId}.ts`)]
      },
    }
    const unmatched: Generator = {
      name: 'unmatched-gen',
      operation(node: OperationNode, ctx: GeneratorContext) {
        rec.operation.push({ plugin: ctx.plugin.name, id: node.operationId })
        return [fileNode(`unmatched/op-${node.operationId}.ts`)]
      },
    }
    const plugin: Plugin = {
      name: 'mixedPlugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator(matched, unmatched)
        },
      },
    }
    const mixedDriver = makeDriver(makeConfig({ adapter: inputAdapter(), plugins: [plugin] }))
    await mixedDriver.setup()
    await mixedDriver.run()

    expect(mixedDriver.fileManager.files.map((file) => file.path).sort()).toStrictEqual([
      'matched/op-getPet.ts',
      'unmatched/op-getPet.ts',
      'unmatched/op-listPets.ts',
    ])
  })
})
