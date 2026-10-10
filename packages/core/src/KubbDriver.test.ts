import { ast, type FileNode, type OperationNode, type SchemaNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import { type Diagnostic, Diagnostics } from './Diagnostics.ts'
import { KubbDriver } from './KubbDriver.ts'
import type { Config, GeneratorContext, KubbHooks, KubbPluginSetupContext, Plugin } from './types.ts'
import type { Generator } from './defineGenerator.ts'
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

function makeDriver(config: Config, hooks = new Hookable<KubbHooks>()): KubbDriver {
  return new KubbDriver(config, { hooks })
}

describe('KubbDriver#setup', () => {
  const pluginA = { name: 'pluginA', hooks: {} }
  const pluginB = { name: 'pluginB', hooks: {} }
  const pluginC = { name: 'pluginC', hooks: {} }
  const config = makeConfig({ plugins: [pluginA, pluginB, pluginC] })

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

  test('listeners attached directly to hooks survive dispose', async () => {
    const external = vi.fn()
    const hooks = new Hookable<KubbHooks>()
    const driver = makeDriver(config, hooks)
    await driver.setup()

    hooks.hook('kubb:build:end', external)
    driver.dispose()
    await hooks.callHook('kubb:build:end', {
      files: [],
      config,
      outputDir: '/tmp',
    })

    expect(external).toHaveBeenCalledTimes(1)
  })
})

function file(name: string): FileNode {
  return ast.factory.createFile({ baseName: `${name}.ts`, path: `${name}.ts` })
}

describe('KubbDriver#dispatch', () => {
  it('upserts every file when the result is an Array<FileNode>', () => {
    const driver = makeDriver(makeConfig())
    const files = [file('a'), file('b')]

    driver.dispatch({ result: files })

    expect(driver.fileManager.files.map((f) => f.name)).toStrictEqual(['a', 'b'])
  })

  it('ignores non-array results when no renderer is provided', () => {
    const driver = makeDriver(makeConfig())
    const upsert = vi.spyOn(driver.fileManager, 'upsert')

    driver.dispatch({ result: { kind: 'element' } })

    expect(upsert).not.toHaveBeenCalled()
  })

  it('routes element results through the renderer, upserting its files', async () => {
    const driver = makeDriver(makeConfig())
    const renderer = {
      render: vi.fn(async () => {}),
      files: [file('async-1')],
      [Symbol.dispose]: () => {},
    }
    const factory = vi.fn(() => renderer)

    await driver.dispatch({ result: { kind: 'element' }, renderer: factory as never })

    expect(renderer.render).toHaveBeenCalledOnce()
    expect(driver.fileManager.files.map((f) => f.name)).toStrictEqual(['async-1'])
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

  it.each([
    ['ctx.requirePlugin', () => context().requirePlugin('missing'), /Plugin "missing" is required by "pluginA" but not found/],
    ['driver.requirePlugin', () => driver.requirePlugin('missing'), /Plugin "missing" is required but not found/],
  ])('throws with the caller in the message when %s misses', (_name, requirePlugin, message) => {
    expect(requirePlugin).toThrowError(message)
  })

  it('returns the plugin from ctx.requirePlugin when it exists', () => {
    expect(context().requirePlugin('pluginA').name).toBe('pluginA')
  })
})

function fileNode(path: string): FileNode {
  return ast.factory.createFile({ baseName: path.split('/').at(-1) as `${string}.${string}`, path })
}

function inputAdapter() {
  const schemas: Array<SchemaNode> = [
    ast.factory.createSchema({ type: 'object', name: 'Pet', properties: [] }),
    ast.factory.createSchema({ type: 'object', name: 'Store', properties: [] }),
  ]
  const operations: Array<OperationNode> = [
    ast.factory.createOperation({ operationId: 'getPet', method: 'GET', path: '/pet' }),
    ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' }),
  ]
  return createMockedAdapter({ parse: async () => ast.factory.createInput({ schemas, operations }) })
}

type Recorder = {
  schema: Array<{ plugin: string; name: string | null | undefined }>
  operation: Array<{ plugin: string; id: string }>
  operations: Array<{ plugin: string; count: number }>
}

// A generator that records every call and emits one file per node, prefixed by plugin name so the
// produced file set proves which plugin's generator ran for which node.
function recordingGenerator(pluginName: string, rec: Recorder): Generator {
  return {
    name: `${pluginName}-gen`,
    schema(node: SchemaNode, ctx: GeneratorContext) {
      rec.schema.push({ plugin: ctx.plugin.name, name: node.name })
      return [fileNode(`${pluginName}/schema-${node.name}.ts`)]
    },
    operation(node: OperationNode, ctx: GeneratorContext) {
      rec.operation.push({ plugin: ctx.plugin.name, id: node.operationId })
      return [fileNode(`${pluginName}/op-${node.operationId}.ts`)]
    },
    operations(nodes: Array<OperationNode>, ctx: GeneratorContext) {
      rec.operations.push({ plugin: ctx.plugin.name, count: nodes.length })
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
    rec = { schema: [], operation: [], operations: [] }
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
      { plugin: 'pluginA', count: 2 },
      { plugin: 'pluginB', count: 2 },
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

  it('fires kubb:plugin:end for every plugin with success', async () => {
    const onPluginEnd = vi.fn()
    hooks.hook('kubb:plugin:end', onPluginEnd)

    await driver.run()

    const ended = onPluginEnd.mock.calls.map(([ctx]) => ({ name: ctx.plugin.name, success: ctx.success }))
    expect(ended).toStrictEqual([
      { name: 'pluginA', success: true },
      { name: 'pluginB', success: true },
    ])
  })

  it('stops a throwing plugin without aborting the rest', async () => {
    rec = { schema: [], operation: [], operations: [] }
    const boomPlugin: Plugin = {
      name: 'boom',
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
    expect(diagnostics.some((diagnostic) => 'plugin' in diagnostic && diagnostic.plugin === 'boom')).toBe(true)
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
    rec = { schema: [], operation: [], operations: [] }
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
    rec = { schema: [], operation: [], operations: [] }
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
