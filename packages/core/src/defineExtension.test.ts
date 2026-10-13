import { ast } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { version } from '../package.json'
import { addGenerator, useKubb } from './composables.ts'
import { createAdapter } from './createAdapter.ts'
import type { Adapter, AdapterFactoryOptions } from './createAdapter.ts'
import { checkCompatibility, checkDependencies, createExtensionFactory, defineExtension, resolveMeta } from './defineExtension.ts'
import { defineParser } from './defineParser.ts'
import type { Parser } from './defineParser.ts'
import { definePlugin } from './definePlugin.ts'
import type { Plugin, PluginFactoryOptions, PluginType } from './definePlugin.ts'
import { Diagnostics } from './Diagnostics.ts'
import { Hookable } from './Hookable.ts'
import { KubbDriver } from './KubbDriver.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import type { Config, KubbHooks } from './types.ts'

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

describe('resolveMeta', () => {
  it('returns meta, or { name } for an extension that only sets name', () => {
    expect(resolveMeta({ meta: { name: 'plugin-a' } })).toEqual({ name: 'plugin-a' })
    expect(resolveMeta({ name: 'plugin-b' })).toEqual({ name: 'plugin-b' })
  })

  it('throws KUBB_INVALID_PLUGIN_OPTIONS when there is neither', () => {
    expect(() => resolveMeta({})).toThrow(expect.objectContaining({ diagnostic: expect.objectContaining({ code: Diagnostics.code.invalidPluginOptions }) }))
  })
})

describe('checkCompatibility', () => {
  it('passes when no range is set or the running versions match', () => {
    expect(() => checkCompatibility({ name: 'plugin-a' })).not.toThrow()
    expect(() => checkCompatibility({ name: 'plugin-a', compatibility: { kubb: `>=${version}`, node: '>=18' } })).not.toThrow()
  })

  it('throws KUBB_INCOMPATIBLE_EXTENSION for a Kubb range the running core does not satisfy', () => {
    expect(() => checkCompatibility({ name: 'plugin-a', compatibility: { kubb: '>=99' } })).toThrow(
      expect.objectContaining({
        diagnostic: expect.objectContaining({
          code: Diagnostics.code.incompatibleExtension,
          plugin: 'plugin-a',
          message: `"plugin-a" requires Kubb >=99, but ${version} is running.`,
        }),
      }),
    )
  })

  it('throws KUBB_INCOMPATIBLE_EXTENSION for a Node.js range the running process does not satisfy', () => {
    expect(() => checkCompatibility({ name: 'plugin-a', compatibility: { node: '<1' } })).toThrow(
      expect.objectContaining({ diagnostic: expect.objectContaining({ code: Diagnostics.code.incompatibleExtension }) }),
    )
  })
})

describe('checkDependencies', () => {
  const plugins = new Map([
    ['plugin-versioned', { meta: { name: 'plugin-versioned', version: '2.1.0' } }],
    ['plugin-unversioned', {}],
  ])

  it('ignores the array form, even for a missing plugin', () => {
    expect(() => checkDependencies({ name: 'plugin-a', dependencies: ['plugin-missing'], plugins })).not.toThrow()
  })

  it('passes for an in-range version, an unversioned dependency, and a missing optional one', () => {
    const dependencies = {
      'plugin-versioned': { version: '^2.0.0' },
      'plugin-unversioned': { version: '^9.0.0' },
      'plugin-missing': { optional: true },
    }

    expect(() => checkDependencies({ name: 'plugin-a', dependencies, plugins })).not.toThrow()
  })

  it('throws KUBB_MISSING_DEPENDENCY for a missing required plugin', () => {
    expect(() => checkDependencies({ name: 'plugin-a', dependencies: { 'plugin-missing': {} }, plugins })).toThrow(
      expect.objectContaining({ diagnostic: expect.objectContaining({ code: Diagnostics.code.missingDependency, plugin: 'plugin-a' }) }),
    )
  })

  it('throws KUBB_INCOMPATIBLE_DEPENDENCY for an out-of-range version, also when optional', () => {
    expect(() => checkDependencies({ name: 'plugin-a', dependencies: { 'plugin-versioned': { version: '^3.0.0', optional: true } }, plugins })).toThrow(
      expect.objectContaining({ diagnostic: expect.objectContaining({ code: Diagnostics.code.incompatibleDependency, plugin: 'plugin-a' }) }),
    )
  })
})

describe('createExtensionFactory', () => {
  it('builds a factory with kind and meta statics that passes {} when called without options', () => {
    const factory = createExtensionFactory({ kind: 'parser', meta: { name: 'json' }, build: (options: { pretty?: boolean }) => options })

    expect(factory.kind).toBe('parser')
    expect(factory.meta).toStrictEqual({ name: 'json' })
    expect(factory()).toStrictEqual({})
    expect(factory({ pretty: true })).toStrictEqual({ pretty: true })
  })
})

