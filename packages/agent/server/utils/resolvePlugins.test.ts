import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveMiddlewares, resolvePlugins } from './resolvePlugins.ts'

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

describe('resolveMiddlewares', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('throws when the middleware package cannot be imported', async () => {
    await expect(resolveMiddlewares([{ name: '@kubb/middleware-missing' }])).rejects.toThrow('"@kubb/middleware-missing" could not be loaded')
  })

  it('resolves a @kubb middleware by its camelCase named export', async () => {
    const mockMiddlewareBarrel = vi.fn((_options: unknown) => ({ name: 'middleware-barrel', hooks: {} }))
    vi.doMock('@kubb/middleware-barrel', () => ({ middlewareBarrel: mockMiddlewareBarrel }))
    const { resolveMiddlewares: resolve } = await import('./resolvePlugins.ts')

    const result = await resolve([{ name: '@kubb/middleware-barrel', options: { root: './gen' } }])

    expect(result).toHaveLength(1)
    expect(mockMiddlewareBarrel).toHaveBeenCalledWith({ root: './gen' })
  })

  it('resolves middleware with undefined options using empty object', async () => {
    const mockMiddlewareBarrel = vi.fn((_options: unknown) => ({ name: 'middleware-barrel', hooks: {} }))
    vi.doMock('@kubb/middleware-barrel', () => ({ middlewareBarrel: mockMiddlewareBarrel }))
    const { resolveMiddlewares: resolve } = await import('./resolvePlugins.ts')

    const result = await resolve([{ name: '@kubb/middleware-barrel' }])

    expect(result).toHaveLength(1)
    expect(mockMiddlewareBarrel).toHaveBeenCalledWith({})
  })

  it('resolves multiple middlewares', async () => {
    const mockBarrel = vi.fn((_options: unknown) => ({ name: 'middleware-barrel', hooks: {} }))
    const mockCustom = vi.fn((_options: unknown) => ({ name: 'my-middleware', hooks: {} }))
    vi.doMock('@kubb/middleware-barrel', () => ({ middlewareBarrel: mockBarrel }))
    vi.doMock('my-middleware', () => ({ myMiddleware: mockCustom }))
    const { resolveMiddlewares: resolve } = await import('./resolvePlugins.ts')

    const result = await resolve([
      { name: '@kubb/middleware-barrel', options: {} },
      { name: 'my-middleware', options: {} },
    ])

    expect(result).toHaveLength(2)
  })
})

describe('checkPeerDependencies', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('logs a warning when @kubb/renderer-jsx is not installed', async () => {
    vi.doMock('./logger.ts', () => ({
      logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn() },
    }))
    vi.doMock('@kubb/renderer-jsx', () => {
      throw new Error('Cannot find module')
    })

    const { checkPeerDependencies } = await import('./resolvePlugins.ts')
    const { logger } = await import('./logger.ts')

    await checkPeerDependencies()

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('@kubb/renderer-jsx'))
  })

  it('does not log a warning when @kubb/renderer-jsx is installed', async () => {
    vi.doMock('./logger.ts', () => ({
      logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn() },
    }))
    vi.doMock('@kubb/renderer-jsx', () => ({ default: {} }))

    const { checkPeerDependencies } = await import('./resolvePlugins.ts')
    const { logger } = await import('./logger.ts')

    await checkPeerDependencies()

    expect(logger.warn).not.toHaveBeenCalled()
  })
})
