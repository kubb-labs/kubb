import { AsyncEventEmitter } from '@internals/utils'
import type { OperationNode, SchemaNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, it, vi } from 'vitest'
import { definePlugin, normalizeOutput } from './definePlugin.ts'
import { Diagnostics } from './diagnostics.ts'
import { KubbDriver } from './KubbDriver.ts'
import type { Config, GeneratorContext, KubbHooks, KubbPluginSetupContext, Plugin, PluginFactoryOptions } from './types.ts'
import { fsStorage } from './storages/fsStorage.ts'

type TestPluginOptions = PluginFactoryOptions<string, { tag: string }>
type TestPluginOptionalOptions = PluginFactoryOptions<string, { tag?: string }>

/**
 * Builds a stub `kubb:plugin:setup` context with no-op methods.
 * Used by tests that emit the hook directly without a full driver.
 */
function createSetupCtxStub(config: Config): KubbPluginSetupContext {
  return {
    config,
    addGenerator: () => {},
    setResolver: () => {},
    setTransformer: () => {},
    setRenderer: () => {},
    setOptions: () => {},
    injectFile: () => {},
    updateConfig: () => {},
    options: {},
  } as unknown as KubbPluginSetupContext
}

describe('definePlugin', () => {
  it('creates a valid hook-style plugin with `hooks:` property', () => {
    const plugin = definePlugin<TestPluginOptions>((options) => ({
      name: 'my-hook-plugin',
      options,
      hooks: {
        'kubb:plugin:setup'(_ctx) {},
      },
    }))({ tag: 'pets' })

    expect(plugin.name).toBe('my-hook-plugin')
    expect(plugin.options).toStrictEqual({ tag: 'pets' })
    expect(typeof plugin.hooks['kubb:plugin:setup']).toBe('function')
  })

  it('uses empty object as default options when none are provided', () => {
    const factory = definePlugin<TestPluginOptionalOptions>((options) => ({
      name: 'my-plugin',
      options,
      hooks: {},
    }))
    const plugin = factory()
    expect(plugin.options).toStrictEqual({})
  })
})

