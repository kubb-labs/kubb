import { ast, type OperationNode, type SchemaNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import { type Diagnostic, Diagnostics } from './Diagnostics.ts'
import { KubbDriver } from './KubbDriver.ts'
import type { Config, KubbHooks } from './types.ts'
import type { Plugin, PluginVisitContext } from './definePlugin.ts'
import { memo, useKubb } from './composables.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import { Hookable } from './Hookable.ts'
import { checkoutGitInput } from './gitInput.ts'

vi.mock('./gitInput.ts', async (importOriginal) => ({ ...(await importOriginal<typeof import('./gitInput.ts')>()), checkoutGitInput: vi.fn() }))

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

  test('setup rejects with a config diagnostic when plugin dependencies form a cycle', async () => {
    const first = { name: 'first', dependencies: ['second'], hooks: {} }
    const second = { name: 'second', dependencies: ['first'], hooks: {} }

    const driver = makeDriver(makeConfig({ plugins: [first, second] }))

    await expect(driver.setup()).rejects.toThrow('Plugin dependencies form a cycle')
  })

  test.each([
    ['an uncalled factory', [function pluginTs() {}], 'plugins[0] is a function ("pluginTs"), not a plugin.', 'Call it: pluginTs()'],
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

describe('PluginVisitContext diagnostics', () => {
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

  it.each([['ctx.requirePlugin', () => context().requirePlugin('missing'), /Plugin "missing" is required by "pluginA" but not found/]])(
    'throws with the caller in the message when %s misses',
    (_name, requirePlugin, message) => {
      expect(requirePlugin).toThrowError(message)
    },
  )
})

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

describe('KubbDriver fileRefs', () => {
  const gitInput = 'git+https://example.com/api.git#main:specs/openapi.yaml'

  it.each([
    ['adds the git checkout folder to the folders a host allows', ['/project'], ['/project', '/checkout']],
    ['leaves an unset limit unset', undefined, undefined],
  ])('%s', async (_label, fileRefs, expected) => {
    vi.mocked(checkoutGitInput).mockResolvedValueOnce({ path: '/checkout/specs/openapi.yaml', dir: '/checkout', dispose: async () => {} })
    const parse = vi.fn(async () => ast.factory.createInput({ operations: [], meta: { title: 'Pets' } }))
    const driver = new KubbDriver(makeConfig({ input: gitInput, adapter: createMockedAdapter({ parse }) }), { hooks: new Hookable<KubbHooks>(), fileRefs })

    await driver.setup()
    await driver.run()
    expect(parse).toHaveBeenCalledWith({ type: 'path', path: '/checkout/specs/openapi.yaml' }, expect.objectContaining({ fileRefs: expected }))
  })
})

describe('KubbDriver visit hooks', () => {
  function visitPlugin(name: string, log: Array<string>, fail?: string): Plugin {
    return {
      name,
      hooks: {
        'kubb:plugin:visit:start'(ctx) {
          log.push(`${ctx.plugin.name}:start`)
        },
        'kubb:plugin:visit:schema'(node) {
          if (node.name === fail) throw new Error(`boom on ${fail}`)
          log.push(`${name}:schema:${node.name}`)
        },
        'kubb:plugin:visit:operation'(node) {
          log.push(`${name}:operation:${node.operationId}`)
        },
        'kubb:plugin:visit:end'() {
          log.push(`${name}:end`)
        },
      },
    }
  }

  it('walks schemas before operations, node-outer in plugin order', async () => {
    const log: Array<string> = []
    const driver = makeDriver(makeConfig({ adapter: inputAdapter(), plugins: [visitPlugin('visitA', log), visitPlugin('visitB', log)] }))
    await driver.setup()

    await driver.run()

    expect(log).toStrictEqual([
      'visitA:start',
      'visitB:start',
      'visitA:schema:Pet',
      'visitB:schema:Pet',
      'visitA:schema:Store',
      'visitB:schema:Store',
      'visitA:operation:getPet',
      'visitB:operation:getPet',
      'visitA:operation:listPets',
      'visitB:operation:listPets',
      'visitA:end',
      'visitB:end',
    ])
  })

  it('stops a failing visit plugin with its crash site, and every plugin still ends with a timing', async () => {
    const log: Array<string> = []
    const ended: Array<string> = []
    const hooks = new Hookable<KubbHooks>()
    hooks.hook('kubb:plugin:end', ({ plugin }) => {
      ended.push(plugin.name)
    })
    const driver = makeDriver(makeConfig({ adapter: inputAdapter(), plugins: [visitPlugin('boom', log, 'Store'), visitPlugin('after', log)] }), hooks)
    await driver.setup()

    const { diagnostics } = await driver.run()

    expect(log.filter((entry) => entry.startsWith('boom:'))).toStrictEqual(['boom:start', 'boom:schema:Pet'])
    expect(log.filter((entry) => entry.startsWith('after:'))).toHaveLength(6)
    expect(ended).toStrictEqual(['boom', 'after'])
    expect(diagnostics.filter((diagnostic) => diagnostic.kind === 'performance')).toHaveLength(2)
    expect(diagnostics.find((diagnostic) => diagnostic.severity === 'error')).toMatchObject({
      code: 'KUBB_PLUGIN_FAILED',
      message: 'While generating schema "Store": boom on Store',
      location: { kind: 'schema', pointer: '#/components/schemas/Store' },
    })
  })
})

describe('KubbDriver bus hooks', () => {
  it('gives each listener of a driver-fired event its own plugin context as this and useKubb()', async () => {
    const seen: Array<{ name: string; same: boolean }> = []
    const listener = (name: string): Plugin => ({
      name,
      hooks: {
        'kubb:build:start'(this: PluginVisitContext) {
          seen.push({ name: useKubb<PluginVisitContext>().plugin.name, same: this === useKubb<PluginVisitContext>() })
        },
      },
    })
    const driver = makeDriver(makeConfig({ plugins: [listener('a'), listener('b')] }))
    await driver.setup()

    await driver.run()

    expect(seen).toStrictEqual([
      { name: 'a', same: true },
      { name: 'b', same: true },
    ])
  })

  it('runs memo() inside kubb:plugins:end', async () => {
    const values: Array<number> = []
    const plugin = (name: string): Plugin => ({
      name,
      hooks: {
        'kubb:plugins:end'() {
          values.push(memo('test:shared', () => values.length + 1))
        },
      },
    })
    const driver = makeDriver(makeConfig({ plugins: [plugin('a'), plugin('b')] }))
    await driver.setup()

    const { diagnostics } = await driver.run()

    expect(diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toStrictEqual([])
    expect(values).toStrictEqual([1, 1])
  })

  it('keeps the emitting hook context for an event fired inside a hook', async () => {
    const seen: Array<string> = []
    const emitter: Plugin = {
      name: 'emitter',
      hooks: {
        async 'kubb:build:start'() {
          await useKubb<PluginVisitContext>().hooks.callHook('kubb:info', { message: 'hi' })
        },
      },
    }
    const listener: Plugin = {
      name: 'listener',
      hooks: {
        'kubb:info'() {
          seen.push(useKubb<PluginVisitContext>().plugin.name)
        },
      },
    }
    const driver = makeDriver(makeConfig({ plugins: [emitter, listener] }))
    await driver.setup()

    await driver.run()

    expect(seen).toStrictEqual(['emitter'])
  })

  it('shares one visit context between bus hooks and the walk', async () => {
    const contexts: Array<unknown> = []
    const plugin: Plugin = {
      name: 'a',
      hooks: {
        'kubb:build:start'() {
          contexts.push(useKubb())
        },
        'kubb:plugin:visit:start'(ctx) {
          contexts.push(ctx)
        },
      },
    }
    const driver = makeDriver(makeConfig({ adapter: inputAdapter(), plugins: [plugin] }))
    await driver.setup()

    await driver.run()

    expect(contexts).toHaveLength(2)
    expect(contexts[0]).toBe(contexts[1])
  })
})