describe('defineExtension', () => {
  it('keeps the literal extNames of a parser whose build takes no options', () => {
    const parser = defineExtension({
      kind: 'parser',
      meta: { name: 'text' },
      build() {
        return { extNames: ['.txt'], parse: () => '', print: () => '' }
      },
    })()

    expect(parser.extNames).toStrictEqual(['.txt'])
  })

  it('rejects a definition whose fields belong to another kind', () => {
    // @ts-expect-error a plugin has no `build`
    defineExtension({ kind: 'plugin', meta: { name: 'plugin-text' }, build: () => ({}) })
    // @ts-expect-error an adapter needs `build`
    defineExtension({ kind: 'adapter', meta: { name: 'text' } })
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
})

const parserJson = defineExtension<{ pretty?: boolean }, object, string>({
  kind: 'parser',
  meta: { name: 'json', version: '1.0.0' },
  build(options) {
    return {
      extNames: ['.json'],
      parse: () => (options.pretty ? 'pretty' : 'compact'),
      print: (...nodes) => nodes.join('\n'),
    }
  },
})

describe('defineExtension parser', () => {
  it('returns a factory with kind and meta statics that passes the options to build', () => {
    const parser = parserJson({ pretty: true })

    expect(parserJson.kind).toBe('parser')
    expect(parserJson.meta).toStrictEqual({ name: 'json', version: '1.0.0' })
    expect(parser).toMatchObject({ name: 'json', meta: { name: 'json' }, extNames: ['.json'] })
    expect(parser.parse({} as never)).toBe('pretty')
    expect(parserJson().parse({} as never)).toBe('compact')
    expect(parser.options).toStrictEqual({ pretty: true })
    expectTypeOf(parser).toEqualTypeOf<Parser<object, string, { pretty?: boolean }>>()
  })

  it('throws KUBB_INCOMPATIBLE_EXTENSION from KubbDriver.setup when a parser requires a newer Kubb', async () => {
    const future = defineExtension({
      kind: 'parser',
      meta: { name: 'future', compatibility: { kubb: '>=99' } },
      build: () => ({ extNames: undefined, parse: () => '', print: () => '' }),
    })
    const driver = new KubbDriver(makeConfig({ parsers: [future()] }), { hooks: new Hookable<KubbHooks>() })

    await expect(driver.setup()).rejects.toMatchObject({ diagnostic: { code: Diagnostics.code.incompatibleExtension, plugin: 'future' } })
  })
})

type TextAdapter = AdapterFactoryOptions<'text', { strict?: boolean }, { strict: boolean; mode: 'strict' | 'loose' }, string>

const adapterText = defineExtension<TextAdapter>({
  kind: 'adapter',
  meta: { name: 'text', version: '1.0.0' },
  setup: ({ strict = true }) => ({ strict, mode: strict ? 'strict' : 'loose' }),
  build(options) {
    let document: string | null = null
    return {
      get document() {
        return document
      },
      async parse() {
        document = options.mode
        return ast.factory.createInput()
      },
      async validate() {},
    }
  },
})

describe('defineExtension adapter', () => {
  it('returns a factory with kind and meta statics', () => {
    expect(adapterText.kind).toBe('adapter')
    expect(adapterText.meta).toStrictEqual({ name: 'text', version: '1.0.0' })
    expectTypeOf(adapterText).parameter(0).toEqualTypeOf<{ strict?: boolean } | undefined>()
    expectTypeOf(adapterText()).toEqualTypeOf<Adapter<TextAdapter>>()
  })

  it('resolves the options with setup and exposes the resolved options', () => {
    const adapter = adapterText({ strict: false })

    expect(adapter).toMatchObject({ name: 'text', meta: { name: 'text' }, options: { strict: false, mode: 'loose' } })
    expect(adapterText().options).toStrictEqual({ strict: true, mode: 'strict' })
  })

  it('keeps getters on the built adapter live', async () => {
    const adapter = adapterText()

    expect(adapter.document).toBeNull()
    await adapter.parse({ type: 'data', data: '' })
    expect(adapter.document).toBe('strict')
  })

  it("uses the user's options as the resolved options without setup", () => {
    const adapter = defineExtension<AdapterFactoryOptions<'plain', { strict?: boolean }>>({
      kind: 'adapter',
      meta: { name: 'plain' },
      build: () => ({ document: null, parse: () => ast.factory.createInput(), validate: async () => {} }),
    })({ strict: true })

    expect(adapter.options).toStrictEqual({ strict: true })
  })

  it('throws KUBB_INCOMPATIBLE_EXTENSION from KubbDriver.setup when the adapter requires a newer Kubb', async () => {
    const future = defineExtension({
      kind: 'adapter',
      meta: { name: 'future', compatibility: { kubb: '>=99' } },
      build: () => ({ document: null, parse: () => ast.factory.createInput(), validate: async () => {} }),
    })
    const driver = new KubbDriver(makeConfig({ adapter: future() }), { hooks: new Hookable<KubbHooks>() })

    await expect(driver.setup()).rejects.toMatchObject({ diagnostic: { code: Diagnostics.code.incompatibleExtension, plugin: 'future' } })
  })
})

describe('deprecated definers', () => {
  it('definePlugin, defineParser, and createAdapter return the same factory as defineExtension', () => {
    const plugin = definePlugin({ meta: { name: 'plugin-text' } })
    const parser = defineParser({ meta: { name: 'text' }, build: () => ({ extNames: undefined, parse: () => '', print: () => '' }) })
    const adapter = createAdapter({
      meta: { name: 'text' },
      build: () => ({ document: null, parse: () => ast.factory.createInput(), validate: async () => {} }),
    })

    expect([plugin.kind, parser.kind, adapter.kind]).toStrictEqual(['plugin', 'parser', 'adapter'])
    expect(plugin().meta).toStrictEqual(defineExtension({ kind: 'plugin', meta: { name: 'plugin-text' } })().meta)
    expect(parser()).toMatchObject({ name: 'text', meta: { name: 'text' } })
    expect(adapter()).toMatchObject({ name: 'text', meta: { name: 'text' } })
  })
})
