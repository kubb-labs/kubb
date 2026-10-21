import { type Adapter, Diagnostics, type ExtensionManifest, type Parser, type Plugin } from '@kubb/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExtensionEntry, JSONKubbConfig } from './protocol.ts'
import { assertOutputPaths, mergeOptions, mergeParsers, mergePlugins, resolvePlugins, toJSONOptions } from './resolveConfig.ts'

const makePlugin = (name: string, options: Record<string, unknown> = {}): Plugin => ({ name, options }) as Plugin

function extension(packageName: string, manifest: Pick<ExtensionManifest, 'kind' | 'name' | 'export'>): ExtensionEntry {
  return { package: packageName, version: '1.0.0', manifest: { displayName: 'X', description: 'X.', ...manifest } }
}

const pluginXEntry = extension('@acme/kubb-plugin-x', { kind: 'plugin', name: 'plugin-x', export: 'pluginX' })

// `mergePlugins` resolves through a real `import()`, so the packages it names are stubbed rather
// than the resolver: after the merge they are the same module.
vi.mock('@kubb/plugin-zod', () => ({ pluginZod: (options: unknown) => ({ name: 'plugin-zod', options }) }))
vi.mock('@kubb/plugin-barrel', () => ({ pluginBarrel: (options: unknown) => ({ name: 'plugin-barrel', options }) }))
vi.mock('@kubb/plugin-react-query', () => ({ pluginReactQuery: (options: unknown) => ({ name: 'plugin-react-query', options }) }))
vi.mock('@kubb/plugin-ts', () => ({ pluginTs: (options: unknown) => ({ name: 'plugin-ts', options }) }))

beforeEach(() => {
  // `vi.doMock` registrations live in the module registry, so without this they leak into every
  // later test in the file.
  vi.resetModules()
})

describe('mergePlugins', () => {
  it('merges studio options into the matching disk plugin and keeps the ones without a studio counterpart', async () => {
    const pluginTs = makePlugin('plugin-ts', { enumType: 'asConst' })
    const diskPlugins = [makePlugin('plugin-zod', { validate: true }), pluginTs]
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-zod', options: { validate: false } }]

    const result = await mergePlugins({ diskPlugins, studioPlugins })

    expect(result).toStrictEqual([{ name: 'plugin-zod', options: { validate: false } }, pluginTs])
  })

  it('appends resolved studio plugins not present in disk config', async () => {
    const diskPlugins = [makePlugin('plugin-zod', { validate: true })]
    const studioPlugins: JSONKubbConfig['plugins'] = [
      { name: '@kubb/plugin-zod', options: { validate: false } },
      { name: '@kubb/plugin-ts', options: { enumType: 'enum' } },
    ]

    const result = await mergePlugins({ diskPlugins, studioPlugins })

    expect(result).toHaveLength(2)
    expect(result?.[0]).toMatchObject({ name: 'plugin-zod' })
    expect(result?.[1]).toMatchObject({ name: 'plugin-ts', options: { enumType: 'enum' } })
  })

  it('keeps disk macros and resolver functions when studio echoes back their JSON copy', async () => {
    const macro = { name: 'camelCaseSchemaProperties', schema: (node: unknown) => node }
    const baseName = ({ name }: { name: string }) => `${name}.gen.ts`
    const diskPlugins = [makePlugin('plugin-ts', { macros: [macro], resolver: { file: { baseName } }, syntaxType: 'type' })]
    const studioPlugins: JSONKubbConfig['plugins'] = [
      { name: '@kubb/plugin-ts', options: { macros: [{ name: 'camelCaseSchemaProperties' }], resolver: { file: {} }, syntaxType: 'interface' } },
    ]

    const [plugin] = (await mergePlugins({ diskPlugins, studioPlugins })) ?? []

    expect(plugin?.options).toStrictEqual({ macros: [macro], resolver: { file: { baseName } }, syntaxType: 'interface' })
  })

  it('keeps a plugin defined in the project when Studio echoes its options back unchanged', async () => {
    const local = makePlugin('plugin-zod-operations', { tag: 'pet', name: () => 'x' })

    expect(await mergePlugins({ diskPlugins: [local], studioPlugins: [{ name: 'plugin-zod-operations', options: { tag: 'pet' } }] })).toStrictEqual([local])
  })

  it('explains that a plugin defined in the project can only be changed on disk', async () => {
    const local = makePlugin('plugin-zod-operations', { tag: 'pet' })

    await expect(mergePlugins({ diskPlugins: [local], studioPlugins: [{ name: '@kubb/plugin-zod-operations', options: { tag: 'store' } }] })).rejects.toThrow(
      'Plugin "plugin-zod-operations" is not an installed @kubb/plugin-* package or Kubb extension, so Studio cannot change its options.',
    )
  })

  it('matches a third-party plugin by its manifest name and re-creates it with the merged options', async () => {
    vi.doMock('@acme/kubb-plugin-x', () => ({ pluginX: (options: unknown) => ({ name: 'plugin-x', options }) }))
    const { mergePlugins: merge } = await import('./resolveConfig.ts')

    const result = await merge({
      diskPlugins: [makePlugin('plugin-x', { mode: 'a' })],
      studioPlugins: [{ name: '@acme/kubb-plugin-x', options: { mode: 'b' } }],
      extensions: new Map([['@acme/kubb-plugin-x', pluginXEntry]]),
    })

    expect(result).toStrictEqual([{ name: 'plugin-x', options: { mode: 'b' } }])
  })

  describe('disabled plugin entries', () => {
    it('drops a disk plugin that studio explicitly disabled', async () => {
      const diskPlugins = [makePlugin('plugin-zod', { validate: true }), makePlugin('plugin-ts', { enumType: 'asConst' })]
      const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-ts', disabled: true }]

      const result = await mergePlugins({ diskPlugins, studioPlugins })

      expect(result).toHaveLength(1)
      expect(result?.[0]?.name).toBe('plugin-zod')
    })
  })
})

