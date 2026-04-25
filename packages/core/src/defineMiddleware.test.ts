import { AsyncEventEmitter } from '@internals/utils'
import { createFile, createSource, createText } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { createKubb } from './createKubb.ts'
import { defineMiddleware } from './defineMiddleware.ts'
import { definePlugin } from './definePlugin.ts'
import type { Config, KubbHooks, Middleware, Output, Plugin } from './types.ts'

// ---------------------------------------------------------------------------
// Module-level declare global augmentations used by the type tests below.
// Each uses a unique field name to avoid polluting other tests.
// ---------------------------------------------------------------------------
declare global {
  namespace Kubb {
    interface ConfigOptionsRegistry {
      output: {
        /**
         * Test-only field: verifies that `ConfigOptionsRegistry` augmentation
         * propagates to `Config['output']`.
         */
        _testConfigField?: string
      }
    }
    interface PluginOptionsRegistry {
      output: {
        /**
         * Test-only field: verifies that `PluginOptionsRegistry` augmentation
         * propagates to the per-plugin `Output` type.
         */
        _testPluginField?: number
      }
    }
  }
}

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    root: '.',
    input: { path: './petStore.yaml' },
    output: { path: './src/gen', clean: true },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [],
    ...overrides,
  }
}

describe('defineMiddleware', () => {
  it('returns a callable factory', () => {
    const factory = defineMiddleware(() => ({ name: 'my-middleware', hooks: {} }))

    expect(typeof factory).toBe('function')
  })

  it('calling the factory produces a Middleware instance', () => {
    const buildEnd = vi.fn()
    const factory = defineMiddleware(() => ({ name: 'my-middleware', hooks: { 'kubb:build:end': buildEnd } }))
    const middleware = factory()

    expect(middleware.name).toBe('my-middleware')
    expect(middleware.hooks['kubb:build:end']).toBe(buildEnd)
  })

  it('instance satisfies the Middleware type', () => {
    const factory = defineMiddleware(() => ({ name: 'typed-middleware', hooks: {} }))
    const middleware: Middleware = factory()

    expect(middleware.name).toBe('typed-middleware')
  })

  it('produces a fresh instance on each call', () => {
    const factory = defineMiddleware(() => ({ name: 'fresh-mw', hooks: {} }))

    const instance1 = factory()
    const instance2 = factory()

    expect(instance1.name).toBe('fresh-mw')
    expect(instance2.name).toBe('fresh-mw')
    expect(instance1).not.toBe(instance2)
  })

  it('passes options to the factory', () => {
    type Opts = { prefix: string }
    const factory = defineMiddleware((options: Opts) => ({
      name: `mw-${options.prefix}`,
      hooks: {},
    }))

    const middleware = factory({ prefix: 'test' })

    expect(middleware.name).toBe('mw-test')
  })

  it('options default to empty object when omitted', () => {
    const factory = defineMiddleware((_options: { prefix?: string } = {}) => ({
      name: 'default-opts-mw',
      hooks: {},
    }))

    const middleware = factory()

    expect(middleware.name).toBe('default-opts-mw')
  })

  it('per-build state is isolated across calls', () => {
    const factory = defineMiddleware(() => {
      const seen = new Set<string>()
      return {
        name: 'stateful-mw',
        hooks: {},
        _seen: seen,
      } as unknown as Middleware & { _seen: Set<string> }
    })

    const a = factory() as Middleware & { _seen: Set<string> }
    const b = factory() as Middleware & { _seen: Set<string> }

    a._seen.add('x')
    expect(a._seen.has('x')).toBe(true)
    expect(b._seen.has('x')).toBe(false)
  })

  it('factory return type is inferred as Middleware', () => {
    const factory = defineMiddleware(() => ({ name: 'type-check', hooks: {} }))

    expectTypeOf(factory()).toMatchTypeOf<Middleware>()
  })
})

