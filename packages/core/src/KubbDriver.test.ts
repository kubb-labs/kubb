import { ast, type FileNode, type OperationNode, type SchemaNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import { type Diagnostic, Diagnostics } from './Diagnostics.ts'
import { KubbDriver } from './KubbDriver.ts'
import type { Config, GeneratorContext, KubbHooks, KubbPluginSetupContext, Plugin } from './types.ts'
import type { Generator } from './defineGenerator.ts'
import { fsStorage } from './storages/fsStorage.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import { Hookable } from './Hookable.ts'

describe('PluginDriver', () => {
  const pluginA = {
    name: 'pluginA',
    hooks: {},
  }

  const pluginB = {
    name: 'pluginB',
    hooks: {},
  }

  const pluginC = {
    name: 'pluginC',
    hooks: {},
  }

  const config = {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    parsers: [],
    reporters: [],
    adapter: createMockedAdapter(),
    plugins: [pluginA, pluginB, pluginC] as unknown as Array<Plugin>,
    storage: fsStorage(),
  } satisfies Config
  let pluginDriver: KubbDriver

  beforeEach(async () => {
    pluginDriver = new KubbDriver(config, {
      hooks: new Hookable<KubbHooks>(),
    })
    await pluginDriver.setup()
  })

  afterEach(() => {
    pluginDriver.hooks.removeAllHooks()
  })

  test('if pluginDriver can be created', () => {
    expect(pluginDriver.plugins.size).toBe(config.plugins.length)
  })

  test('enforce: pre plugins run before normal and post plugins', async () => {
    const prePlugin = { name: 'pre', enforce: 'pre' as const, hooks: {} }
    const normalPlugin = { name: 'normal', hooks: {} }
    const postPlugin = { name: 'post', enforce: 'post' as const, hooks: {} }

    const cfg = {
      ...config,
      // intentionally declared in reverse order to verify sorting
      plugins: [postPlugin, normalPlugin, prePlugin] as unknown as Array<Plugin>,
    } satisfies Config

    const driver = new KubbDriver(cfg, { hooks: new Hookable<KubbHooks>() })
    await driver.setup()
    const names = [...driver.plugins.keys()]

    expect(names.indexOf('pre')).toBeLessThan(names.indexOf('normal'))
    expect(names.indexOf('normal')).toBeLessThan(names.indexOf('post'))
  })

  test('orders a transitive dependency chain so dependencies always run first', async () => {
    const pluginTop = { name: 'top', dependencies: ['middle'], hooks: {} }
    const pluginMiddle = { name: 'middle', dependencies: ['base'], hooks: {} }
    const pluginBase = { name: 'base', hooks: {} }

    const cfg = {
      ...config,
      // declared dependents-first so declaration order alone cannot produce the result
      plugins: [pluginTop, pluginMiddle, pluginBase] as unknown as Array<Plugin>,
    } satisfies Config

    const driver = new KubbDriver(cfg, { hooks: new Hookable<KubbHooks>() })
    await driver.setup()

    expect([...driver.plugins.keys()]).toStrictEqual(['base', 'middle', 'top'])
  })

  test('setup rejects with a config diagnostic when plugin dependencies form a cycle', async () => {
    const first = { name: 'first', dependencies: ['second'], hooks: {} }
    const second = { name: 'second', dependencies: ['first'], hooks: {} }

    const cfg = {
      ...config,
      plugins: [first, second] as unknown as Array<Plugin>,
    } satisfies Config

    const driver = new KubbDriver(cfg, { hooks: new Hookable<KubbHooks>() })

    await expect(driver.setup()).rejects.toThrow('Plugin dependencies form a cycle')
  })

  test('does not throw when a plugin has no hooks property', async () => {
    const pluginWithoutHooks = { name: 'no-hooks' } as unknown as Plugin
    const cfg = {
      ...config,
      plugins: [pluginWithoutHooks],
    } satisfies Config

    const driver = new KubbDriver(cfg, { hooks: new Hookable<KubbHooks>() })
    await expect(driver.setup()).resolves.not.toThrow()
  })

  test('plugin and post-plugin listeners fire in order, and dispose drops both for the next build', async () => {
    const calls: Array<string> = []
    const pluginHook = vi.fn(() => void calls.push('plugin'))
    const postPluginHook = vi.fn(() => void calls.push('post-plugin'))

    const plugin = { name: 'order-plugin', hooks: { 'kubb:plugin:start': pluginHook } } as unknown as Plugin
    const postPlugin = { name: 'order-post-plugin', enforce: 'post' as const, hooks: { 'kubb:plugin:start': postPluginHook } } as unknown as Plugin

    const cfg = {
      ...config,
      plugins: [plugin, postPlugin],
    } satisfies Config

    const hooks = new Hookable<KubbHooks>()
    const driver = new KubbDriver(cfg, { hooks })
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
    const driver = new KubbDriver(config, { hooks })
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

function makeDriver(): KubbDriver {
  return new KubbDriver(
    {
      root: '.',
      input: './petStore.yaml',
      output: { path: './gen', clean: true },
      parsers: [],
      reporters: [],
      adapter: createMockedAdapter(),
      plugins: [],
      storage: fsStorage(),
    } satisfies Config,
    { hooks: new Hookable<KubbHooks>() },
  )
}

describe('KubbDriver#dispatch', () => {
  it('does nothing on null or undefined', () => {
    const driver = makeDriver()
    const upsert = vi.spyOn(driver.fileManager, 'upsert')

    driver.dispatch({ result: null })
    driver.dispatch({ result: undefined })

    expect(upsert).not.toHaveBeenCalled()
  })

  it('upserts every file when the result is an Array<FileNode>', () => {
    const driver = makeDriver()
    const files = [file('a'), file('b')]

    driver.dispatch({ result: files })

    expect(driver.fileManager.files.map((f) => f.name)).toStrictEqual(['a', 'b'])
  })

  it('ignores non-array results when no renderer is provided', () => {
    const driver = makeDriver()
    const upsert = vi.spyOn(driver.fileManager, 'upsert')

    driver.dispatch({ result: { kind: 'element' } })

    expect(upsert).not.toHaveBeenCalled()
  })

  it('routes element results through the renderer, upserting its files', async () => {
    const driver = makeDriver()
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
  const config = {
    root: '.',
    input: './petStore.yaml',
    output: { path: './src/gen', clean: true },
    parsers: [],
    reporters: [],
    adapter: createMockedAdapter(),
    plugins: [{ name: 'pluginA', hooks: {} }] as unknown as Array<Plugin>,
    storage: fsStorage(),
  } satisfies Config

  let driver: KubbDriver

  beforeEach(async () => {
    driver = new KubbDriver(config, { hooks: new Hookable<KubbHooks>() })
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

  it('reports ctx.error as an error diagnostic that fails the build, attributed to the plugin', () => {
    const diagnostics = collect((ctx) => ctx.error('boom'))

    expect(diagnostics).toMatchObject([{ code: Diagnostics.code.pluginFailed, severity: 'error', message: 'boom', plugin: 'pluginA' }])
    expect(Diagnostics.hasError(diagnostics)).toBe(true)
  })

  it('keeps the original Error as the cause when ctx.error is passed an Error', () => {
    const cause = new Error('underlying')
    const diagnostics = collect((ctx) => ctx.error(cause))

    const [diagnostic] = diagnostics
    expect(diagnostic && Diagnostics.isProblem(diagnostic) ? diagnostic.cause : undefined).toBe(cause)
  })

  it('reports ctx.warn as a warning diagnostic that does not fail the build', () => {
    const diagnostics = collect((ctx) => ctx.warn('careful'))

    expect(diagnostics).toMatchObject([{ code: Diagnostics.code.pluginWarning, severity: 'warning', message: 'careful', plugin: 'pluginA' }])
    expect(Diagnostics.hasError(diagnostics)).toBe(false)
  })

  it('reports ctx.info as an info diagnostic', () => {
    const diagnostics = collect((ctx) => ctx.info('heads up'))

    expect(diagnostics).toMatchObject([{ code: Diagnostics.code.pluginInfo, severity: 'info', message: 'heads up', plugin: 'pluginA' }])
  })

  it('collects the diagnostic only and does not emit a live hook', () => {
    const onError = vi.fn()
    driver.hooks.hook('kubb:error', onError)

    collect((ctx) => ctx.error('boom'))

    expect(onError).not.toHaveBeenCalled()
  })

  it('names the requiring plugin when ctx.requirePlugin misses', () => {
    expect(() => context().requirePlugin('missing')).toThrowError(/Plugin "missing" is required by "pluginA" but not found/)
  })

  it('keeps the plain message for a direct driver.requirePlugin call', () => {
    expect(() => driver.requirePlugin('missing')).toThrowError(/Plugin "missing" is required but not found/)
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
  } as unknown as Plugin
}

describe('KubbDriver generator dispatch', () => {
  let rec: Recorder
  let driver: KubbDriver
  let hooks: Hookable<KubbHooks>

  const build = async () => {
    rec = { schema: [], operation: [], operations: [] }
    hooks = new Hookable<KubbHooks>()
    const config = {
      root: '.',
      input: { path: './petStore.yaml' },
      output: { path: './gen' },
      parsers: [],
      reporters: [],
      adapter: inputAdapter(),
      plugins: [makePlugin('pluginA', rec), makePlugin('pluginB', rec)],
      storage: memoryStorage(),
    } satisfies Config
    driver = new KubbDriver(config, { hooks })
    await driver.setup()
  }

  beforeEach(build)
  afterEach(() => hooks.removeAllHooks())

  it('walks each node once and fans it out to every plugin in dependency order', async () => {
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
  })

  it('collects one file per generator return, keyed by plugin and node', async () => {
    await driver.run()

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
    hooks = new Hookable<KubbHooks>()
    const boomPlugin = {
      name: 'boom',
      hooks: {
        'kubb:plugin:setup'(ctx: KubbPluginSetupContext) {
          ctx.addGenerator({
            name: 'boom-gen',
            schema() {
              throw new Error('boom in schema')
            },
          })
        },
      },
    } as unknown as Plugin
    const config = {
      root: '.',
      input: { path: './petStore.yaml' },
      output: { path: './gen' },
      parsers: [],
      reporters: [],
      adapter: inputAdapter(),
      plugins: [boomPlugin, makePlugin('after', rec)],
      storage: memoryStorage(),
    } satisfies Config
    const boomDriver = new KubbDriver(config, { hooks })
    await boomDriver.setup()

    const { diagnostics } = await boomDriver.run()

    // The plugin after the failing one still runs every node.
    expect(rec.schema.map((entry) => entry.name)).toStrictEqual(['Pet', 'Store'])
    expect(diagnostics.some((diagnostic) => 'plugin' in diagnostic && diagnostic.plugin === 'boom')).toBe(true)
    hooks.removeAllHooks()
  })

  it('shares one cache per node across plugins and gives each node a fresh one', async () => {
    const seen: Array<{ plugin: string; node: string; token: number }> = []
    let counter = 0
    const cachePlugin = (name: string): Plugin =>
      ({
        name,
        hooks: {
          'kubb:plugin:setup'(ctx: KubbPluginSetupContext) {
            ctx.addGenerator({
              name: `${name}-cache`,
              schema(node: SchemaNode, gctx: GeneratorContext) {
                // The first plugin to reach a node fills the token, and the rest read the same value.
                const token = gctx.cache.getOrSet('token', () => ++counter)
                seen.push({ plugin: gctx.plugin.name, node: node.name!, token })
                return null
              },
            })
          },
        },
      }) as unknown as Plugin

    const localHooks = new Hookable<KubbHooks>()
    const cfg = {
      root: '.',
      input: { path: './petStore.yaml' },
      output: { path: './gen' },
      parsers: [],
      reporters: [],
      adapter: inputAdapter(),
      plugins: [cachePlugin('one'), cachePlugin('two')],
      storage: memoryStorage(),
    } satisfies Config
    const cacheDriver = new KubbDriver(cfg, { hooks: localHooks })
    await cacheDriver.setup()
    await cacheDriver.run()

    expect(seen).toStrictEqual([
      { plugin: 'one', node: 'Pet', token: 1 },
      { plugin: 'two', node: 'Pet', token: 1 },
      { plugin: 'one', node: 'Store', token: 2 },
      { plugin: 'two', node: 'Store', token: 2 },
    ])
    localHooks.removeAllHooks()
  })

  it('normalizes plugin options after setup even when setOptions is never called', async () => {
    const localHooks = new Hookable<KubbHooks>()
    const plugin = {
      name: 'opts-plugin',
      options: { output: { path: 'types' }, enumType: 'asConst' },
      hooks: {},
    } as unknown as Plugin
    const config = {
      root: '.',
      input: { path: './petStore.yaml' },
      output: { path: './gen' },
      parsers: [],
      reporters: [],
      adapter: inputAdapter(),
      plugins: [plugin],
      storage: memoryStorage(),
    } satisfies Config
    const optsDriver = new KubbDriver(config, { hooks: localHooks })
    await optsDriver.setup()
    await optsDriver.run()

    const normalized = optsDriver.plugins.get('opts-plugin')!.options
    expect(normalized.output).toStrictEqual({ path: 'types', mode: 'file' })
    expect(normalized.exclude).toStrictEqual([])
    expect(normalized.override).toStrictEqual([])
    expect((normalized as Record<string, unknown>).enumType).toBe('asConst')
    localHooks.removeAllHooks()
  })
})
