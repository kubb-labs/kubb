import { afterEach, describe, expect, it } from 'vitest'
import { applyPreset, configPresetRegistry, defineConfigPreset, registerConfigPreset, resolvePreset } from './defineConfigPreset.ts'
import type { UserConfig } from './types.ts'

function makeParser(name: string) {
  return { name, type: 'parser' as const, extNames: undefined, install: () => {}, parse: () => '' }
}

function makeAdapter(name: string) {
  return {
    name,
    options: {},
    get document() {
      return null
    },
    get rootNode() {
      return null
    },
    getImports: () => [],
    parse: async () => ({ type: 'root' as const, nodes: [] }),
  } as any
}

function makePlugin(name: string) {
  return { name, options: {} as any, resolver: undefined as any }
}

function makeConfig(overrides: Partial<UserConfig> = {}): UserConfig {
  return {
    input: { path: './spec.yaml' },
    output: { path: './src/gen' },
    ...overrides,
  }
}

afterEach(() => {
  configPresetRegistry.clear()
})

describe('defineConfigPreset', () => {
  it('returns the definition unchanged', () => {
    const def = defineConfigPreset({ name: 'test-preset' })
    expect(def).toEqual({ name: 'test-preset' })
  })
})

describe('registerConfigPreset', () => {
  it('registers and resolves a preset by name', () => {
    const def = defineConfigPreset({ name: 'my-preset', parsers: [makeParser('ts')] })
    registerConfigPreset(def)
    expect(resolvePreset('my-preset')).toBe(def)
  })

  it('overwrites a preset registered under the same name', () => {
    registerConfigPreset(defineConfigPreset({ name: 'dupe' }))
    const updated = defineConfigPreset({ name: 'dupe', parsers: [makeParser('ts')] })
    registerConfigPreset(updated)
    expect(resolvePreset('dupe')).toBe(updated)
  })

  it('returns undefined for unknown presets', () => {
    expect(resolvePreset('unknown')).toBeUndefined()
  })
})

describe('applyPreset', () => {
  it('returns config unchanged when no configPreset is set', () => {
    const config = makeConfig()
    expect(applyPreset(config)).toEqual(config)
  })

  it('throws a helpful error for an unknown preset name', () => {
    registerConfigPreset(defineConfigPreset({ name: 'known' }))
    const config = makeConfig({ configPreset: 'unknown-preset' })
    expect(() => applyPreset(config)).toThrowError(/Unknown configPreset 'unknown-preset'/)
    expect(() => applyPreset(config)).toThrowError(/'known'/)
  })

  it('fills adapter from preset when user has none', () => {
    const adapter = makeAdapter('oas')
    registerConfigPreset(defineConfigPreset({ name: 'p', adapter }))
    const result = applyPreset(makeConfig({ configPreset: 'p' }))
    expect(result.adapter).toBe(adapter)
  })

  it('user adapter overrides preset adapter', () => {
    const presetAdapter = makeAdapter('preset-adapter')
    const userAdapter = makeAdapter('user-adapter')
    registerConfigPreset(defineConfigPreset({ name: 'p', adapter: presetAdapter }))
    const result = applyPreset(makeConfig({ configPreset: 'p', adapter: userAdapter }))
    expect(result.adapter).toBe(userAdapter)
  })

  it('fills parsers from preset when user has none', () => {
    const parser = makeParser('ts')
    registerConfigPreset(defineConfigPreset({ name: 'p', parsers: [parser] }))
    const result = applyPreset(makeConfig({ configPreset: 'p' }))
    expect(result.parsers).toEqual([parser])
  })

  it('user parser replaces preset parser with same name', () => {
    const presetParser = makeParser('ts')
    const userParser = { ...makeParser('ts'), parse: () => 'overridden' }
    registerConfigPreset(defineConfigPreset({ name: 'p', parsers: [presetParser] }))
    const result = applyPreset(makeConfig({ configPreset: 'p', parsers: [userParser] }))
    expect(result.parsers).toHaveLength(1)
    expect(result.parsers?.[0]).toBe(userParser)
  })

  it('keeps extra preset parsers not overridden by user', () => {
    const parserA = makeParser('ts')
    const parserB = makeParser('json')
    const userParserA = { ...makeParser('ts'), parse: () => 'overridden' }
    registerConfigPreset(defineConfigPreset({ name: 'p', parsers: [parserA, parserB] }))
    const result = applyPreset(makeConfig({ configPreset: 'p', parsers: [userParserA] }))
    expect(result.parsers).toHaveLength(2)
    expect(result.parsers?.[0]).toBe(parserB)
    expect(result.parsers?.[1]).toBe(userParserA)
  })

  it('fills plugins from preset when user has none', () => {
    const plugin = makePlugin('plugin-ts')
    registerConfigPreset(defineConfigPreset({ name: 'p', plugins: [plugin] }))
    const result = applyPreset(makeConfig({ configPreset: 'p' }))
    expect(result.plugins).toEqual([plugin])
  })

  it('user plugin replaces preset plugin with same name', () => {
    const presetPlugin = makePlugin('plugin-ts')
    const userPlugin = { ...makePlugin('plugin-ts'), options: { enumType: 'asConst' } as any }
    registerConfigPreset(defineConfigPreset({ name: 'p', plugins: [presetPlugin] }))
    const result = applyPreset(makeConfig({ configPreset: 'p', plugins: [userPlugin] }))
    expect(result.plugins).toHaveLength(1)
    expect(result.plugins?.[0]).toBe(userPlugin)
  })

  it('keeps extra preset plugins not overridden by user', () => {
    const pluginTs = makePlugin('plugin-ts')
    const pluginZod = makePlugin('plugin-zod')
    const userPluginTs = { ...makePlugin('plugin-ts'), options: { enumType: 'asConst' } as any }
    registerConfigPreset(defineConfigPreset({ name: 'p', plugins: [pluginTs, pluginZod] }))
    const result = applyPreset(makeConfig({ configPreset: 'p', plugins: [userPluginTs] }))
    expect(result.plugins).toHaveLength(2)
    expect(result.plugins?.[0]).toBe(pluginZod)
    expect(result.plugins?.[1]).toBe(userPluginTs)
  })

  it('configPreset field is removed from the returned config', () => {
    registerConfigPreset(defineConfigPreset({ name: 'p' }))
    const result = applyPreset(makeConfig({ configPreset: 'p' }))
    expect(result).not.toHaveProperty('configPreset')
  })

  it('does not add undefined adapter/parsers/plugins when preset has none', () => {
    registerConfigPreset(defineConfigPreset({ name: 'empty' }))
    const result = applyPreset(makeConfig({ configPreset: 'empty' }))
    expect(result).not.toHaveProperty('adapter')
    expect(result).not.toHaveProperty('parsers')
    expect(result).not.toHaveProperty('plugins')
  })
})
