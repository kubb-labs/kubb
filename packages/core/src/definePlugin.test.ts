import { AsyncEventEmitter } from '@internals/utils'
import { createFile } from '@kubb/ast'
import { describe, expect, it, vi } from 'vitest'
import { createMockedAdapter } from '#mocks'
import { createPlugin } from './createPlugin.ts'
import { definePlugin, isHookStylePlugin } from './definePlugin.ts'
import { PluginDriver } from './PluginDriver.ts'
import type { Config, KubbEvents, Plugin } from './types.ts'

describe('definePlugin', () => {
  it('creates a valid hook-style plugin with `hooks:` property', () => {
    const plugin = definePlugin<{ tag: string }>((options) => ({
      name: 'my-hook-plugin',
      options,
      hooks: {
        'kubb:plugin:setup'(_ctx) {},
      },
    }))({ tag: 'pets' })

    expect(plugin.name).toBe('my-hook-plugin')
    expect(plugin.options).toEqual({ tag: 'pets' })
    expect(typeof plugin.hooks['kubb:plugin:setup']).toBe('function')
  })

  it('uses empty object as default options when none are provided', () => {
    const factory = definePlugin<{ tag?: string }>((options) => ({
      name: 'my-plugin',
      options,
      hooks: {},
    }))
    const plugin = factory()
    expect(plugin.options).toEqual({})
  })

  it('isHookStylePlugin returns true for definePlugin output', () => {
    const plugin = definePlugin((_options) => ({
      name: 'test',
      hooks: {},
    }))()
    expect(isHookStylePlugin(plugin)).toBe(true)
  })

  it('isHookStylePlugin returns false for createPlugin output', () => {
    const plugin = createPlugin(() => ({
      name: 'legacy',
      options: undefined as any,
      context: undefined as never,
      buildStart() {},
    }))()
    expect(isHookStylePlugin(plugin)).toBe(false)
  })
})

describe('PluginDriver — hook-style plugin registration', () => {
  function makeConfig(plugins: Array<Plugin>): Config {
    return {
      root: '.',
      input: { path: './petStore.yaml' },
      output: { path: './src/gen', clean: true },
      parsers: [],
      adapter: createMockedAdapter(),
      plugins,
    }
  }

  it('registers a hook-style plugin in the plugins map', () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {},
    }))()

    const driver = new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), {
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    expect(driver.plugins.has('hook-plugin')).toBe(true)
  })

  it('registers kubb:plugin:setup handler on the event emitter', () => {
    const setupHandler = vi.fn()
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup': setupHandler,
      },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })

    expect(events.listenerCount('kubb:plugin:setup')).toBeGreaterThan(0)
  })

  it('calls kubb:plugin:setup handler when event is emitted', async () => {
    const setupHandler = vi.fn()
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup': setupHandler,
      },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })

    await events.emit('kubb:plugin:setup', {
      config: makeConfig([]),
      addGenerator: () => {},
      setResolver: () => {},
      setTransformer: () => {},
      setRenderer: () => {},
      injectFile: () => {},
      updateConfig: () => {},
      options: {},
    })

    expect(setupHandler).toHaveBeenCalledOnce()
  })

  it('addGenerator() registers generators via the event-based path (not on plugin.generators)', async () => {
    const generator = { name: 'my-gen', schema: vi.fn() }
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator(generator)
        },
      },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    const driver = new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })

    // Before emit — no generators yet
    expect(driver.hasRegisteredGenerators('hook-plugin')).toBe(false)

    await driver.emitSetupHooks()

    // After emit — generator is registered via the event-based path
    expect(driver.hasRegisteredGenerators('hook-plugin')).toBe(true)
    // Generators registered via addGenerator() do NOT populate plugin.generators —
    // they are wired as listeners on kubb:generate:* events instead.
    expect(driver.plugins.get('hook-plugin')?.generators ?? []).toHaveLength(0)
  })

  it('options passed to definePlugin are forwarded via ctx.options', async () => {
    const capturedOptions: unknown[] = []
    const hookPlugin = definePlugin<{ tag: string }>((options) => ({
      name: 'hook-plugin',
      options,
      hooks: {
        'kubb:plugin:setup'(ctx) {
          capturedOptions.push(ctx.options)
        },
      },
    }))({ tag: 'pets' })

    const events = new AsyncEventEmitter<KubbEvents>()
    new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })

    await events.emit('kubb:plugin:setup', {
      config: makeConfig([]),
      addGenerator: () => {},
      setResolver: () => {},
      setTransformer: () => {},
      setRenderer: () => {},
      injectFile: () => {},
      updateConfig: () => {},
      options: {},
    })

    expect(capturedOptions[0]).toEqual({ tag: 'pets' })
  })

  it('setResolver() merges partial resolver overrides with framework defaults', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.setResolver({
            default() {
              return 'CustomTypeName'
            },
          })
        },
      },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    const driver = new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })
    await driver.emitSetupHooks()

    const resolver = driver.getResolver('hook-plugin')
    expect(resolver.default('any value', 'type')).toBe('CustomTypeName')
    expect(
      resolver.resolvePath(
        { baseName: 'pets.ts' },
        {
          root: '/tmp/root',
          output: { path: 'gen' },
        },
      ),
    ).toBe('/tmp/root/gen/pets.ts')
  })

  it('uses default resolver when setResolver() is never called', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {},
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    const driver = new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })

    const resolver = driver.getResolver('hook-plugin')
    expect(resolver.default('my custom type', 'type')).toBe('MyCustomType')
  })

  it('external listeners receive kubb:plugin:setup context', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: { 'kubb:plugin:setup'() {} },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })

    const externalListener = vi.fn()
    events.on('kubb:plugin:setup', externalListener)

    const ctx = {
      config: makeConfig([]),
      addGenerator: () => {},
      setResolver: () => {},
      setTransformer: () => {},
      setRenderer: () => {},
      injectFile: () => {},
      updateConfig: () => {},
      options: {},
    }
    await events.emit('kubb:plugin:setup', ctx)

    expect(externalListener).toHaveBeenCalledWith(ctx)
  })
})

