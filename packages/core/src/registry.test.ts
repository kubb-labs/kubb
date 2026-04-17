import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRegistry } from './registry.ts'

const mockPluginTs = vi.fn((options: unknown) => ({ name: 'plugin-ts', options }))
const mockPluginZod = vi.fn((options: unknown) => ({ name: 'plugin-zod', options }))

beforeEach(() => {
  vi.resetModules()
  mockPluginTs.mockClear()
  mockPluginZod.mockClear()
})

describe('registry.resolvePlugins', () => {
  it('throws when the plugin package cannot be imported', async () => {
    const registry = createRegistry()

    await expect(registry.resolvePlugins([{ name: '@kubb/plugin-missing', options: {} }])).rejects.toThrow('Package "@kubb/plugin-missing" could not be loaded')
  })

  it('resolves a @kubb plugin by its default export', async () => {
    vi.doMock('@kubb/plugin-ts', () => ({ default: mockPluginTs }))
    const { createRegistry } = await import('./registry.ts')
    const registry = createRegistry()

    const result = await registry.resolvePlugins([{ name: '@kubb/plugin-ts', options: { output: { path: './types' } } }])

    expect(result).toHaveLength(1)
    expect(mockPluginTs).toHaveBeenCalledWith({ output: { path: './types' } })
  })

  it('resolves a plugin with undefined options using empty object', async () => {
    vi.doMock('@kubb/plugin-zod', () => ({ default: mockPluginZod }))
    const { createRegistry } = await import('./registry.ts')
    const registry = createRegistry()

    const result = await registry.resolvePlugins([{ name: '@kubb/plugin-zod', options: undefined }])

    expect(result).toHaveLength(1)
    expect(mockPluginZod).toHaveBeenCalledWith({})
  })

  it('resolves multiple plugins', async () => {
    vi.doMock('@kubb/plugin-ts', () => ({ default: mockPluginTs }))
    vi.doMock('@kubb/plugin-zod', () => ({ default: mockPluginZod }))
    const { createRegistry } = await import('./registry.ts')
    const registry = createRegistry()

    const result = await registry.resolvePlugins([
      { name: '@kubb/plugin-ts', options: {} },
      { name: '@kubb/plugin-zod', options: {} },
    ])

    expect(result).toHaveLength(2)
  })

  it('falls back to first exported function when no default export', async () => {
    const mockFactory = vi.fn((options: unknown) => ({ name: 'my-plugin', options }))
    vi.doMock('my-single-export-plugin', () => ({ default: undefined, create: mockFactory }))
    const { createRegistry } = await import('./registry.ts')
    const registry = createRegistry()

    const result = await registry.resolvePlugins([{ name: 'my-single-export-plugin', options: { foo: 'bar' } }])

    expect(result).toHaveLength(1)
    expect(mockFactory).toHaveBeenCalledWith({ foo: 'bar' })
  })

  it('resolves a non-kubb scoped package by its default export', async () => {
    const mockFactory = vi.fn((options: unknown) => ({ name: 'my-plugin', options }))
    vi.doMock('@my-org/my-plugin', () => ({ default: mockFactory }))
    const { createRegistry } = await import('./registry.ts')
    const registry = createRegistry()

    const result = await registry.resolvePlugins([{ name: '@my-org/my-plugin', options: {} }])

    expect(result).toHaveLength(1)
    expect(mockFactory).toHaveBeenCalledWith({})
  })

  it('resolves a third-party kubb plugin by its default export', async () => {
    const mockFactory = vi.fn((options: unknown) => ({ name: 'kubb-plugin-valibot', options }))
    vi.doMock('kubb-plugin-valibot', () => ({ default: mockFactory }))
    const { createRegistry } = await import('./registry.ts')
    const registry = createRegistry()

    const result = await registry.resolvePlugins([{ name: 'kubb-plugin-valibot', options: {} }])

    expect(result).toHaveLength(1)
    expect(mockFactory).toHaveBeenCalledWith({})
  })

  it('prefers pre-registered factory over dynamic import', async () => {
    const registeredFactory = vi.fn((options: unknown) => ({ name: 'custom', options }))
    const registry = createRegistry()
    registry.registerPlugin('my-plugin', registeredFactory as any)

    const result = await registry.resolvePlugins([{ name: 'my-plugin', options: { a: 1 } }])

    expect(result).toHaveLength(1)
    expect(registeredFactory).toHaveBeenCalledWith({ a: 1 })
  })

  it('throws when the module exists but exports no callable factory', async () => {
    vi.doMock('@kubb/plugin-broken', () => ({ default: 42 }))
    const { createRegistry } = await import('./registry.ts')
    const registry = createRegistry()

    await expect(registry.resolvePlugins([{ name: '@kubb/plugin-broken', options: {} }])).rejects.toThrow('does not export a default function')
  })
})
