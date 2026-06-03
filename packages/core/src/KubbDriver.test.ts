import { AsyncEventEmitter } from '@internals/utils'
import { createFile } from '@kubb/ast'
import type { FileNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import { diagnosticCode } from './constants.ts'
import { type Diagnostic, Diagnostics, isProblemDiagnostic } from './diagnostics.ts'
import { KubbDriver } from './KubbDriver.ts'
import type { Config, KubbHooks, Middleware, Plugin } from './types.ts'
import { fsStorage } from './storages/fsStorage.ts'

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
    adapter: createMockedAdapter(),
    plugins: [pluginA, pluginB, pluginC] as unknown as Array<Plugin>,
    storage: fsStorage(),
  } satisfies Config
  let pluginDriver: KubbDriver

  beforeEach(async () => {
    pluginDriver = new KubbDriver(config, {
      hooks: new AsyncEventEmitter<KubbHooks>(),
    })
    await pluginDriver.setup()
  })

  afterEach(() => {
    pluginDriver.hooks.removeAll()
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

    const driver = new KubbDriver(cfg, { hooks: new AsyncEventEmitter<KubbHooks>() })
    await driver.setup()
    const names = [...driver.plugins.keys()]

    expect(names.indexOf('pre')).toBeLessThan(names.indexOf('normal'))
    expect(names.indexOf('normal')).toBeLessThan(names.indexOf('post'))
  })

  test('does not throw when a plugin has no hooks property', async () => {
    const pluginWithoutHooks = { name: 'no-hooks' } as unknown as Plugin
    const cfg = {
      ...config,
      plugins: [pluginWithoutHooks],
    } satisfies Config

    const driver = new KubbDriver(cfg, { hooks: new AsyncEventEmitter<KubbHooks>() })
    await expect(driver.setup()).resolves.not.toThrow()
  })

  test('plugin and middleware listeners fire in order, and dispose drops both for the next build', async () => {
    const calls: Array<string> = []
    const pluginHook = vi.fn(() => void calls.push('plugin'))
    const middlewareHook = vi.fn(() => void calls.push('middleware'))

    const plugin = { name: 'order-plugin', hooks: { 'kubb:plugin:start': pluginHook } } as unknown as Plugin
    const middleware: Middleware = {
      name: 'order-middleware',
      hooks: { 'kubb:plugin:start': middlewareHook },
    }

    const cfg = {
      ...config,
      plugins: [plugin],
      middleware: [middleware],
    } satisfies Config

    const hooks = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(cfg, { hooks })
    await driver.setup()
    await hooks.emit('kubb:plugin:start', { plugin: plugin as never })

    expect(calls).toStrictEqual(['plugin', 'middleware'])
    expect(hooks.listenerCount('kubb:plugin:start')).toBe(2)

    driver.dispose()

    expect(hooks.listenerCount('kubb:plugin:start')).toBe(0)

    await hooks.emit('kubb:plugin:start', { plugin: plugin as never })

    expect(pluginHook).toHaveBeenCalledTimes(1)
    expect(middlewareHook).toHaveBeenCalledTimes(1)
  })

  test('listeners attached directly to hooks survive dispose', async () => {
    const external = vi.fn()
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(config, { hooks })
    await driver.setup()

    hooks.on('kubb:build:end', external)
    driver.dispose()
    await hooks.emit('kubb:build:end', {
      files: [],
      config,
      outputDir: '/tmp',
    })

    expect(external).toHaveBeenCalledTimes(1)
  })
})

function file(name: string): FileNode {
  return createFile({ baseName: `${name}.ts`, path: `${name}.ts` })
}

function makeDriver(): KubbDriver {
  return new KubbDriver(
    {
      root: '.',
      input: { path: './petStore.yaml' },
      output: { path: './gen', clean: true },
      parsers: [],
      adapter: createMockedAdapter(),
      plugins: [],
      storage: fsStorage(),
    } satisfies Config,
    { hooks: new AsyncEventEmitter<KubbHooks>() },
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

  it('routes element results through the renderer stream when present', () => {
    const driver = makeDriver()
    const rendered = [file('rendered-1'), file('rendered-2')]
    const renderer = vi.fn(() => ({
      stream: vi.fn(function* () {
        yield* rendered
      }),
      [Symbol.dispose]: () => {},
    }))

    driver.dispatch({ result: { kind: 'element' }, renderer: renderer as never })

    expect(renderer).toHaveBeenCalledOnce()
    expect(driver.fileManager.files.map((f) => f.name)).toStrictEqual(['rendered-1', 'rendered-2'])
  })

  it('routes element results through the async render path when no stream is exposed', async () => {
    const driver = makeDriver()
    const renderer = {
      render: vi.fn(async () => {}),
      files: [file('async-1')],
      [Symbol.dispose]: () => {},
    }
    const factory = vi.fn(() => renderer)

    const result = driver.dispatch({ result: { kind: 'element' }, renderer: factory as never })
    await result

    expect(renderer.render).toHaveBeenCalledOnce()
    expect(driver.fileManager.files.map((f) => f.name)).toStrictEqual(['async-1'])
  })
})

describe('GeneratorContext diagnostics', () => {
  const config = {
    root: '.',
    input: { path: './petStore.yaml' },
    output: { path: './src/gen', clean: true },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [{ name: 'pluginA', hooks: {} }] as unknown as Array<Plugin>,
    storage: fsStorage(),
  } satisfies Config

  let driver: KubbDriver

  beforeEach(async () => {
    driver = new KubbDriver(config, { hooks: new AsyncEventEmitter<KubbHooks>() })
    await driver.setup()
  })

  afterEach(() => {
    driver.hooks.removeAll()
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

    expect(diagnostics).toMatchObject([{ code: diagnosticCode.pluginFailed, severity: 'error', message: 'boom', plugin: 'pluginA' }])
    expect(Diagnostics.hasError(diagnostics)).toBe(true)
  })

  it('keeps the original Error as the cause when ctx.error is passed an Error', () => {
    const cause = new Error('underlying')
    const diagnostics = collect((ctx) => ctx.error(cause))

    const [diagnostic] = diagnostics
    expect(diagnostic && isProblemDiagnostic(diagnostic) ? diagnostic.cause : undefined).toBe(cause)
  })

  it('reports ctx.warn as a warning diagnostic that does not fail the build', () => {
    const diagnostics = collect((ctx) => ctx.warn('careful'))

    expect(diagnostics).toMatchObject([{ code: diagnosticCode.pluginWarning, severity: 'warning', message: 'careful', plugin: 'pluginA' }])
    expect(Diagnostics.hasError(diagnostics)).toBe(false)
  })

  it('reports ctx.info as an info diagnostic', () => {
    const diagnostics = collect((ctx) => ctx.info('heads up'))

    expect(diagnostics).toMatchObject([{ code: diagnosticCode.pluginInfo, severity: 'info', message: 'heads up', plugin: 'pluginA' }])
  })

  it('collects the diagnostic only and does not emit a live hook event', () => {
    const onError = vi.fn()
    driver.hooks.on('kubb:error', onError)

    collect((ctx) => ctx.error('boom'))

    expect(onError).not.toHaveBeenCalled()
  })
})