describe('PluginDriver — mixed createPlugin + definePlugin', () => {
  it('both legacy and hook-style plugins coexist in the same config', () => {
    const legacyPlugin = createPlugin(() => ({
      name: 'legacy-plugin',
      options: undefined as any,
      context: undefined as never,
      buildStart() {},
    }))()

    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {},
    }))()

    const config: Config = {
      root: '.',
      input: { path: './petStore.yaml' },
      output: { path: './src/gen' },
      parsers: [],
      adapter: createMockedAdapter(),
      plugins: [legacyPlugin, hookPlugin as unknown as Plugin] as Array<Plugin>,
    }

    const driver = new PluginDriver(config, {
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    expect(driver.plugins.has('legacy-plugin')).toBe(true)
    expect(driver.plugins.has('hook-plugin')).toBe(true)
    expect(driver.plugins.size).toBe(2)
  })
})

describe('PluginDriver — generator event dispatch', () => {
  function makeConfig(plugins: Array<Plugin>): Config {
    return {
      root: '.',
      input: { path: './petStore.yaml' },
      output: { path: './src/gen', clean: true },
      parsers: [],
      adapter: createMockedAdapter(),
      plugins,
    }
  }

  it('registerGenerator() registers kubb:generate:schema listener scoped to plugin', async () => {
    const schemaMock = vi.fn().mockResolvedValue(undefined)
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({ name: 'test-gen', schema: schemaMock })
        },
      },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    const driver = new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })
    await driver.emitSetupHooks()

    const fakePlugin = driver.plugins.get('hook-plugin')!
    const fakeCtx = {
      ...(driver.getContext(fakePlugin) as any),
      plugin: fakePlugin,
      adapter: {},
      inputNode: {},
      options: {},
      emitFile: vi.fn(),
    } as const
    const fakeNode = { kind: 'Schema', name: 'Pet' } as any

    await events.emit('kubb:generate:schema', fakeNode, fakeCtx as any)
    expect(schemaMock).toHaveBeenCalledOnce()
    expect(schemaMock).toHaveBeenCalledWith(fakeNode, expect.objectContaining({ options: {}, plugin: fakePlugin }))
  })

  it('registerGenerator() does NOT fire for a different plugin context', async () => {
    const schemaMock = vi.fn().mockResolvedValue(undefined)
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({ name: 'test-gen', schema: schemaMock })
        },
      },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    const driver = new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })
    await driver.emitSetupHooks()

    // Emit with a DIFFERENT plugin name in the context — should NOT trigger the listener
    const otherPlugin = { name: 'other-plugin' } as any
    const fakeCtx = { plugin: otherPlugin, adapter: {}, inputNode: {}, options: {}, emitFile: vi.fn() } as any
    const fakeNode = { kind: 'Schema', name: 'Pet' } as any

    await events.emit('kubb:generate:schema', fakeNode, fakeCtx)
    expect(schemaMock).not.toHaveBeenCalled()
  })

  it('hasRegisteredGenerators() returns false before setup and true after', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({ name: 'gen', schema: vi.fn() })
        },
      },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    const driver = new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })

    expect(driver.hasRegisteredGenerators('hook-plugin')).toBe(false)
    await driver.emitSetupHooks()
    expect(driver.hasRegisteredGenerators('hook-plugin')).toBe(true)
  })

  it('registerGenerator() registers kubb:generate:operation listener', async () => {
    const operationMock = vi.fn().mockResolvedValue(undefined)
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({ name: 'test-gen', operation: operationMock })
        },
      },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    const driver = new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })
    await driver.emitSetupHooks()

    const fakePlugin = driver.plugins.get('hook-plugin')!
    const fakeCtx = { ...(driver.getContext(fakePlugin) as any), plugin: fakePlugin, adapter: {}, inputNode: {}, options: {}, emitFile: vi.fn() } as any
    const fakeNode = { kind: 'Operation', operationId: 'getPet' } as any

    await events.emit('kubb:generate:operation', fakeNode, fakeCtx)
    expect(operationMock).toHaveBeenCalledOnce()
  })

  it('registerGenerator() registers kubb:generate:operations listener', async () => {
    const operationsMock = vi.fn().mockResolvedValue(undefined)
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({ name: 'test-gen', operations: operationsMock })
        },
      },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    const driver = new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })
    await driver.emitSetupHooks()

    const fakePlugin = driver.plugins.get('hook-plugin')!
    const fakeCtx = { ...(driver.getContext(fakePlugin) as any), plugin: fakePlugin, adapter: {}, inputNode: {}, options: {}, emitFile: vi.fn() } as any
    const fakeNodes = [{ kind: 'Operation', operationId: 'getPet' }] as any

    await events.emit('kubb:generate:operations', fakeNodes, fakeCtx)
    expect(operationsMock).toHaveBeenCalledOnce()
  })

  it('registerGenerator() receives the resolved resolver on ctx.resolver', async () => {
    const capturedResolverResult = vi.fn()
    const schemaMock = vi.fn((_node, ctx) => {
      capturedResolverResult(ctx.resolver.default('pet schema', 'type'))
      return undefined
    })

    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.setResolver({
            default() {
              return 'ResolvedFromSetup'
            },
          })
          ctx.addGenerator({ name: 'test-gen', schema: schemaMock })
        },
      },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    const driver = new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })
    await driver.emitSetupHooks()

    const fakePlugin = driver.plugins.get('hook-plugin')!
    const fakeCtx = {
      ...(driver.getContext(fakePlugin) as any),
      adapter: {},
      inputNode: {},
      options: {},
      emitFile: vi.fn(),
    }
    const fakeNode = { kind: 'Schema', name: 'Pet' } as any

    await events.emit('kubb:generate:schema', fakeNode, fakeCtx)

    expect(schemaMock).toHaveBeenCalledOnce()
    expect(capturedResolverResult).toHaveBeenCalledWith('ResolvedFromSetup')
  })

  it('registerGenerator() supports arrow function generators with ctx parameter', async () => {
    const schemaMock = vi.fn((_node, ctx) => ctx.resolver.default('pet schema', 'type'))
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({ name: 'test-gen', schema: schemaMock })
        },
      },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    const driver = new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })
    await driver.emitSetupHooks()

    const fakePlugin = driver.plugins.get('hook-plugin')!
    const fakeCtx = { ...(driver.getContext(fakePlugin) as any), plugin: fakePlugin, adapter: {}, inputNode: {}, options: {}, emitFile: vi.fn() } as any
    const fakeNode = { kind: 'Schema', name: 'Pet' } as any

    await events.emit('kubb:generate:schema', fakeNode, fakeCtx)

    expect(schemaMock).toHaveBeenCalledOnce()
    expect(schemaMock.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ options: {} }))
  })

  it('registerGenerator() exposes ctx.emitFile that writes via fileManager', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({
            name: 'test-gen',
            async schema(_node, generatorCtx) {
              await generatorCtx.emitFile(
                createFile({
                  path: 'src/gen/pet.ts',
                  baseName: 'pet.ts',
                  sources: [],
                  imports: [],
                  exports: [],
                }),
              )
            },
          })
        },
      },
    }))()

    const events = new AsyncEventEmitter<KubbEvents>()
    const driver = new PluginDriver(makeConfig([hookPlugin as unknown as Plugin]), { events })
    await driver.emitSetupHooks()

    const fakePlugin = driver.plugins.get('hook-plugin')!
    const fakeCtx = {
      ...(driver.getContext(fakePlugin) as any),
      plugin: fakePlugin,
      adapter: {},
      inputNode: {},
      options: {},
      emitFile: (...files: Array<any>) => driver.fileManager.upsert(...files),
    }
    const fakeNode = { kind: 'Schema', name: 'Pet' } as any

    await events.emit('kubb:generate:schema', fakeNode, fakeCtx as any)

    expect(driver.fileManager.files.some((f) => f.baseName === 'pet.ts')).toBe(true)
  })
})
