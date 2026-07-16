import { ast } from '@kubb/ast'
import type { OperationNode, SchemaNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { createKubb } from './createKubb.ts'
import { definePlugin, normalizeOutput } from './definePlugin.ts'
import { Diagnostics } from './Diagnostics.ts'
import { KubbDriver } from './KubbDriver.ts'
import type { Config, GeneratorContext, KubbHooks, KubbPluginSetupContext, Output, Plugin, PluginFactoryOptions, ResolvePluginOptions } from './types.ts'
import { fsStorage } from './storages/fsStorage.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import { Hookable } from './Hookable.ts'

// ---------------------------------------------------------------------------
// Module-level declare global augmentations used by the type tests below.
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
    interface PluginRegistry {
      /**
       * Test-only entry: verifies that registered names drive `getPlugin`,
       * `requirePlugin`, `getResolver`, and `dependencies` typing.
       */
      'plugin-registered': TestPluginOptions
    }
  }
}

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
    addMacro: () => {},
    setMacros: () => {},
    setRenderer: () => {},
    setOptions: () => {},
    injectFile: () => {},
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
      input: './petStore.yaml',
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
      hooks: new Hookable<KubbHooks>(),
    })
    await driver.setup()

    expect(driver.plugins.has('hook-plugin')).toBe(true)
  })

  it('does not register kubb:plugin:setup on the hook emitter', async () => {
    const setupHandler = vi.fn()
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup': setupHandler,
      },
    }))()

    const hooks = new Hookable<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), { hooks })
    await driver.setup()

    expect(hooks.listenerCount('kubb:plugin:setup')).toBe(0)
  })

  it('runs the kubb:plugin:setup handler on setupHooks', async () => {
    const setupHandler = vi.fn()
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup': setupHandler,
      },
    }))()

    const hooks = new Hookable<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), { hooks })
    await driver.setup()

    await driver.setupHooks()
    expect(setupHandler).toHaveBeenCalledOnce()
  })

  it('addGenerator() stores generators on the plugin for direct dispatch', async () => {
    const generator = { name: 'my-gen', schema: vi.fn() }
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator(generator)
        },
      },
    }))()

    const hooks = new Hookable<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), { hooks })
    await driver.setup()

    // Before setup hooks — no generators yet
    expect(driver.hasHookGenerators('hook-plugin')).toBe(false)

    await driver.setupHooks()

    // After setup hooks — the generator lives on its plugin. The generate loop calls it directly,
    // so it is never wired as a kubb:generate:* listener.
    expect(driver.hasHookGenerators('hook-plugin')).toBe(true)
    expect(driver.plugins.get('hook-plugin')?.generators).toStrictEqual([generator])
    expect(hooks.listenerCount('kubb:generate:schema')).toBe(0)
  })

  it('addGenerator() stores every generator passed as separate arguments', async () => {
    const genSchema = { name: 'gen-schema', schema: vi.fn() }
    const genOperation = { name: 'gen-operation', operation: vi.fn() }
    const genOperations = { name: 'gen-operations', operations: vi.fn() }
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator(genSchema, genOperation, genOperations)
        },
      },
    }))()

    const hooks = new Hookable<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), { hooks })
    await driver.setup()

    await driver.setupHooks()

    expect(driver.hasHookGenerators('hook-plugin')).toBe(true)
    expect(driver.plugins.get('hook-plugin')?.generators).toStrictEqual([genSchema, genOperation, genOperations])
    // Generators are called directly, not registered as hook listeners.
    expect(hooks.listenerCount('kubb:generate:schema')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:operation')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:operations')).toBe(0)
  })

  it('addGenerator() stores a spread list so an existing array can be passed in one call', async () => {
    const generators = [
      { name: 'gen-schema', schema: vi.fn() },
      { name: 'gen-operation', operation: vi.fn() },
    ]
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator(...generators)
        },
      },
    }))()

    const hooks = new Hookable<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), { hooks })
    await driver.setup()

    await driver.setupHooks()

    expect(driver.hasHookGenerators('hook-plugin')).toBe(true)
    expect(driver.plugins.get('hook-plugin')?.generators).toStrictEqual(generators)
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

    const hooks = new Hookable<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin as unknown as Plugin]), {
      hooks,
    })
    await driver.setup()

    await driver.setupHooks()

    expect(capturedOptions[0]).toStrictEqual({ tag: 'pets' })
  })

  it('setResolver() merges partial resolver overrides with framework defaults', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.setResolver({
            name() {
              return 'CustomName'
            },
          })
        },
      },
    }))()

    const hooks = new Hookable<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), {
      hooks,
    })
    await driver.setup()
    await driver.setupHooks()

    const resolver = driver.getResolver('hook-plugin')
    expect(resolver.name('any value')).toBe('CustomName')
    expect(
      resolver.default.path({
        baseName: 'pets.ts',
        root: '/tmp/root',
        output: { path: 'gen', mode: 'directory' },
      }),
    ).toBe('/tmp/root/gen/pets.ts')
  })

  it('setResolver() mirrors resolver onto plugin.resolver for getPlugin() consumers', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.setResolver({
            name() {
              return 'FromPlugin'
            },
          })
        },
      },
    }))()

    const hooks = new Hookable<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), {
      hooks,
    })
    await driver.setup()
    await driver.setupHooks()

    const plugin = driver.plugins.get('hook-plugin')!
    expect(plugin.resolver).toBeDefined()
    expect(plugin.resolver!.name('test')).toBe('FromPlugin')
  })

  it('uses default resolver when setResolver() is never called', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {},
    }))()

    const hooks = new Hookable<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), {
      hooks,
    })
    await driver.setup()

    const resolver = driver.getResolver('hook-plugin')
    expect(resolver.name('my custom type')).toBe('myCustomType')
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

    const hooks = new Hookable<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), {
      hooks,
    })
    await driver.setup()
    await driver.setupHooks()

    const plugin = driver.plugins.get('hook-plugin')!
    const opts = plugin.options as Record<string, unknown>
    expect(opts.enumType).toBe('asConst')
    expect(opts.syntaxType).toBe('type')
    expect(opts.output).toStrictEqual({ path: 'types', mode: 'file' })
  })

  it('external listeners receive kubb:plugin:setup context', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: { 'kubb:plugin:setup'() {} },
    }))()

    const hooks = new Hookable<KubbHooks>()
    const driver = new KubbDriver(makeConfig([hookPlugin]), { hooks })
    await driver.setup()

    const externalListener = vi.fn()
    hooks.hook('kubb:plugin:setup', externalListener)

    const ctx = createSetupCtxStub(makeConfig([]))
    await hooks.callHook('kubb:plugin:setup', ctx)

    expect(externalListener).toHaveBeenCalledWith(ctx)
  })
})

