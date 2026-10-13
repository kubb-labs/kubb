import { ast } from '@kubb/ast'
import type { OperationNode, SchemaNode } from '@kubb/ast'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, createMockedSetupContext, renderGeneratorOperation } from '@kubb/core/mocks'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { addGenerator, useKubb } from './composables.ts'
import { createKubb } from './createKubb.ts'
import { defineExtension } from './defineExtension.ts'
import { defineGenerator } from './defineGenerator.ts'
import { assertPluginOption, definePlugin, normalizeOutput } from './definePlugin.ts'
import type { OutputOptions, Output, Plugin, PluginFactoryOptions, PluginType, ResolvePluginOptions } from './definePlugin.ts'
import { Diagnostics } from './Diagnostics.ts'
import type { Resolver } from './Resolver.ts'
import { KubbDriver } from './KubbDriver.ts'
import type { Config, KubbHooks } from './types.ts'
import type { GeneratorContext } from './defineGenerator.ts'
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

/**
 * A driver with its setup hooks already run, so `kubb:plugin:setup` side effects can be observed
 * without a full build.
 */
async function setupDriver(plugins: Config['plugins'], hooks = new Hookable<KubbHooks>()): Promise<KubbDriver> {
  const driver = new KubbDriver(makeConfig({ plugins }), { hooks })
  await driver.setup()
  await driver.setupHooks()
  return driver
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

describe('defineExtension plugin', () => {
  type ObjectPlugin = PluginType<'plugin-object', { tag?: string }, { tag: string }>

  it('returns a factory with kind and meta statics that keeps the raw options on the plugin', () => {
    const meta = { name: 'plugin-object', version: '1.0.0' } as const
    const factory = defineExtension<ObjectPlugin>({
      kind: 'plugin',
      meta,
      setup: (options) => ({ tag: options.tag ?? 'all' }),
    })
    const plugin = factory({ tag: 'pets' })

    expect(factory.kind).toBe('plugin')
    expect(factory.meta).toBe(meta)
    expect(plugin).toMatchObject({ name: 'plugin-object', meta, options: { tag: 'pets' }, hooks: {} })
    expect(factory().options).toStrictEqual({})
  })

  it('infers options, resolved options, and the setup context from the type parameter', () => {
    const factory = defineExtension<ObjectPlugin>({
      kind: 'plugin',
      meta: { name: 'plugin-object' },
      setup(options, kubb) {
        expectTypeOf(options).toEqualTypeOf<{ tag?: string }>()
        expectTypeOf(kubb.setOptions).parameter(0).toEqualTypeOf<{ tag: string }>()
        return { tag: options.tag ?? 'all' }
      },
    })

    expectTypeOf(factory).parameter(0).toEqualTypeOf<{ tag?: string } | undefined>()
    expectTypeOf(factory.meta.name).toEqualTypeOf<'plugin-object'>()
    expectTypeOf(factory()).toEqualTypeOf<Plugin<ObjectPlugin>>()
    expectTypeOf<PluginType<'plugin-object', { tag?: string }>>().toExtend<PluginFactoryOptions>()
    expectTypeOf(factory()).toExtend<Config['plugins'][number]>()

    // @ts-expect-error setup must return the resolved options
    defineExtension<ObjectPlugin>({
      kind: 'plugin',
      meta: { name: 'plugin-object' },
      setup: () => ({}),
    })
    // @ts-expect-error meta.name must match the plugin name
    defineExtension<ObjectPlugin>({
      kind: 'plugin',
      meta: { name: 'plugin-other' },
    })
  })

  it('stores the value setup returns as the resolved options, then runs kubb:plugin:setup', async () => {
    const order: Array<string> = []
    const plugin = defineExtension<ObjectPlugin>({
      kind: 'plugin',
      meta: { name: 'plugin-object' },
      setup(options, kubb) {
        order.push('setup')
        expect(kubb.options).toBe(options)
        return { tag: options.tag ?? 'all' }
      },
      hooks: {
        'kubb:plugin:setup'() {
          order.push('hook')
        },
      },
    })()

    const driver = await setupDriver([plugin])
    const normalized = driver.plugins.get('plugin-object')

    expect(order).toStrictEqual(['setup', 'hook'])
    expect(normalized?.options).toMatchObject({ tag: 'all', output: { path: '.', mode: 'directory' }, exclude: [], override: [] })
    expect(plugin.options).toStrictEqual({})
  })

  it('runs composables inside setup, also after an await', async () => {
    const generator = { name: 'gen', schema: vi.fn() }
    const plugin = defineExtension<ObjectPlugin>({
      kind: 'plugin',
      meta: { name: 'plugin-object' },
      async setup(options) {
        await Promise.resolve()
        addGenerator(generator)
        return { tag: useKubb<ObjectPlugin>().options.tag ?? options.tag ?? 'all' }
      },
    })({ tag: 'pets' })

    const driver = await setupDriver([plugin])

    expect(driver.plugins.get('plugin-object')?.generators).toStrictEqual([generator])
    expect(driver.plugins.get('plugin-object')?.options).toMatchObject({ tag: 'pets' })
  })

  it('orders plugins by a dependencies record, resolving the function form from the options', async () => {
    const base = defineExtension({ kind: 'plugin', meta: { name: 'plugin-base' } })()
    const dependent = defineExtension<ObjectPlugin>({
      kind: 'plugin',
      meta: { name: 'plugin-object' },
      dependencies: (options) => ({ [options.tag ?? 'plugin-none']: {} }),
    })({ tag: 'plugin-base' })

    const driver = await setupDriver([dependent, base])

    expect([...driver.plugins.keys()]).toStrictEqual(['plugin-base', 'plugin-object'])
    expect(driver.plugins.get('plugin-object')?.dependencies).toStrictEqual({ 'plugin-base': {} })
  })

  it('throws KUBB_MISSING_DEPENDENCY for a missing required dependency and skips an optional one', async () => {
    const required = defineExtension({ kind: 'plugin', meta: { name: 'plugin-dependent' }, dependencies: { 'plugin-missing': {} } })()
    const optional = defineExtension({ kind: 'plugin', meta: { name: 'plugin-dependent' }, dependencies: { 'plugin-missing': { optional: true } } })()

    await expect(setupDriver([required])).rejects.toMatchObject({
      diagnostic: { code: Diagnostics.code.missingDependency, plugin: 'plugin-dependent' },
    })
    await expect(setupDriver([optional])).resolves.toBeInstanceOf(KubbDriver)
  })

  it('throws KUBB_INCOMPATIBLE_DEPENDENCY when a dependency version is out of range', async () => {
    const base = defineExtension({ kind: 'plugin', meta: { name: 'plugin-base', version: '1.2.0' } })()
    const dependent = defineExtension({ kind: 'plugin', meta: { name: 'plugin-dependent' }, dependencies: { 'plugin-base': { version: '^2.0.0' } } })()

    await expect(setupDriver([base, dependent])).rejects.toMatchObject({
      diagnostic: { code: Diagnostics.code.incompatibleDependency, plugin: 'plugin-dependent' },
    })
  })

  it('keeps skipping a missing dependency listed in the factory form', async () => {
    const dependent = definePlugin(() => ({ name: 'plugin-dependent', dependencies: ['plugin-missing'], hooks: {} }))()

    await expect(setupDriver([dependent])).resolves.toBeInstanceOf(KubbDriver)
  })

  it('gives the factory form kind and a meta fallback, and checks a dependency record it returns', async () => {
    const factory = definePlugin(() => ({ name: 'plugin-dependent', dependencies: { 'plugin-missing': {} }, hooks: {} }))
    const withMeta = definePlugin(() => ({ name: 'plugin-versioned', meta: { name: 'plugin-versioned', version: '2.0.0' }, hooks: {} }))

    expect(factory.kind).toBe('plugin')
    expect(factory().meta).toStrictEqual({ name: 'plugin-dependent' })
    expect(withMeta().meta).toStrictEqual({ name: 'plugin-versioned', version: '2.0.0' })
    await expect(setupDriver([factory()])).rejects.toMatchObject({ diagnostic: { code: Diagnostics.code.missingDependency } })
  })
})

describe('kubb:plugin:setup context', () => {
  it('runs the kubb:plugin:setup handler once from setupHooks instead of the hook emitter', async () => {
    const setupHandler = vi.fn()
    const hookPlugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'hook-plugin' },
      hooks: {
        'kubb:plugin:setup': setupHandler,
      },
    })()

    const hooks = new Hookable<KubbHooks>()
    await setupDriver([hookPlugin], hooks)

    expect(hooks.listenerCount('kubb:plugin:setup')).toBe(0)
    expect(setupHandler).toHaveBeenCalledOnce()
  })

  it('addGenerator() stores every generator passed as separate arguments', async () => {
    const genSchema = { name: 'gen-schema', schema: vi.fn() }
    const genOperation = { name: 'gen-operation', operation: vi.fn() }
    const genOperations = { name: 'gen-operations', operations: vi.fn() }
    const hookPlugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'hook-plugin' },
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator(genSchema, genOperation, genOperations)
        },
      },
    })()

    const driver = await setupDriver([hookPlugin])

    expect(driver.plugins.get('hook-plugin')?.generators).toStrictEqual([genSchema, genOperation, genOperations])
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

    await setupDriver([hookPlugin as unknown as Plugin])

    expect(capturedOptions[0]).toStrictEqual({ tag: 'pets' })
  })

  it('setResolver() merges partial overrides with the defaults, on getResolver() and plugin.resolver alike', async () => {
    const hookPlugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'hook-plugin' },
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.setResolver({
            name() {
              return 'CustomName'
            },
          })
        },
      },
    })()

    const driver = await setupDriver([hookPlugin])

    const resolver = driver.getResolver('hook-plugin')
    expect(resolver.name('any value')).toBe('CustomName')
    expect(
      resolver.default.path({
        baseName: 'pets.ts',
        root: '/tmp/root',
        output: { path: 'gen', mode: 'directory' },
      }),
    ).toBe('/tmp/root/gen/pets.ts')
    expect(driver.plugins.get('hook-plugin')?.resolver?.name('any value')).toBe('CustomName')
  })

  it('passes the resolver set during setup on ctx.resolver to a generator', async () => {
    const seen: Array<string> = []
    const hookPlugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'hook-plugin' },
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.setResolver({
            name() {
              return 'ResolvedFromSetup'
            },
          })
          ctx.addGenerator({
            name: 'test-gen',
            schema(_node: SchemaNode, generatorCtx: GeneratorContext) {
              seen.push(generatorCtx.resolver.name('pet schema'))
            },
          })
        },
      },
    })()
    const adapter = createMockedAdapter({
      parse: async () => ast.factory.createInput({ schemas: [ast.factory.createSchema({ type: 'object', name: 'Pet', properties: [] })] }),
    })

    const driver = new KubbDriver(makeConfig({ adapter, plugins: [hookPlugin] }), { hooks: new Hookable<KubbHooks>() })
    await driver.setup()
    await driver.run()

    expect(seen).toStrictEqual(['ResolvedFromSetup'])
  })

  it('uses default resolver when setResolver() is never called', async () => {
    const hookPlugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'hook-plugin' },
      hooks: {},
    })()

    const driver = await setupDriver([hookPlugin])

    const resolver = driver.getResolver('hook-plugin')
    expect(resolver.name('my custom type')).toBe('myCustomType')
  })

  it('setOptions() merges resolved options into the normalized plugin', async () => {
    const hookPlugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'hook-plugin' },
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.setOptions({
            output: { path: 'types' },
            enumType: 'asConst',
            syntaxType: 'type',
          })
        },
      },
    })()

    const driver = await setupDriver([hookPlugin])

    const plugin = driver.plugins.get('hook-plugin')!
    const opts = plugin.options as Record<string, unknown>
    expect(opts.enumType).toBe('asConst')
    expect(opts.syntaxType).toBe('type')
    expect(opts.output).toStrictEqual({ path: 'types', mode: 'directory' })
  })
})

