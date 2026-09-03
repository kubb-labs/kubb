import type { Plugin } from '@kubb/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { JSONKubbConfig } from './protocol/index.ts'
import { assertAllowedPlugins, mergeAdapter, mergePlugins, resolvePlugins, toExportName } from './resolveConfig.ts'

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
  it('returns undefined when both inputs are undefined', async () => {
    expect(await mergePlugins(undefined, undefined)).toBeUndefined()
  })

  it('returns disk plugins as-is when studio plugins are undefined', async () => {
    const diskPlugins = [makePlugin('plugin-zod', { validate: true })]
    expect(await mergePlugins(diskPlugins, undefined)).toBe(diskPlugins)
  })

  it('resolves and returns studio plugins when disk plugins are undefined', async () => {
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-zod', options: { validate: false } }]
    const result = await mergePlugins(undefined, studioPlugins)
    expect(result).toHaveLength(1)
    expect(result?.[0]?.name).toBe('plugin-zod')
    expect(result?.[0]?.options).toMatchObject({ validate: false })
  })

  it('merges studio options into a matching disk plugin, studio takes priority', async () => {
    const diskPlugins = [makePlugin('plugin-zod', { validate: true })]
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-zod', options: { validate: false } }]

    const result = await mergePlugins(diskPlugins, studioPlugins)

    expect(result).toHaveLength(1)
    expect(result?.[0]?.name).toBe('plugin-zod')
    expect(result?.[0]?.options).toMatchObject({ validate: false })
  })

  it('returns a fresh plugin instance (not the disk reference) when merging matching plugins', async () => {
    const diskPlugin = makePlugin('plugin-zod', { validate: true })
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-zod', options: { validate: false } }]

    const result = await mergePlugins([diskPlugin], studioPlugins)

    // Must be a new instance so internal closures reference the merged options
    expect(result?.[0]).not.toBe(diskPlugin)
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
    expect(result?.[0]?.name).toBe('plugin-zod')
    expect(result?.[1]?.name).toBe('plugin-ts')
    expect(result?.[1]?.options).toMatchObject({ enumType: 'enum' })
  })

  describe('false opt-out cases', () => {
    it('preserves barrel: false from studio override when disk has a barrel object', async () => {
      const diskPlugins = [makePlugin('plugin-ts', { barrel: { type: 'named' } })]
      const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-ts', options: { barrel: false } }]

      const result = await mergePlugins(diskPlugins, studioPlugins)

      expect(result?.[0]?.options).toMatchObject({ barrel: false })
    })

    it('preserves barrel object from studio override when disk has barrel: false', async () => {
      const diskPlugins = [makePlugin('plugin-ts', { barrel: false })]
      const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-ts', options: { barrel: { type: 'named' } } }]

      const result = await mergePlugins(diskPlugins, studioPlugins)

      expect(result?.[0]?.options).toMatchObject({ barrel: { type: 'named' } })
    })
  })

  describe('disabled plugin entries', () => {
    it('drops a disk plugin that studio explicitly disabled', async () => {
      const diskPlugins = [makePlugin('plugin-zod', { validate: true }), makePlugin('plugin-ts', { enumType: 'asConst' })]
      const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-ts', disabled: true }]

      const result = await mergePlugins(diskPlugins, studioPlugins)

      expect(result).toHaveLength(1)
      expect(result?.[0]?.name).toBe('plugin-zod')
    })

    it('drops a disabled disk plugin even when studio also sends other plugin overrides', async () => {
      const diskPlugins = [makePlugin('plugin-zod', { validate: true }), makePlugin('plugin-ts', { enumType: 'asConst' })]
      const studioPlugins: JSONKubbConfig['plugins'] = [
        { name: '@kubb/plugin-zod', options: { validate: false } },
        { name: '@kubb/plugin-ts', disabled: true },
      ]

      const result = await mergePlugins(diskPlugins, studioPlugins)

      expect(result).toHaveLength(1)
      expect(result?.[0]?.name).toBe('plugin-zod')
      expect(result?.[0]?.options).toMatchObject({ validate: false })
    })

    it('returns an empty array when disabling removes the only disk plugin and studio sends nothing else', async () => {
      const diskPlugins = [makePlugin('plugin-ts', { enumType: 'asConst' })]
      const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-ts', disabled: true }]

      const result = await mergePlugins(diskPlugins, studioPlugins)

      expect(result).toEqual([])
    })

    it('is a no-op when studio disables nothing', async () => {
      const diskPlugins = [makePlugin('plugin-zod', { validate: true })]

      const result = await mergePlugins(diskPlugins, [])

      expect(result).toBe(diskPlugins)
    })
  })

  it('merges studio options into a disk plugin that has no options field', async () => {
    // @kubb/plugin-barrel never sets `options` on its returned Plugin object, so `diskPlugin.options`
    // is undefined here. `mergeDeep` can't accept undefined, so merging must fall back to `{}` first.
    const diskPlugin = { name: 'plugin-barrel' } as Plugin
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-barrel', options: { output: { barrel: { type: 'all' } } } }]

    const result = await mergePlugins([diskPlugin], studioPlugins)

    expect(result).toHaveLength(1)
    expect(result?.[0]?.name).toBe('plugin-barrel')
    expect(result?.[0]?.options).toMatchObject({ output: { barrel: { type: 'all' } } })
  })
})

