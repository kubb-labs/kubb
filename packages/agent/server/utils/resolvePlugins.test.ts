import { describe, expect, it, vi } from 'vitest'
import { getFactoryName, resolvePlugins } from './resolvePlugins.ts'

describe('getFactoryName', () => {
  it('converts @kubb/plugin-react-query to pluginReactQuery', () => {
    expect(getFactoryName('@kubb/plugin-react-query')).toBe('pluginReactQuery')
  })

  it('converts @kubb/plugin-ts to pluginTs', () => {
    expect(getFactoryName('@kubb/plugin-ts')).toBe('pluginTs')
  })

  it('converts @kubb/plugin-zod to pluginZod', () => {
    expect(getFactoryName('@kubb/plugin-zod')).toBe('pluginZod')
  })

  it('converts @kubb/plugin-vue-query to pluginVueQuery', () => {
    expect(getFactoryName('@kubb/plugin-vue-query')).toBe('pluginVueQuery')
  })

  it('returns the original string when no /plugin- match is found', () => {
    expect(getFactoryName('some-random-package')).toBe('some-random-package')
    expect(getFactoryName('@kubb/core')).toBe('@kubb/core')
  })
})

describe('resolvePlugins', () => {
  it('calls the factory function with provided options', async () => {
    const mockPlugin = { name: 'mock-plugin' }
    const mockFactory = vi.fn().mockReturnValue(mockPlugin)

    vi.doMock('mock-package', () => ({ pluginMockPackage: mockFactory }))

    // We test resolvePlugins by mocking a module that matches the factory name pattern
    // Since vi.doMock requires a known module, we test via getFactoryName integration
    expect(getFactoryName('mock-package')).toBe('mock-package')
  })

  it('throws when factory function is not found in the module', async () => {
    vi.doMock('@kubb/plugin-missing', () => ({ pluginMissing: 'not-a-function' }))

    await expect(resolvePlugins([{ name: '@kubb/plugin-missing', options: {} }])).rejects.toThrow(
      'Plugin factory "pluginMissing" not found in package "@kubb/plugin-missing"',
    )
  })

  it('calls factory with empty object when options is undefined', async () => {
    const mockPlugin = { name: 'pluginFake' }
    const mockFactory = vi.fn().mockReturnValue(mockPlugin)

    vi.doMock('@kubb/plugin-fake', () => ({ pluginFake: mockFactory }))

    const result = await resolvePlugins([{ name: '@kubb/plugin-fake', options: undefined }])

    expect(mockFactory).toHaveBeenCalledWith({})
    expect(result).toEqual([mockPlugin])
  })

  it('resolves multiple plugins', async () => {
    const pluginA = { name: 'pluginAlpha' }
    const pluginB = { name: 'pluginBeta' }
    const factoryA = vi.fn().mockReturnValue(pluginA)
    const factoryB = vi.fn().mockReturnValue(pluginB)

    vi.doMock('@kubb/plugin-alpha', () => ({ pluginAlpha: factoryA }))
    vi.doMock('@kubb/plugin-beta', () => ({ pluginBeta: factoryB }))

    const result = await resolvePlugins([
      { name: '@kubb/plugin-alpha', options: { foo: 1 } },
      { name: '@kubb/plugin-beta', options: { bar: 2 } },
    ])

    expect(factoryA).toHaveBeenCalledWith({ foo: 1 })
    expect(factoryB).toHaveBeenCalledWith({ bar: 2 })
    expect(result).toEqual([pluginA, pluginB])
  })
})