describe('normalizeOutput', () => {
  // Mode is inferred from the path extension unless set, and a group always means a directory.
  it.each<[string, { output: { path: string; mode?: 'directory' | 'file' }; group?: { type: 'tag' } }, { path: string; mode: 'directory' | 'file' }]>([
    ['an extensionless path', { output: { path: 'types' } }, { path: 'types', mode: 'directory' }],
    ['a nested extensionless path', { output: { path: 'ts/models' } }, { path: 'ts/models', mode: 'directory' }],
    ['a path with an extension', { output: { path: 'models.ts' } }, { path: 'models.ts', mode: 'file' }],
    ['an explicit directory mode', { output: { path: 'types', mode: 'directory' } }, { path: 'types', mode: 'directory' }],
    ['an explicit file mode', { output: { path: 'models.ts', mode: 'file' } }, { path: 'models.ts', mode: 'file' }],
    ['a group with directory mode', { output: { path: 'clients', mode: 'directory' }, group: { type: 'tag' } }, { path: 'clients', mode: 'directory' }],
    ['a group with mode unset', { output: { path: 'clients' }, group: { type: 'tag' } }, { path: 'clients', mode: 'directory' }],
    [
      'a group with directory mode over a path that looks like a file',
      { output: { path: 'clients.v2', mode: 'directory' }, group: { type: 'tag' } },
      { path: 'clients.v2', mode: 'directory' },
    ],
  ])('returns %j for %s', (_name, options, expected) => {
    expect(normalizeOutput({ ...options, pluginName: 'plugin-ts' })).toStrictEqual(expected)
  })

  it.each<[string, { path: string; mode?: 'file' }]>([
    ['an explicit file mode', { path: 'models.ts', mode: 'file' }],
    ['a path that infers file mode', { path: 'clients.v2' }],
  ])('throws KUBB_INVALID_PLUGIN_OPTIONS for %s paired with a group', (_name, output) => {
    let thrown: unknown
    try {
      normalizeOutput({ output, group: { type: 'tag' }, pluginName: 'plugin-ts' })
    } catch (error) {
      thrown = error
    }

    expect(Diagnostics.isError(thrown)).toBe(true)
    expect(thrown).toMatchObject({ diagnostic: { code: 'KUBB_INVALID_PLUGIN_OPTIONS' }, message: expect.stringMatching(/output\.mode. to 'file'/) })
  })

  it('accepts group at the type level without spelling out mode', () => {
    expectTypeOf<{ output?: { path: string }; group?: { type: 'tag' } }>().toExtend<OutputOptions>()
  })

  it('accepts group at the type level with an explicit directory mode', () => {
    expectTypeOf<{ output: { path: string; mode: 'directory' }; group?: { type: 'tag' } }>().toExtend<OutputOptions>()
  })

  it('rejects group at the type level when mode is explicitly file', () => {
    expectTypeOf<{ output: { path: string; mode: 'file' }; group: { type: 'tag' } }>().not.toExtend<OutputOptions>()
  })
})

