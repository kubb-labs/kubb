import type { Plugin } from '@kubb/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { JSONKubbConfig } from './protocol/index.ts'
import { mergeAdapter, mergePlugins, resolvePlugins, toExportName, toPackageName } from './resolveConfig.ts'

const makePlugin = (name: string, options: Record<string, unknown> = {}): Plugin => ({ name, options }) as Plugin

const mockPluginTs = vi.fn((options: unknown) => ({ name: 'plugin-ts', options }))
const mockPluginZod = vi.fn((options: unknown) => ({ name: 'plugin-zod', options }))

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
  mockPluginTs.mockClear()
  mockPluginZod.mockClear()
})

describe('mergePlugins', () => {
  it('returns disk plugins as-is when studio plugins are undefined', async () => {
    const diskPlugins = [makePlugin('plugin-zod', { validate: true })]
    expect(await mergePlugins(diskPlugins, undefined)).toBe(diskPlugins)
  })

  it('merges studio options into a matching disk plugin, studio takes priority', async () => {
    const diskPlugins = [makePlugin('plugin-zod', { validate: true })]
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-zod', options: { validate: false } }]

    const result = await mergePlugins(diskPlugins, studioPlugins)

    expect(result).toHaveLength(1)
    expect(result?.[0]).toMatchObject({ name: 'plugin-zod', options: { validate: false } })
  })

  it('preserves disk plugins that have no studio counterpart', async () => {
    const pluginTs = makePlugin('plugin-ts', { enumType: 'asConst' })
    const diskPlugins = [makePlugin('plugin-zod', { validate: true }), pluginTs]
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-zod', options: { validate: false } }]

    const result = await mergePlugins(diskPlugins, studioPlugins)

    expect(result).toHaveLength(2)
    expect(result?.[1]).toBe(pluginTs)
  })

  it('appends resolved studio plugins not present in disk config', async () => {
    const diskPlugins = [makePlugin('plugin-zod', { validate: true })]
    const studioPlugins: JSONKubbConfig['plugins'] = [
      { name: '@kubb/plugin-zod', options: { validate: false } },
      { name: '@kubb/plugin-ts', options: { enumType: 'enum' } },
    ]

    const result = await mergePlugins(diskPlugins, studioPlugins)

    expect(result).toHaveLength(2)
    expect(result?.[0]).toMatchObject({ name: 'plugin-zod' })
    expect(result?.[1]).toMatchObject({ name: 'plugin-ts', options: { enumType: 'enum' } })
  })

  describe('disabled plugin entries', () => {
    it('drops a disk plugin that studio explicitly disabled', async () => {
      const diskPlugins = [makePlugin('plugin-zod', { validate: true }), makePlugin('plugin-ts', { enumType: 'asConst' })]
      const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-ts', disabled: true }]

      const result = await mergePlugins(diskPlugins, studioPlugins)

      expect(result).toHaveLength(1)
      expect(result?.[0]?.name).toBe('plugin-zod')
    })
  })
})

describe('resolvePlugins', () => {
  it('throws when the plugin package cannot be imported', async () => {
    await expect(resolvePlugins([{ name: '@kubb/plugin-missing', options: {} }])).rejects.toThrow('Plugin "@kubb/plugin-missing" could not be loaded')
  })

  it('resolves a @kubb plugin by its camelCase named export', async () => {
    vi.doMock('@kubb/plugin-ts', () => ({ pluginTs: mockPluginTs }))
    const { resolvePlugins: resolve } = await import('./resolveConfig.ts')

    const result = await resolve([{ name: '@kubb/plugin-ts', options: { output: { path: './types' } } }])

    expect(result).toHaveLength(1)
    expect(mockPluginTs).toHaveBeenCalledWith({ output: { path: './types' } })
  })

  it('refuses a plugin name that is not a @kubb/plugin-* package', async () => {
    await expect(resolvePlugins([{ name: 'my-custom-plugin', options: {} }])).rejects.toThrow('is not a @kubb/plugin-* package')
  })
})

describe('mergeAdapter', () => {
  it('returns the disk adapter unchanged when there are no studio options', async () => {
    const diskAdapter = { name: 'oas', options: { validate: true }, parse: vi.fn() } as any

    const result = await mergeAdapter(diskAdapter, undefined)

    expect(result).toBe(diskAdapter)
  })

  it('re-invokes the same @kubb/adapter-<name> factory with merged options', async () => {
    const mockAdapterOas = vi.fn((options: unknown) => ({ name: 'oas', options, parse: vi.fn() }))
    vi.doMock('@kubb/adapter-oas', () => ({ adapterOas: mockAdapterOas }))
    const { mergeAdapter: merge } = await import('./resolveConfig.ts')

    const diskAdapter = { name: 'oas', options: { validate: true, server: { index: 0 } }, parse: vi.fn() } as any

    const result = await merge(diskAdapter, { server: { index: 1 } })

    expect(mockAdapterOas).toHaveBeenCalledWith({ validate: true, server: { index: 1 } })
    expect(result).toStrictEqual({ name: 'oas', options: { validate: true, server: { index: 1 } }, parse: expect.any(Function) })
  })
})

describe('toExportName', () => {
  // Every plugin published from kubb-labs/plugins. Both `resolvePlugins`, which imports this name,
  // and the config patcher, which writes it into the user's file, go through here, so a package
  // that breaks the convention has to show up as a failure rather than as a config Studio cannot load.
  it('derives the factory name every Kubb plugin exports', () => {
    const packages = [
      '@kubb/plugin-axios',
      '@kubb/plugin-cypress',
      '@kubb/plugin-faker',
      '@kubb/plugin-fetch',
      '@kubb/plugin-mcp',
      '@kubb/plugin-msw',
      '@kubb/plugin-react-query',
      '@kubb/plugin-redoc',
      '@kubb/plugin-swr',
      '@kubb/plugin-ts',
      '@kubb/plugin-vue-query',
      '@kubb/plugin-zod',
    ]
    expect(Object.fromEntries(packages.map((name) => [name, toExportName(name)]))).toStrictEqual({
      '@kubb/plugin-axios': 'pluginAxios',
      '@kubb/plugin-cypress': 'pluginCypress',
      '@kubb/plugin-faker': 'pluginFaker',
      '@kubb/plugin-fetch': 'pluginFetch',
      '@kubb/plugin-mcp': 'pluginMcp',
      '@kubb/plugin-msw': 'pluginMsw',
      '@kubb/plugin-react-query': 'pluginReactQuery',
      '@kubb/plugin-redoc': 'pluginRedoc',
      '@kubb/plugin-swr': 'pluginSwr',
      '@kubb/plugin-ts': 'pluginTs',
      '@kubb/plugin-vue-query': 'pluginVueQuery',
      '@kubb/plugin-zod': 'pluginZod',
    })
  })
})

describe('toPackageName', () => {
  it('scopes a Kubb plugin name and leaves anything else alone', () => {
    const names = ['plugin-ts', '@kubb/plugin-ts', '@acme/my-plugin', 'kubb']

    expect(Object.fromEntries(names.map((name) => [name, toPackageName(name)]))).toStrictEqual({
      'plugin-ts': '@kubb/plugin-ts',
      '@kubb/plugin-ts': '@kubb/plugin-ts',
      '@acme/my-plugin': '@acme/my-plugin',
      kubb: 'kubb',
    })
  })
})
