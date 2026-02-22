import { describe, expect, it } from 'vitest'
import { resolvePlugins } from './resolvePlugins.ts'

describe('resolvePlugins', () => {
  it('throws when plugin name is not in the registry', () => {
    expect(() => resolvePlugins([{ name: '@kubb/plugin-missing', options: {} }])).toThrow('Plugin "@kubb/plugin-missing" is not supported.')
  })

  it('resolves @kubb/plugin-ts with options', () => {
    const result = resolvePlugins([{ name: '@kubb/plugin-ts', options: { output: { path: './types' } } }])
    expect(result).toHaveLength(1)
    expect(result[0]).toBeDefined()
  })

  it('resolves @kubb/plugin-zod with undefined options using empty object', () => {
    const result = resolvePlugins([{ name: '@kubb/plugin-zod', options: undefined }])
    expect(result).toHaveLength(1)
    expect(result[0]).toBeDefined()
  })

  it('resolves multiple plugins', () => {
    const result = resolvePlugins([
      { name: '@kubb/plugin-ts', options: {} },
      { name: '@kubb/plugin-zod', options: {} },
    ])
    expect(result).toHaveLength(2)
  })
})
