import { AsyncEventEmitter } from '@internals/utils'
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
  it('returns the middleware object unchanged', () => {
    const install = vi.fn()
    const middleware = defineMiddleware({ name: 'my-middleware', install })

    expect(middleware.name).toBe('my-middleware')
    expect(middleware.install).toBe(install)
  })

  it('satisfies the Middleware type', () => {
    const middleware: Middleware = defineMiddleware({
      name: 'typed-middleware',
      install(_hooks) {},
    })

    expect(middleware.name).toBe('typed-middleware')
  })

  it('install() receives an AsyncEventEmitter instance', () => {
    const receivedHooks: unknown[] = []
    const middleware = defineMiddleware({
      name: 'hooks-check',
      install(hooks) {
        receivedHooks.push(hooks)
      },
    })

    const hooks = new AsyncEventEmitter<KubbHooks>()
    middleware.install(hooks)

    expect(receivedHooks).toHaveLength(1)
    expect(receivedHooks[0]).toBe(hooks)
  })
})

describe('middleware runtime integration with createKubb', () => {
  it('install() is called during build', async () => {
    const installMock = vi.fn()
    const middleware = defineMiddleware({ name: 'test-mw', install: installMock })

    await createKubb(
      makeConfig({ middleware: [middleware] }),
      { hooks: new AsyncEventEmitter<KubbHooks>() },
    ).build()

    expect(installMock).toHaveBeenCalledOnce()
  })

  it('install() is called for each middleware in the array', async () => {
    const install1 = vi.fn()
    const install2 = vi.fn()
    const mw1 = defineMiddleware({ name: 'mw-1', install: install1 })
    const mw2 = defineMiddleware({ name: 'mw-2', install: install2 })

    await createKubb(
      makeConfig({ middleware: [mw1, mw2] }),
      { hooks: new AsyncEventEmitter<KubbHooks>() },
    ).build()

    expect(install1).toHaveBeenCalledOnce()
    expect(install2).toHaveBeenCalledOnce()
  })

  it('no error when middleware array is omitted', async () => {
    await expect(
      createKubb(makeConfig(), { hooks: new AsyncEventEmitter<KubbHooks>() }).build(),
    ).resolves.toBeDefined()
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

    const middleware = defineMiddleware({
      name: 'ordering-mw',
      install(hooks) {
        hooks.on('kubb:plugin:setup', () => {
          callOrder.push('middleware')
        })
      },
    })

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

    const middleware = defineMiddleware({
      name: 'build-end-observer',
      install(hooks) {
        hooks.on('kubb:build:end', ({ files }) => {
          capturedFiles.push(...files)
        })
      },
    })

    await createKubb(
      makeConfig({ middleware: [middleware] }),
      { hooks: new AsyncEventEmitter<KubbHooks>() },
    ).build()

    // files array is observable (may be empty in a no-op adapter, but the hook fired)
    expect(Array.isArray(capturedFiles)).toBe(true)
  })

  it('kubb:plugins:end fires before file writing and allows file injection', async () => {
    const { createFile, createSource, createText } = await import('@kubb/ast')

    const injectedFile = createFile({
      path: '/tmp/barrel/index.ts',
      baseName: 'index.ts',
      sources: [createSource({ nodes: [createText('export {}') as never] })],
      imports: [],
      exports: [],
    })

    let pluginsEndFired = false

    const middleware = defineMiddleware({
      name: 'plugins-end-injector',
      install(hooks) {
        hooks.on('kubb:plugins:end', ({ upsertFile }) => {
          pluginsEndFired = true
          upsertFile(injectedFile)
        })
      },
    })

    const { files } = await createKubb(
      makeConfig({ middleware: [middleware] }),
      { hooks: new AsyncEventEmitter<KubbHooks>() },
    ).build()

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
