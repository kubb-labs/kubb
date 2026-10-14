import { ast } from '@kubb/ast'
import type { OperationNode, SchemaNode } from '@kubb/ast'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, createMockedSetupContext, renderGeneratorOperation } from '@kubb/core/mocks'
import { describe, expect, it, vi } from 'vitest'
import { defineExtension } from './defineExtension.ts'
import { defineGenerator } from './defineGenerator.ts'
import { assertPluginOption, normalizeOutput } from './definePlugin.ts'
import { Diagnostics } from './Diagnostics.ts'
import type { Resolver } from './Resolver.ts'
import { KubbDriver } from './KubbDriver.ts'
import type { Config, KubbHooks } from './types.ts'
import type { GeneratorContext } from './defineGenerator.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import { Hookable } from './Hookable.ts'

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

describe('kubb:plugin:setup context', () => {
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
    ['a nested extensionless path', { output: { path: 'ts/models' } }, { path: 'ts/models', mode: 'directory' }],
    ['a path with an extension', { output: { path: 'models.ts' } }, { path: 'models.ts', mode: 'file' }],
    ['an explicit directory mode', { output: { path: 'types', mode: 'directory' } }, { path: 'types', mode: 'directory' }],
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
