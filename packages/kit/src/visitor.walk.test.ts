import { ast, type FileNode, type OperationNode, type SchemaNode } from '@kubb/ast'
import { type Config, Hookable, KubbDriver, type KubbHooks, memoryStorage, type Plugin, type PluginVisitContext, useKubb } from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import { addGenerator, addMacro, getResolver, setResolver } from './composables.ts'
import { defineExtension } from './defineExtension.ts'
import { defineResolver, Resolver } from './resolver/Resolver.ts'
import type { Generator, GeneratorContext } from './types.ts'

// Runs each plain test plugin through kit's `defineExtension`, so it gets kit's visitor.
function kit(plugin: Plugin): Plugin {
  const meta = plugin.meta ?? { name: plugin.name! }
  return defineExtension({ kind: 'plugin', meta, hooks: plugin.hooks })(plugin.options as object)
}

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    root: '.',
    input: './petStore.yaml',
    output: { path: './gen' },
    parsers: [],
    reporters: [],
    adapter: createMockedAdapter(),
    storage: memoryStorage(),
    ...overrides,
    plugins: (overrides.plugins ?? []).map(kit),
  }
}

function makeDriver(config: Config, hooks = new Hookable<KubbHooks>()): KubbDriver {
  return new KubbDriver(config, { hooks })
}

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

test.each([false, true])('reserves component names only for schema-generating plugins (%s)', async (generatesSchemas) => {
  const names: Array<string> = []
  const base = new Resolver({ pluginName: 'names', name: (name) => `Api${name}` })
  const plugin: Plugin = {
    name: 'names',
    hooks: {
      'kubb:plugin:setup'() {
        setResolver(base)
        addGenerator({
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
      'kubb:plugin:setup'() {
        setResolver(new Resolver({ pluginName: 'names', name: (name) => `Api${name}` }))
        addMacro({ name: 'rename', schema: schemaMacro })
        addGenerator({
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
      'kubb:plugin:setup'() {
        addMacro({
          name: 'fail-store',
          schema(node) {
            if (node.name === 'Store') throw new Error('Cannot prepare Store')
          },
        })
        addGenerator({ name: 'schemas', schema: (node) => [fileNode(`${node.name}.ts`)] })
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
      'kubb:plugin:setup'() {
        addGenerator(recordingGenerator(name, rec))
      },
    },
  }
}

test('runs every visit hook of a kit plugin with this === ctx === useKubb()', async () => {
  const seen: Array<string> = []
  const check = (hook: string, self: unknown, ctx: PluginVisitContext) => {
    if (self === ctx && ctx === useKubb<PluginVisitContext>()) seen.push(hook)
  }
  const plugin: Plugin = {
    name: 'a',
    hooks: {
      'kubb:plugin:visit:start'(ctx) {
        check('start', this, ctx)
      },
      'kubb:plugin:visit:schema'(_node, ctx) {
        check('schema', this, ctx)
      },
      'kubb:plugin:visit:operation'(_node, ctx) {
        check('operation', this, ctx)
      },
      'kubb:plugin:visit:end'(ctx) {
        check('end', this, ctx)
      },
    },
  }
  const driver = makeDriver(makeConfig({ adapter: inputAdapter(), plugins: [plugin] }))
  await driver.setup()

  const { diagnostics } = await driver.run()

  expect(diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toStrictEqual([])
  expect(seen).toStrictEqual(['start', 'schema', 'schema', 'operation', 'operation', 'end'])
})

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
        'kubb:plugin:setup'() {
          for (const macro of macros) addMacro(macro)
          addGenerator(recordingGenerator(name, rec))
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
        'kubb:plugin:setup'() {
          addGenerator({
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
        'kubb:plugin:setup'() {
          addGenerator({
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

  it('shares ctx.memo across plugins, so a node-named key is computed once per node', async () => {
    const seen: Array<{ plugin: string; node: string; token: number }> = []
    let counter = 0
    const cachePlugin = (name: string): Plugin => ({
      name,
      hooks: {
        'kubb:plugin:setup'() {
          addGenerator({
            name: `${name}-cache`,
            schema(node: SchemaNode, gctx: GeneratorContext) {
              // The first plugin to reach a node fills the token, and the rest read the same value.
              const token = gctx.memo(`token:${node.name}`, () => ++counter)
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

  it('places a shared schema under shared.path through every plugin resolver, a custom one included', async () => {
    const plugins = [
      { name: 'types', options: { output: { path: 'types' } }, hooks: {} },
      {
        name: 'zod',
        options: { output: { path: 'zod' } },
        hooks: {
          'kubb:plugin:setup'() {
            setResolver({ name: (name: string) => `${name}Schema` })
          },
        },
      },
    ] as unknown as Array<Plugin>
    const sharedDriver = new KubbDriver(
      makeConfig({ root: '/project', adapter: inputAdapter(), plugins, output: { path: './gen/animals' }, shared: { path: './gen/common' } }),
      { hooks: new Hookable<KubbHooks>(), sharedSchemas: { names: ['Pet'], clean: false, written: new Map() } },
    )
    await sharedDriver.setup()
    await sharedDriver.run()

    const file = (pluginName: string, name: string) =>
      getResolver(pluginName, sharedDriver.memo).file({
        name,
        extname: '.ts',
        root: '/project/gen/animals',
        output: sharedDriver.plugins.get(pluginName)!.options.output,
      }).path
    expect(file('types', 'Pet')).toBe('/project/gen/common/types/pet.ts')
    expect(file('zod', 'Pet')).toBe('/project/gen/common/zod/pet.ts')
    expect(file('types', 'Store')).toBe('/project/gen/animals/types/store.ts')
  })

  it('merges a setResolver array left to right, so a later part wins per method and keeps the other methods', async () => {
    const plugin = {
      name: 'parts',
      options: {},
      hooks: {
        'kubb:plugin:setup'() {
          setResolver([
            defineResolver({ name: (name: string) => `${name}Schema`, extra: { a: () => 'a', b: () => 'b' } }),
            defineResolver({ extra: { b: () => 'B' } }),
          ])
        },
      },
    } as unknown as Plugin
    const partsDriver = makeDriver(makeConfig({ adapter: inputAdapter(), plugins: [plugin] }))
    await partsDriver.setup()
    await partsDriver.setupHooks()

    const resolver = getResolver('parts', partsDriver.memo) as unknown as Resolver & { extra: { a(): string; b(): string } }
    expect(resolver.name('pet')).toBe('petSchema')
    expect([resolver.extra.a(), resolver.extra.b()]).toStrictEqual(['a', 'B'])
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
        'kubb:plugin:setup'() {
          addGenerator(petOnly)
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
        'kubb:plugin:setup'() {
          addGenerator(matched, unmatched)
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

test('keeps one resolver for the walk when a visit hook replaces it in memo', async () => {
  const seen: Array<Resolver> = []
  const plugin: Plugin = {
    name: 'swap',
    hooks: {
      'kubb:plugin:setup'() {
        addGenerator({
          name: 'swap-gen',
          schema(_node: SchemaNode, ctx: GeneratorContext) {
            seen.push(ctx.resolver)
            return []
          },
        })
      },
      'kubb:plugin:visit:start'(ctx) {
        ctx.memo.set('swap:resolver', new Resolver({ pluginName: 'swap' }))
      },
    },
  }
  const driver = makeDriver(makeConfig({ adapter: inputAdapter(), plugins: [plugin] }))
  await driver.setup()

  await driver.run()

  expect(seen).toHaveLength(2)
  expect(new Set(seen).size).toBe(1)
  expect(seen[0]).not.toBe(getResolver('swap', driver.memo))
})
