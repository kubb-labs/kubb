import type { Config } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin } from '@kubb/core/mocks'
import { describe, expect, it } from 'vitest'
import type { BarrelType } from '../types.ts'
import { resolvePluginBarrelType, resolveRootBarrelType } from './resolveBarrelType.ts'

function makeConfig(barrelType?: BarrelType | false): Config {
  return {
    root: '/workspace',
    input: { path: './petstore.yaml' },
    output: { path: 'src/gen', clean: true, ...(barrelType !== undefined ? { barrelType } : {}) },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [],
  } as unknown as Config
}

function makePlugin(barrelType?: BarrelType | false) {
  return createMockedPlugin({
    name: 'plugin-ts',
    options: { output: { path: 'types', ...(barrelType !== undefined ? { barrelType } : {}) } } as any,
  })
}

describe('resolvePluginBarrelType', () => {
  it('uses the explicit plugin option when set', () => {
    expect(resolvePluginBarrelType(makePlugin('all'), makeConfig('named'))).toBe('all')
  })

  it('falls back to the config option when the plugin option is missing', () => {
    expect(resolvePluginBarrelType(makePlugin(), makeConfig('propagate'))).toBe('propagate')
  })

  it("defaults to 'named' when neither is set", () => {
    expect(resolvePluginBarrelType(makePlugin(), makeConfig())).toBe('named')
  })

  it('preserves an explicit `false` on the plugin', () => {
    expect(resolvePluginBarrelType(makePlugin(false), makeConfig('all'))).toBe(false)
  })
})

describe('resolveRootBarrelType', () => {
  it('returns the config option when set', () => {
    expect(resolveRootBarrelType(makeConfig('all'))).toBe('all')
  })

  it("defaults to 'named' when not set", () => {
    expect(resolveRootBarrelType(makeConfig())).toBe('named')
  })

  it('preserves an explicit `false`', () => {
    expect(resolveRootBarrelType(makeConfig(false))).toBe(false)
  })
})
