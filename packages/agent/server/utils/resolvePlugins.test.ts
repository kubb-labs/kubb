import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolvePlugins } from './resolvePlugins.ts'

const mockPluginTs = vi.fn((options: unknown) => ({
  name: 'plugin-ts',
  options,
}))
const mockPluginZod = vi.fn((options: unknown) => ({
  name: 'plugin-zod',
  options,
}))

beforeEach(() => {
  vi.resetModules()
  mockPluginTs.mockClear()
  mockPluginZod.mockClear()
})

describe('resolvePlugins', () => {
  it('throws when the plugin package cannot be imported', async () => {
    await expect(resolvePlugins([{ name: '@kubb/plugin-missing', options: {} }])).rejects.toThrow('Plugin "@kubb/plugin-missing" could not be loaded')
  })

  it('resolves a @kubb plugin by its camelCase named export', async () => {
    vi.doMock('@kubb/plugin-ts', () => ({ pluginTs: mockPluginTs }))
    const { resolvePlugins: resolve } = await import('./resolvePlugins.ts')

    const result = await resolve([{ name: '@kubb/plugin-ts', options: { output: { path: './types' } } }])

    expect(result).toHaveLength(1)
    expect(mockPluginTs).toHaveBeenCalledWith({ output: { path: './types' } })
  })

  it('resolves a plugin with undefined options using empty object', async () => {
    vi.doMock('@kubb/plugin-zod', () => ({ pluginZod: mockPluginZod }))
    const { resolvePlugins: resolve } = await import('./resolvePlugins.ts')

    const result = await resolve([{ name: '@kubb/plugin-zod', options: undefined }])

    expect(result).toHaveLength(1)
    expect(mockPluginZod).toHaveBeenCalledWith({})
  })

  it('resolves multiple plugins', async () => {
    vi.doMock('@kubb/plugin-ts', () => ({ pluginTs: mockPluginTs }))
    vi.doMock('@kubb/plugin-zod', () => ({ pluginZod: mockPluginZod }))
    const { resolvePlugins: resolve } = await import('./resolvePlugins.ts')

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
    const { resolvePlugins: resolve } = await import('./resolvePlugins.ts')

    const result = await resolve([{ name: '@my-org/plugin-default-only', options: {} }])

    expect(result).toHaveLength(1)
    expect(mockDefault).toHaveBeenCalledWith({})
  })

  it('falls back to first exported function for non-conventional single-export packages', async () => {
    const mockFactory = vi.fn((options: unknown) => ({
      name: 'my-plugin',
      options,
    }))
    vi.doMock('my-single-export-plugin', () => ({
      mySingleExportPlugin: undefined,
      default: undefined,
      create: mockFactory,
    }))
    const { resolvePlugins: resolve } = await import('./resolvePlugins.ts')

    const result = await resolve([{ name: 'my-single-export-plugin', options: { foo: 'bar' } }])

    expect(result).toHaveLength(1)
    expect(mockFactory).toHaveBeenCalledWith({ foo: 'bar' })
  })

  it('resolves a non-kubb scoped package by its camelCase named export', async () => {
    const mockFactory = vi.fn((options: unknown) => ({
      name: 'my-plugin',
      options,
    }))
    vi.doMock('@my-org/my-plugin', () => ({ myPlugin: mockFactory }))
    const { resolvePlugins: resolve } = await import('./resolvePlugins.ts')

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
    const { resolvePlugins: resolve } = await import('./resolvePlugins.ts')

    const result = await resolve([{ name: 'my-custom-plugin', options: {} }])

    expect(result).toHaveLength(1)
    expect(mockFactory).toHaveBeenCalledWith({})
  })

  it('throws when the module exists but exports no callable factory', async () => {
    vi.doMock('@kubb/plugin-broken', () => ({
      pluginBroken: 'not-a-function',
      default: 42,
    }))
    const { resolvePlugins: resolve } = await import('./resolvePlugins.ts')

    await expect(resolve([{ name: '@kubb/plugin-broken', options: {} }])).rejects.toThrow('does not export a callable factory')
  })
})