describe('PluginDriver — hook-style plugin registration', () => {
  function makeConfig(plugins: Config['plugins']): Config {
    return {
      root: '.',
      input: { path: './petStore.yaml' },
      output: { path: './src/gen', clean: true },
      parsers: [],
      reporters: [],
      adapter: createMockedAdapter(),
      storage: fsStorage(),
      plugins,
    }
  }

  it('registers a hook-style plugin in the plugins map', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {},
    }))()

    const driver = new KubbDriver(makeConfig([hookPlugin]), {
      hooks: new AsyncEventEmitter<KubbHooks>(),
    })
    await driver.setup()

    expect(driver.plugins.has('hook-plugin')).toBe(true)
  })

  it('registers kubb:plugin:setup handler on the event emitter', async () => {
    const setupHandler = vi.fn()
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup': setupHandler,
      },
    }))()

    const events = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), { hooks: events })
    await driver.setup()

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

    const hooks = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), { hooks })
    await driver.setup()

    await hooks.emit('kubb:plugin:setup', createSetupCtxStub(makeConfig([])))
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

    const hooks = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), { hooks })
    await driver.setup()

    // Before emit — no generators yet
    expect(driver.hasEventGenerators('hook-plugin')).toBe(false)

    await driver.emitSetupHooks()

    // After emit — generator is registered via the event-based path
    expect(driver.hasEventGenerators('hook-plugin')).toBe(true)
    // Generators registered via addGenerator() do NOT populate plugin.generators —
    // they are wired as listeners on kubb:generate:* events instead.
    expect(driver.plugins.get('hook-plugin')?.generators ?? []).toHaveLength(0)
  })

  it('options passed to definePlugin are forwarded via ctx.options', async () => {
    const capturedOptions: Array<unknown> = []
    const hookPlugin = definePlugin<TestPluginOptions>((options) => ({
      name: 'hook-plugin',
      options,
      hooks: {
        'kubb:plugin:setup'(ctx) {
          capturedOptions.push(ctx.options)
        },
      },
    }))({ tag: 'pets' })

    const events = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin as unknown as Plugin]), {
      hooks: events,
    })
    await driver.setup()

    await events.emit('kubb:plugin:setup', createSetupCtxStub(makeConfig([])))

    expect(capturedOptions[0]).toStrictEqual({ tag: 'pets' })
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

    const events = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), {
      hooks: events,
    })
    await driver.setup()
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

  it('setResolver() mirrors resolver onto plugin.resolver for getPlugin() consumers', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.setResolver({
            default() {
              return 'FromPlugin'
            },
          })
        },
      },
    }))()

    const events = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), {
      hooks: events,
    })
    await driver.setup()
    await driver.emitSetupHooks()

    const plugin = driver.plugins.get('hook-plugin')!
    expect(plugin.resolver).toBeDefined()
    expect(plugin.resolver!.default('test', 'type')).toBe('FromPlugin')
  })

  it('uses default resolver when setResolver() is never called', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {},
    }))()

    const events = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), {
      hooks: events,
    })
    await driver.setup()

    const resolver = driver.getResolver('hook-plugin')
    expect(resolver.default('my custom type', 'type')).toBe('MyCustomType')
  })

  it('setOptions() merges resolved options into the normalized plugin', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.setOptions({
            output: { path: 'types' },
            enumType: 'asConst',
            syntaxType: 'type',
          })
        },
      },
    }))()

    const events = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), {
      hooks: events,
    })
    await driver.setup()
    await driver.emitSetupHooks()

    const plugin = driver.plugins.get('hook-plugin')!
    const opts = plugin.options as Record<string, unknown>
    expect(opts.enumType).toBe('asConst')
    expect(opts.syntaxType).toBe('type')
    expect(opts.output).toStrictEqual({ path: 'types', mode: 'directory' })
  })

  it('external listeners receive kubb:plugin:setup context', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: { 'kubb:plugin:setup'() {} },
    }))()

    const events = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), { hooks: events })
    await driver.setup()

    const externalListener = vi.fn()
    events.on('kubb:plugin:setup', externalListener)

    const ctx = createSetupCtxStub(makeConfig([]))
    await events.emit('kubb:plugin:setup', ctx)

    expect(externalListener).toHaveBeenCalledWith(ctx)
  })
})