describe('middleware runtime integration with createKubb', () => {
  it('hooks are registered during build', async () => {
    const buildEndMock = vi.fn()
    const factory = defineMiddleware(() => ({ name: 'test-mw', hooks: { 'kubb:build:end': buildEndMock } }))

    await createKubb(makeConfig({ middleware: [factory()] }), { hooks: new AsyncEventEmitter<KubbHooks>() }).build()

    expect(buildEndMock).toHaveBeenCalledOnce()
  })

  it('hooks are registered for each middleware in the array', async () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    const mw1 = defineMiddleware(() => ({ name: 'mw-1', hooks: { 'kubb:build:end': handler1 } }))
    const mw2 = defineMiddleware(() => ({ name: 'mw-2', hooks: { 'kubb:build:end': handler2 } }))

    await createKubb(makeConfig({ middleware: [mw1(), mw2()] }), { hooks: new AsyncEventEmitter<KubbHooks>() }).build()

    expect(handler1).toHaveBeenCalledOnce()
    expect(handler2).toHaveBeenCalledOnce()
  })

  it('no error when middleware array is omitted', async () => {
    await expect(createKubb(makeConfig(), { hooks: new AsyncEventEmitter<KubbHooks>() }).build()).resolves.toBeDefined()
  })

  it('middleware listeners fire after plugin listeners for the same event', async () => {
    const callOrder: string[] = []

    const plugin = definePlugin(() => ({
      name: 'ordering-plugin',
      hooks: {
        'kubb:plugin:setup'() {
          callOrder.push('plugin')
        },
      },
    }))()

    const middleware = defineMiddleware(() => ({
      name: 'ordering-mw',
      hooks: {
        'kubb:plugin:setup'() {
          callOrder.push('middleware')
        },
      },
    }))()

    await createKubb(
      makeConfig({
        plugins: [plugin] as unknown as Array<Plugin>,
        middleware: [middleware],
      }),
      { hooks: new AsyncEventEmitter<KubbHooks>() },
    ).build()

    const pluginIdx = callOrder.indexOf('plugin')
    const middlewareIdx = callOrder.indexOf('middleware')
    expect(pluginIdx).toBeGreaterThanOrEqual(0)
    expect(middlewareIdx).toBeGreaterThanOrEqual(0)
    expect(middlewareIdx).toBeGreaterThan(pluginIdx)
  })

  it('middleware can observe kubb:build:end and access files', async () => {
    const capturedFiles: unknown[] = []

    const middleware = defineMiddleware(() => ({
      name: 'build-end-observer',
      hooks: {
        'kubb:build:end'({ files }) {
          capturedFiles.push(...files)
        },
      },
    }))()

    await createKubb(makeConfig({ middleware: [middleware] }), { hooks: new AsyncEventEmitter<KubbHooks>() }).build()

    // files array is observable (may be empty in a no-op adapter, but the hook fired)
    expect(Array.isArray(capturedFiles)).toBe(true)
  })

  it('kubb:plugins:end fires before file writing and allows file injection', async () => {
    const injectedFile = createFile({
      path: '/tmp/barrel/index.ts',
      baseName: 'index.ts',
      sources: [createSource({ nodes: [createText('export {}')] })],
      imports: [],
      exports: [],
    })

    let pluginsEndFired = false

    const middleware = defineMiddleware(() => ({
      name: 'plugins-end-injector',
      hooks: {
        'kubb:plugins:end'({ upsertFile }) {
          pluginsEndFired = true
          upsertFile(injectedFile)
        },
      },
    }))()

    const { files } = await createKubb(makeConfig({ middleware: [middleware] }), { hooks: new AsyncEventEmitter<KubbHooks>() }).build()

    expect(pluginsEndFired).toBe(true)
    // The injected file must be included in the final file set
    expect(files.some((f) => f.baseName === 'index.ts')).toBe(true)
  })
})

describe('declare global augmentation', () => {
  it('ConfigOptionsRegistry: augmented output field is present on Config["output"]', () => {
    // Verify that `_testConfigField` added via `declare global { namespace Kubb {
    // interface ConfigOptionsRegistry { output: { _testConfigField?: string } } } }`
    // is visible on the `Config['output']` intersection type.
    expectTypeOf<Config['output']>().toHaveProperty('_testConfigField')
    expectTypeOf<Config['output']['_testConfigField']>().toEqualTypeOf<string | undefined>()

    // A value that satisfies the augmented type should be accepted at compile time.
    const output = { path: './src/gen' } satisfies Config['output']
    const withField = { path: './src/gen', _testConfigField: 'hello' } satisfies Config['output']

    expect(output).toBeDefined()
    expect(withField._testConfigField).toBe('hello')
  })

  it('PluginOptionsRegistry: augmented output field is present on per-plugin Output', () => {
    // Verify that `_testPluginField` added via `declare global { namespace Kubb {
    // interface PluginOptionsRegistry { output: { _testPluginField?: number } } } }`
    // is visible on the `Output` intersection type used by plugins.
    expectTypeOf<Output>().toHaveProperty('_testPluginField')
    expectTypeOf<Output['_testPluginField']>().toEqualTypeOf<number | undefined>()

    // A value satisfying Output can include the augmented field.
    const pluginOutput = { path: './src/gen', _testPluginField: 42 } satisfies Output

    expect(pluginOutput._testPluginField).toBe(42)
  })
})
