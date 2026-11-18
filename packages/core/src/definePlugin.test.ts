import type { OperationNode } from '@kubb/ast'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from '@kubb/core/mocks'
import { describe, expect, it } from 'vitest'
import { defineExtension } from './defineExtension.ts'
import { defineGenerator } from './defineGenerator.ts'
import { assertPluginOption, normalizeOutput } from './definePlugin.ts'
import { Diagnostics } from './Diagnostics.ts'
import type { Resolver } from './Resolver.ts'
import { KubbDriver } from './KubbDriver.ts'
import type { Config, KubbHooks } from './types.ts'
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