describe('PluginDriver — generator event dispatch', () => {
  function makeConfig(plugins: Config['plugins']): Config {
    return {
      root: '.',
      input: { path: './petStore.yaml' },
      output: { path: './src/gen', clean: true },
      parsers: [],
      reporters: [],
      storage: fsStorage(),
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

    const events = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), {
      hooks: events,
    })
    await driver.setup()
    await driver.emitSetupHooks()

    const fakePlugin = driver.plugins.get('hook-plugin')!
    const fakeCtx = {
      plugin: fakePlugin,
      adapter: {},
    } as unknown as GeneratorContext
    const fakeNode = { kind: 'Schema', name: 'Pet' } as unknown as SchemaNode

    await events.emit('kubb:generate:schema', fakeNode, {
      ...fakeCtx,
      options: {},
    })
    expect(schemaMock).toHaveBeenCalledOnce()
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

    const events = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), {
      hooks: events,
    })
    await driver.setup()
    await driver.emitSetupHooks()

    // Emit with a DIFFERENT plugin name in the context — should NOT trigger the listener
    const otherPlugin = { name: 'other-plugin' } as unknown as Plugin
    const fakeCtx = {
      plugin: otherPlugin,
      adapter: {},
    } as unknown as GeneratorContext
    const fakeNode = { kind: 'Schema', name: 'Pet' } as unknown as SchemaNode

    await events.emit('kubb:generate:schema', fakeNode, {
      ...fakeCtx,
      options: {},
    })
    expect(schemaMock).not.toHaveBeenCalled()
  })

  it('hasEventGenerators() returns false before setup and true after', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({ name: 'gen', schema: vi.fn() })
        },
      },
    }))()

    const events = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), {
      hooks: events,
    })
    await driver.setup()

    expect(driver.hasEventGenerators('hook-plugin')).toBe(false)
    await driver.emitSetupHooks()
    expect(driver.hasEventGenerators('hook-plugin')).toBe(true)
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

    const events = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), {
      hooks: events,
    })
    await driver.setup()
    await driver.emitSetupHooks()

    const fakePlugin = driver.plugins.get('hook-plugin')!
    const fakeCtx = {
      plugin: fakePlugin,
      adapter: {},
    } as unknown as GeneratorContext
    const fakeNode = {
      kind: 'Operation',
      operationId: 'getPet',
    } as unknown as OperationNode

    await events.emit('kubb:generate:operation', fakeNode, {
      ...fakeCtx,
      options: {},
    })
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

    const events = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), {
      hooks: events,
    })
    await driver.setup()
    await driver.emitSetupHooks()

    const fakePlugin = driver.plugins.get('hook-plugin')!
    const fakeCtx = {
      plugin: fakePlugin,
      adapter: {},
      options: {},
    } as unknown as GeneratorContext
    const fakeNodes = [{ kind: 'Operation', operationId: 'getPet' }] as unknown as Array<OperationNode>

    await events.emit('kubb:generate:operations', fakeNodes, fakeCtx)
    expect(operationsMock).toHaveBeenCalledOnce()
  })

  it('registerGenerator() receives the resolved resolver on ctx.resolver', async () => {
    const capturedResolverResult = vi.fn()
    const schemaMock = vi.fn(function (_node: SchemaNode, ctx: GeneratorContext) {
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

    const events = new AsyncEventEmitter<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), {
      hooks: events,
    })
    await driver.setup()
    await driver.emitSetupHooks()

    const fakePlugin = driver.plugins.get('hook-plugin')!
    const fakeCtx = {
      ...driver.getContext(fakePlugin),
      adapter: {},
    } as unknown as GeneratorContext
    const fakeNode = { kind: 'Schema', name: 'Pet' } as unknown as SchemaNode

    await events.emit('kubb:generate:schema', fakeNode, {
      ...fakeCtx,
      options: {} as unknown as GeneratorContext['options'],
    })

    expect(schemaMock).toHaveBeenCalledOnce()
    expect(capturedResolverResult).toHaveBeenCalledWith('ResolvedFromSetup')
  })
})

describe('normalizeOutput', () => {
  it('defaults mode to directory', () => {
    const result = normalizeOutput({ output: { path: 'types' }, pluginName: 'plugin-ts' })

    expect(result).toStrictEqual({ path: 'types', mode: 'directory' })
  })

  it('keeps an explicit directory mode', () => {
    const result = normalizeOutput({ output: { path: 'types', mode: 'directory' }, pluginName: 'plugin-ts' })

    expect(result.mode).toBe('directory')
  })

  it('keeps an explicit file mode with its path as-is', () => {
    const result = normalizeOutput({ output: { path: 'models.ts', mode: 'file' }, pluginName: 'plugin-ts' })

    expect(result).toStrictEqual({ path: 'models.ts', mode: 'file' })
  })

  it('passes through directory mode when a group is configured', () => {
    const result = normalizeOutput({ output: { path: 'clients', mode: 'directory' }, group: { type: 'tag' }, pluginName: 'plugin-client' })

    expect(result).toStrictEqual({ path: 'clients', mode: 'directory' })
  })

  it('throws KUBB_INVALID_PLUGIN_OPTIONS for file mode paired with a group', () => {
    expect(() => normalizeOutput({ output: { path: 'models.ts', mode: 'file' }, group: { type: 'tag' }, pluginName: 'plugin-ts' })).toThrowError(
      /output\.mode: 'file'/,
    )
  })

  it('throws a Diagnostics error when file mode is paired with a group', () => {
    let thrown: unknown
    try {
      normalizeOutput({ output: { path: 'models.ts', mode: 'file' }, group: { type: 'tag' }, pluginName: 'plugin-ts' })
    } catch (error) {
      thrown = error
    }

    expect(Diagnostics.isError(thrown)).toBe(true)
    expect((thrown as InstanceType<typeof Diagnostics.Error>).diagnostic.code).toBe('KUBB_INVALID_PLUGIN_OPTIONS')
  })
})