describe('PluginDriver — generator dispatch', () => {
  function populatedAdapter() {
    return createMockedAdapter({
      parse: async () =>
        ast.factory.createInput({
          schemas: [ast.factory.createSchema({ type: 'object', name: 'Pet', properties: [] })],
          operations: [ast.factory.createOperation({ operationId: 'getPet', method: 'GET', path: '/pet' })],
        }),
    })
  }

  function makeConfig(plugins: Config['plugins']): Config {
    return {
      root: '.',
      input: './petStore.yaml',
      output: { path: './src/gen', clean: true },
      parsers: [],
      reporters: [],
      storage: memoryStorage(),
      adapter: populatedAdapter(),
      plugins,
    }
  }

  it('calls a plugin schema generator for each schema node during run()', async () => {
    const schemaMock = vi.fn().mockResolvedValue(undefined)
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({ name: 'test-gen', schema: schemaMock })
        },
      },
    }))()

    const driver = new KubbDriver(makeConfig([hookPlugin]), { hooks: new Hookable<KubbHooks>() })
    await driver.setup()
    await driver.run()

    expect(schemaMock).toHaveBeenCalledOnce()
    const [node, ctx] = schemaMock.mock.calls[0] as [SchemaNode, GeneratorContext]
    expect(node.name).toBe('Pet')
    expect(ctx.plugin.name).toBe('hook-plugin')
  })

  it('only calls a plugin generator with its own plugin context (no cross-fire)', async () => {
    const schemaA = vi.fn().mockResolvedValue(undefined)
    const schemaB = vi.fn().mockResolvedValue(undefined)
    const pluginA = definePlugin(() => ({
      name: 'plugin-a',
      hooks: { 'kubb:plugin:setup'(ctx) { ctx.addGenerator({ name: 'gen-a', schema: schemaA }) } },
    }))()
    const pluginB = definePlugin(() => ({
      name: 'plugin-b',
      hooks: { 'kubb:plugin:setup'(ctx) { ctx.addGenerator({ name: 'gen-b', schema: schemaB }) } },
    }))()

    const driver = new KubbDriver(makeConfig([pluginA, pluginB]), { hooks: new Hookable<KubbHooks>() })
    await driver.setup()
    await driver.run()

    expect(schemaA).toHaveBeenCalledOnce()
    expect(schemaB).toHaveBeenCalledOnce()
    const [, ctxA] = schemaA.mock.calls[0] as [SchemaNode, GeneratorContext]
    const [, ctxB] = schemaB.mock.calls[0] as [SchemaNode, GeneratorContext]
    expect(ctxA.plugin.name).toBe('plugin-a')
    expect(ctxB.plugin.name).toBe('plugin-b')
  })

  it('hasHookGenerators() returns false before setup and true after', async () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({ name: 'gen', schema: vi.fn() })
        },
      },
    }))()

    const driver = new KubbDriver(makeConfig([hookPlugin]), { hooks: new Hookable<KubbHooks>() })
    await driver.setup()

    expect(driver.hasHookGenerators('hook-plugin')).toBe(false)
    await driver.setupHooks()
    expect(driver.hasHookGenerators('hook-plugin')).toBe(true)
  })

  it('calls a plugin operation generator for each operation node during run()', async () => {
    const operationMock = vi.fn().mockResolvedValue(undefined)
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({ name: 'test-gen', operation: operationMock })
        },
      },
    }))()

    const driver = new KubbDriver(makeConfig([hookPlugin]), { hooks: new Hookable<KubbHooks>() })
    await driver.setup()
    await driver.run()

    expect(operationMock).toHaveBeenCalledOnce()
    const [operationNode] = operationMock.mock.calls[0] as [OperationNode, GeneratorContext]
    expect(operationNode.operationId).toBe('getPet')
  })

  it('calls a plugin operations generator once with the collected operations', async () => {
    const operationsMock = vi.fn().mockResolvedValue(undefined)
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({ name: 'test-gen', operations: operationsMock })
        },
      },
    }))()

    const driver = new KubbDriver(makeConfig([hookPlugin]), { hooks: new Hookable<KubbHooks>() })
    await driver.setup()
    await driver.run()

    expect(operationsMock).toHaveBeenCalledOnce()
    const [nodes] = operationsMock.mock.calls[0] as [Array<OperationNode>, GeneratorContext]
    expect(nodes.map((node) => node.operationId)).toStrictEqual(['getPet'])
  })

  it('passes the resolved resolver on ctx.resolver to a generator', async () => {
    const capturedResolverResult = vi.fn()
    const schemaMock = vi.fn(function (_node: SchemaNode, ctx: GeneratorContext) {
      capturedResolverResult(ctx.resolver.name('pet schema'))
      return undefined
    })

    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.setResolver({
            name() {
              return 'ResolvedFromSetup'
            },
          })
          ctx.addGenerator({ name: 'test-gen', schema: schemaMock })
        },
      },
    }))()

    const driver = new KubbDriver(makeConfig([hookPlugin]), { hooks: new Hookable<KubbHooks>() })
    await driver.setup()
    await driver.run()

    expect(schemaMock).toHaveBeenCalledOnce()
    expect(capturedResolverResult).toHaveBeenCalledWith('ResolvedFromSetup')
  })
})