describe('enforce: post — plugin ordering', () => {
  it('enforce: post plugin fires after normal plugins for the same hook', async () => {
    const callOrder: Array<string> = []

    const normalPlugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'ordering-plugin' },
      hooks: {
        'kubb:plugin:setup'() {
          callOrder.push('plugin')
        },
      },
    })()

    const postPlugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'ordering-post-plugin' },
      enforce: 'post' as const,
      hooks: {
        'kubb:plugin:setup'() {
          callOrder.push('post-plugin')
        },
      },
    })()

    await createKubb(makeConfig({ plugins: [normalPlugin, postPlugin] }), { hooks: new Hookable<KubbHooks>() }).build()

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

describe('assertPluginOption', () => {
  it('accepts an allowed value', () => {
    expect(() => assertPluginOption({ plugin: 'plugin-ts', option: 'syntaxType', value: 'interface', allowed: ['type', 'interface'] })).not.toThrow()
  })

  it.each([
    ['bogus', '"bogus"'],
    [undefined, 'undefined'],
    [1, '1'],
    [1n, '1'],
  ])('throws KUBB_INVALID_PLUGIN_OPTIONS with the allowed values for %s', (value, shown) => {
    expect(() => assertPluginOption({ plugin: 'plugin-ts', option: 'syntaxType', value, allowed: ['type', 'interface'] })).toThrow(
      expect.objectContaining({
        diagnostic: expect.objectContaining({
          code: Diagnostics.code.invalidPluginOptions,
          severity: 'error',
          plugin: 'plugin-ts',
          message: `Plugin "plugin-ts" option \`syntaxType\` is ${shown}, but it must be one of "type", "interface".`,
        }),
      }),
    )
  })
})

