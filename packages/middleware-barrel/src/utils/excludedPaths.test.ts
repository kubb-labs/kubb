import { createMockedAdapter, createMockedPlugin } from '@kubb/core/mocks'
import type { Config } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { getPluginOutputPrefix, isExcludedPath } from './excludedPaths.ts'

function makeConfig(): Config {
  return {
    root: '/workspace',
    input: { path: './petstore.yaml' },
    output: { path: 'src/gen', clean: true },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [],
  } as unknown as Config
}

describe('getPluginOutputPrefix', () => {
  it('joins root, output and plugin output paths with a trailing separator', () => {
    const plugin = createMockedPlugin({ name: 'plugin-ts', options: { output: { path: 'types' } } as any })

    expect(getPluginOutputPrefix(plugin, makeConfig())).toBe('/workspace/src/gen/types/')
  })
})

describe('isExcludedPath', () => {
  const prefixes = new Set(['/workspace/src/gen/types/', '/workspace/src/gen/schemas/'])

  it('returns true when the path lies under a known prefix', () => {
    expect(isExcludedPath('/workspace/src/gen/types/pet.ts', prefixes)).toBe(true)
  })

  it('returns false when no prefix matches', () => {
    expect(isExcludedPath('/workspace/src/gen/clients/petClient.ts', prefixes)).toBe(false)
  })

  it('does not treat sibling directories sharing a prefix as a match', () => {
    expect(isExcludedPath('/workspace/src/gen/typesExtra/pet.ts', prefixes)).toBe(false)
  })

  it('returns false for an empty prefix set', () => {
    expect(isExcludedPath('/workspace/src/gen/types/pet.ts', new Set())).toBe(false)
  })
})