describe('normalizeOutput', () => {
  it('defaults mode to file', () => {
    const result = normalizeOutput({ output: { path: 'types' }, pluginName: 'plugin-ts' })

    expect(result).toStrictEqual({ path: 'types', mode: 'file' })
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
    const result = normalizeOutput({ output: { path: 'clients', mode: 'directory' }, group: { type: 'tag' }, pluginName: 'plugin-axios' })

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

describe('enforce: post — plugin ordering', () => {
  function makeConfig(overrides: Partial<Config> = {}): Config {
    return {
      root: '.',
      input: './petStore.yaml',
      output: { path: './src/gen', clean: true },
      parsers: [],
      reporters: [],
      adapter: createMockedAdapter(),
      plugins: [],
      ...overrides,
    } as Config
  }

  it('enforce: post plugin fires after normal plugins for the same hook', async () => {
    const callOrder: Array<string> = []

    const normalPlugin = definePlugin(() => ({
      name: 'ordering-plugin',
      hooks: {
        'kubb:plugin:setup'() {
          callOrder.push('plugin')
        },
      },
    }))()

    const postPlugin = definePlugin(() => ({
      name: 'ordering-post-plugin',
      enforce: 'post' as const,
      hooks: {
        'kubb:plugin:setup'() {
          callOrder.push('post-plugin')
        },
      },
    }))()

    await createKubb(
      makeConfig({
        plugins: [normalPlugin, postPlugin] as unknown as Array<Plugin>,
      }),
      { hooks: new Hookable<KubbHooks>() },
    ).build()

    const pluginIdx = callOrder.indexOf('plugin')
    const postPluginIdx = callOrder.indexOf('post-plugin')
    expect(pluginIdx).toBeGreaterThanOrEqual(0)
    expect(postPluginIdx).toBeGreaterThanOrEqual(0)
    expect(postPluginIdx).toBeGreaterThan(pluginIdx)
  })
})

describe('declare global augmentation', () => {
  it('ConfigOptionsRegistry: augmented output field is present on Config["output"]', () => {
    expectTypeOf<Config['output']>().toHaveProperty('_testConfigField')
    expectTypeOf<Config['output']['_testConfigField']>().toEqualTypeOf<string | undefined>()

    const output = { path: './src/gen' } satisfies Config['output']
    const withField = { path: './src/gen', _testConfigField: 'hello' } satisfies Config['output']

    expect(output).toBeDefined()
    expect(withField._testConfigField).toBe('hello')
  })

  it('PluginOptionsRegistry: augmented output field is present on per-plugin Output', () => {
    expectTypeOf<Output>().toHaveProperty('_testPluginField')
    expectTypeOf<Output['_testPluginField']>().toEqualTypeOf<number | undefined>()

    const pluginOutput = { path: './src/gen', _testPluginField: 42 } satisfies Output

    expect(pluginOutput._testPluginField).toBe(42)
  })

  it('PluginRegistry: registered names type getPlugin/requirePlugin/getResolver return values', () => {
    // Uncalled: tsc validates the assertions, the body never runs.
    function _returns(ctx: GeneratorContext) {
      expectTypeOf(ctx.getPlugin('plugin-registered')).toEqualTypeOf<Plugin<TestPluginOptions> | undefined>()
      expectTypeOf(ctx.requirePlugin('plugin-registered')).toEqualTypeOf<Plugin<TestPluginOptions>>()
      // An unregistered name still resolves, falling back to the generic options.
      expectTypeOf(ctx.getPlugin('not-registered')).toEqualTypeOf<Plugin<PluginFactoryOptions> | undefined>()
      expectTypeOf(ctx.getResolver('plugin-registered')).toEqualTypeOf<ResolvePluginOptions<'plugin-registered'>['resolver']>()
    }

    expect(_returns).toBeTypeOf('function')
  })

  it('PluginRegistry: dependencies autocomplete registered names and still accept any string', () => {
    const registered = { name: 'plugin-consumer', dependencies: ['plugin-registered'], hooks: {} } satisfies Plugin
    const arbitrary = { name: 'plugin-consumer', dependencies: ['some-unregistered-plugin'], hooks: {} } satisfies Plugin

    expect(registered.dependencies).toStrictEqual(['plugin-registered'])
    expect(arbitrary.dependencies).toStrictEqual(['some-unregistered-plugin'])
  })
})