describe('assertAllowedPlugins', () => {
  // The allow-list holds unscoped disk plugin names, so matching has to accept the package they
  // came from without accepting a different package that happens to end the same way.
  it('accepts the @kubb package an unscoped entry stands for', () => {
    expect(() => assertAllowedPlugins([{ name: '@kubb/plugin-ts' }], ['plugin-ts'])).not.toThrow()
  })

  it('rejects a different scope that ends in an allowed name', () => {
    expect(() => assertAllowedPlugins([{ name: '@evil/plugin-ts' }], ['plugin-ts'])).toThrow(/does not import/)
  })

  it.each(['../../../etc/plugin-ts', '/tmp/evil', './local-plugin', 'a/b/c'])('rejects %s, which is not a package name', (name) => {
    expect(() => assertAllowedPlugins([{ name }], ['plugin-ts'])).toThrow(/not a package name/)
  })

  // The Docker agent runs without an allow-list: the image bounds which packages exist, but that
  // says nothing about which paths are reachable inside the container.
  it('rejects a path even when no allow-list is set', () => {
    expect(() => assertAllowedPlugins([{ name: '../../../etc/passwd' }], undefined)).toThrow(/not a package name/)
  })

  it('accepts anything when no allow-list is given', () => {
    expect(() => assertAllowedPlugins([{ name: 'anything-at-all' }], undefined)).not.toThrow()
  })

  it('accepts a plugin the local config imports, matched on the package base name', () => {
    expect(() => assertAllowedPlugins([{ name: '@kubb/plugin-ts' }], ['@kubb/plugin-ts'])).not.toThrow()
  })

  it('rejects a plugin the local config does not import', () => {
    expect(() => assertAllowedPlugins([{ name: 'evil-module' }], ['@kubb/plugin-ts'])).toThrow(/"evil-module"/)
  })

  it('names every rejected plugin', () => {
    expect(() => assertAllowedPlugins([{ name: 'a' }, { name: '@kubb/plugin-ts' }, { name: 'b' }], ['@kubb/plugin-ts'])).toThrow(/"a", "b"/)
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

  it('resolves a plugin with undefined options using empty object', async () => {
    vi.doMock('@kubb/plugin-zod', () => ({ pluginZod: mockPluginZod }))
    const { resolvePlugins: resolve } = await import('./resolveConfig.ts')

    const result = await resolve([{ name: '@kubb/plugin-zod' }])

    expect(result).toHaveLength(1)
    expect(mockPluginZod).toHaveBeenCalledWith({})
  })

  it('resolves multiple plugins', async () => {
    vi.doMock('@kubb/plugin-ts', () => ({ pluginTs: mockPluginTs }))
    vi.doMock('@kubb/plugin-zod', () => ({ pluginZod: mockPluginZod }))
    const { resolvePlugins: resolve } = await import('./resolveConfig.ts')

    const result = await resolve([
      { name: '@kubb/plugin-ts', options: {} },
      { name: '@kubb/plugin-zod', options: {} },
    ])

    expect(result).toHaveLength(2)
  })

  it('falls back to default export when named export is missing', async () => {
    const mockDefault = vi.fn((options: unknown) => ({
      name: 'plugin-default-only',
      options,
    }))
    vi.doMock('@my-org/plugin-default-only', () => ({
      pluginDefaultOnly: undefined,
      default: mockDefault,
    }))
    const { resolvePlugins: resolve } = await import('./resolveConfig.ts')

    const result = await resolve([{ name: '@my-org/plugin-default-only', options: {} }])

    expect(result).toHaveLength(1)
    expect(mockDefault).toHaveBeenCalledWith({})
  })

  it('resolves a non-kubb scoped package by its camelCase named export', async () => {
    const mockFactory = vi.fn((options: unknown) => ({
      name: 'my-plugin',
      options,
    }))
    vi.doMock('@my-org/my-plugin', () => ({ myPlugin: mockFactory }))
    const { resolvePlugins: resolve } = await import('./resolveConfig.ts')

    const result = await resolve([{ name: '@my-org/my-plugin', options: {} }])

    expect(result).toHaveLength(1)
    expect(mockFactory).toHaveBeenCalledWith({})
  })

  it('resolves an unscoped package by its camelCase named export', async () => {
    const mockFactory = vi.fn((options: unknown) => ({
      name: 'my-custom-plugin',
      options,
    }))
    vi.doMock('my-custom-plugin', () => ({ myCustomPlugin: mockFactory }))
    const { resolvePlugins: resolve } = await import('./resolveConfig.ts')

    const result = await resolve([{ name: 'my-custom-plugin', options: {} }])

    expect(result).toHaveLength(1)
    expect(mockFactory).toHaveBeenCalledWith({})
  })

  it('throws when the module exists but exports no callable factory', async () => {
    vi.doMock('@kubb/plugin-broken', () => ({
      pluginBroken: 'not-a-function',
      default: 42,
    }))
    const { resolvePlugins: resolve } = await import('./resolveConfig.ts')

    await expect(resolve([{ name: '@kubb/plugin-broken', options: {} }])).rejects.toThrow('does not export a callable factory')
  })
})

describe('mergeAdapter', () => {
  it('returns the disk adapter unchanged when there are no studio options', async () => {
    const diskAdapter = { name: 'oas', options: { validate: true }, parse: vi.fn() } as any

    const result = await mergeAdapter(diskAdapter, undefined)

    expect(result).toBe(diskAdapter)
  })

  it('returns undefined when there is no disk adapter, even with studio options', async () => {
    const result = await mergeAdapter(undefined, { validate: false })

    expect(result).toBeUndefined()
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

  it('returns the disk adapter unchanged when the resolved package exports no callable factory', async () => {
    vi.doMock('@kubb/adapter-broken', () => ({ adapterBroken: 'not-a-function' }))
    const { mergeAdapter: merge } = await import('./resolveConfig.ts')

    const diskAdapter = { name: 'broken', options: {}, parse: vi.fn() } as any

    const result = await merge(diskAdapter, { foo: 'bar' })

    expect(result).toBe(diskAdapter)
  })

  it('merges studio options into an adapter that was constructed with none', async () => {
    const mockAdapterOas = vi.fn((options: unknown) => ({ name: 'oas', options, parse: vi.fn() }))
    vi.doMock('@kubb/adapter-oas', () => ({ adapterOas: mockAdapterOas }))
    const { mergeAdapter: merge } = await import('./resolveConfig.ts')

    const diskAdapter = { name: 'oas', options: undefined, parse: vi.fn() } as any

    const result = await merge(diskAdapter, { validate: false })

    expect(mockAdapterOas).toHaveBeenCalledWith({ validate: false })
    expect(result).toStrictEqual({ name: 'oas', options: { validate: false }, parse: expect.any(Function) })
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

  it('derives a name for a plugin outside the @kubb scope', () => {
    expect(['@acme/plugin-solid-query', 'kubb-plugin-custom'].map(toExportName)).toStrictEqual(['pluginSolidQuery', 'kubbPluginCustom'])
  })
})