describe('createMockedSetupContext', () => {
  it('returns a registered plugin from requirePlugin and throws the core error for a missing one', () => {
    const ctx = createMockedSetupContext({ plugins: ['plugin-ts'] })

    expect(ctx.requirePlugin('plugin-ts')).toStrictEqual({ name: 'plugin-ts' })
    expect(() => ctx.requirePlugin('plugin-zod')).toThrow('Plugin "plugin-zod" is required but not found.')
  })
})

describe('renderGeneratorOperation', () => {
  it('gives the generator a requirePlugin that finds the driver plugin and fails for a missing one', async () => {
    const plugin = createMockedPlugin({ name: 'plugin-faker', options: {} })
    const driver = createMockedPluginDriver({ plugin })
    const found: Array<unknown> = []
    const generator = defineGenerator({
      name: 'probe',
      operation(_node, ctx) {
        found.push(ctx.requirePlugin('plugin-ts'))
        return null
      },
    })
    const render = () =>
      renderGeneratorOperation(generator, {} as OperationNode, {
        config: driver.config,
        adapter: createMockedAdapter(),
        driver,
        plugin,
        options: {},
        resolver: {} as Resolver,
      })

    await render()
    expect(found).toStrictEqual([plugin])

    driver.getPlugin = () => undefined
    await expect(render()).rejects.toThrow('Plugin "plugin-ts" is required by "plugin-faker" but not found.')
  })
})