describe('mergeOptions', () => {
  it('lets studio override JSON values, merging plain objects key by key', () => {
    expect(
      mergeOptions({ output: { path: 'types', barrel: false }, exclude: [{ type: 'tag', pattern: 'a' }] }, { output: { path: 'models' }, exclude: [] }),
    ).toStrictEqual({
      output: { path: 'models', barrel: false },
      exclude: [],
    })
  })

  it('unsets a disk value when studio sends null, so the factory default applies', () => {
    expect(mergeOptions({ emptySchemaType: 'any', unknownType: 'void' }, { emptySchemaType: null })).toStrictEqual({ unknownType: 'void' })
  })

  it('ignores keys that would reach the prototype', () => {
    const studio = JSON.parse('{ "__proto__": { "polluted": true }, "output": { "constructor": { "x": 1 }, "path": "models" } }') as Record<string, unknown>
    const merged = mergeOptions({ output: { path: 'types' } }, studio)

    expect(merged).toStrictEqual({ output: { path: 'models' } })
    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype)
  })

  it('keeps disk values that do not survive JSON', () => {
    const name = (group: string) => `${group}Controller`
    const disk = { exclude: [{ type: 'path', pattern: /^\/admin/ }], group: { type: 'tag', name } }

    expect(mergeOptions(disk, { exclude: [{ type: 'path', pattern: {} }], group: { type: 'path' } })).toStrictEqual({
      exclude: disk.exclude,
      group: { type: 'path', name },
    })
  })
})

describe('resolvePlugins', () => {
  it.each([
    ['the package cannot be imported', '@kubb/plugin-missing', 'Plugin "@kubb/plugin-missing" could not be loaded'],
    ['the name is not a @kubb/plugin-* package', 'my-custom-plugin', 'is not an installed Kubb plugin'],
    ['the package ships no manifest', '@acme/kubb-plugin-x', 'is not an installed Kubb plugin'],
  ])('throws when %s', async (_label, name, message) => {
    await expect(resolvePlugins({ plugins: [{ name, options: {} }] })).rejects.toThrow(message)
  })

  it('refuses an installed extension that is not a plugin', async () => {
    const extensions = new Map([['@acme/kubb-adapter-x', extension('@acme/kubb-adapter-x', { kind: 'adapter', name: 'adapter-x', export: 'adapterX' })]])

    await expect(resolvePlugins({ plugins: [{ name: '@acme/kubb-adapter-x' }], extensions })).rejects.toThrow('is not an installed Kubb plugin')
  })

  it('loads an installed third-party plugin through the export its manifest names', async () => {
    const pluginX = vi.fn((options: unknown) => ({ name: 'plugin-x', options }))
    vi.doMock('@acme/kubb-plugin-x', () => ({ pluginX, default: () => ({ name: 'wrong' }) }))
    const { resolvePlugins: resolve } = await import('./resolveConfig.ts')

    const [plugin] = await resolve({
      plugins: [{ name: '@acme/kubb-plugin-x', options: { mode: 'a' } }],
      extensions: new Map([['@acme/kubb-plugin-x', pluginXEntry]]),
    })

    expect(plugin).toStrictEqual({ name: 'plugin-x', options: { mode: 'a' } })
  })
})

describe('mergeAdapter', () => {
  it('re-invokes the same @kubb/adapter-<name> factory with merged options', async () => {
    const mockAdapterOas = vi.fn((options: unknown) => ({ name: 'oas', options, parse: vi.fn() }))
    vi.doMock('@kubb/adapter-oas', () => ({ adapterOas: mockAdapterOas }))
    const { mergeAdapter: merge } = await import('./resolveConfig.ts')

    const diskAdapter = { name: 'oas', options: { validate: true, server: { index: 0 } }, parse: vi.fn() } as unknown as Adapter

    const result = await merge(diskAdapter, { server: { index: 1 } })

    expect(mockAdapterOas).toHaveBeenCalledWith({ validate: true, server: { index: 1 } })
    expect(result).toStrictEqual({ name: 'oas', options: { validate: true, server: { index: 1 } }, parse: expect.any(Function) })
  })
})

describe('mergeParsers', () => {
  it('re-invokes the factory of the parser Studio names, found through its manifest, and keeps the others', async () => {
    const mockParserY = vi.fn((options: unknown) => ({ meta: { name: 'parser-y' }, options, extNames: ['.y'], parse: vi.fn(), print: vi.fn() }))
    vi.doMock('@acme/kubb-parser-y', () => ({ parserY: mockParserY }))
    const { mergeParsers: merge } = await import('./resolveConfig.ts')
    const parserY = {
      meta: { name: 'parser-y' },
      options: { indent: 2, quote: 'single' },
      extNames: ['.y'],
      parse: vi.fn(),
      print: vi.fn(),
    } as unknown as Parser
    const parserTsx = { meta: { name: 'tsx' }, extNames: ['.tsx'], parse: vi.fn(), print: vi.fn() } as unknown as Parser
    const extensions = new Map([['@acme/kubb-parser-y', extension('@acme/kubb-parser-y', { kind: 'parser', name: 'parser-y', export: 'parserY' })]])

    const result = await merge({
      diskParsers: [parserY, parserTsx],
      studioParsers: [{ name: '@acme/kubb-parser-y', options: { indent: 4 } }],
      extensions,
    })

    expect(mockParserY).toHaveBeenCalledWith({ indent: 4, quote: 'single' })
    expect(result[0]).toMatchObject({ options: { indent: 4, quote: 'single' } })
    expect(result[1]).toBe(parserTsx)
  })

  it('refuses an override for a parser no installed package provides, instead of dropping it', async () => {
    const parserTsx = { meta: { name: 'tsx' }, extNames: ['.tsx'], parse: vi.fn(), print: vi.fn() } as unknown as Parser

    const error = await mergeParsers({ diskParsers: [parserTsx], studioParsers: [{ name: 'tsx', options: { indent: 4 } }] }).catch((caught: unknown) => caught)

    expect(error).toHaveProperty('message', expect.stringContaining('The parser "tsx" is not an installed Kubb extension'))
    // A parser is not a plugin, so the error does not claim KUBB_PLUGIN_NOT_FOUND.
    expect(Diagnostics.from(error).code).toBe(Diagnostics.code.unknown)
  })
})

describe('toJSONOptions', () => {
  it('leaves out functions, so nothing callable reaches Studio', () => {
    const options = { output: { path: 'types' }, group: { type: 'tag', name: (group: string) => group }, pattern: /x/, big: 1n, macros: [() => 1] }

    expect(toJSONOptions(options)).toStrictEqual({ output: { path: 'types' }, group: { type: 'tag' }, pattern: {}, macros: [null] })
  })
})

describe('assertOutputPaths', () => {
  function check(options: Record<string, unknown>, diskPlugins: Array<Plugin> = []) {
    return () => assertOutputPaths({ plugins: [makePlugin('plugin-ts', options)], diskPlugins, root: '/project', outputPath: 'src/gen' })
  }

  it('refuses a path Studio sends outside the output folder, also inside `override`', () => {
    const run = check({ output: { path: '../../../../home/alice/.ssh/authorized_keys' } })

    expect(run).toThrow('Plugin "plugin-ts" would write to "/home/alice/.ssh/authorized_keys", outside the output folder "/project/src/gen".')
    expect(run).toThrow(expect.objectContaining({ diagnostic: expect.objectContaining({ code: Diagnostics.code.pathTraversal }) }))
    expect(check({ output: { path: 'types' }, override: [{ type: 'tag', pattern: 'pet', options: { output: { path: '/etc/cron.d/kubb' } } }] })).toThrow(
      'would write to "/etc/cron.d/kubb"',
    )
    expect(check({ output: { path: 'types' } })).not.toThrow()
  })

  it('allows a path outside the project root that the config file sets itself', () => {
    expect(check({ output: { path: '../../../shared/types' } }, [makePlugin('plugin-ts', { output: { path: '../../../shared/types' } })])).not.toThrow()
  })
})
