import type { Plugin } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import type { JSONKubbConfig } from '~/types/agent.ts'
import { mergePlugins } from './mergePlugins.ts'

describe('mergePlugins', () => {
  it('returns undefined when both disk and studio plugins are undefined', () => {
    const result = mergePlugins(undefined, undefined)
    expect(result).toBeUndefined()
  })

  it('returns disk plugins when studio plugins are undefined', () => {
    const diskPlugins: Plugin[] = [{ name: '@kubb/plugin-oas', options: { validate: true } } as Plugin]
    const result = mergePlugins(diskPlugins, undefined)
    expect(result).toEqual(diskPlugins)
  })

  it('resolves studio plugins when disk plugins are undefined', () => {
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-oas', options: { validate: false } }]
    const result = mergePlugins(undefined, studioPlugins)
    expect(result).toBeDefined()
    expect(result).toHaveLength(1)
    // Plugin name gets transformed by the factory (e.g., @kubb/plugin-oas => plugin-oas)
    expect(result?.[0].name).toBe('plugin-oas')
  })

  it('merges studio options into matching disk plugins', () => {
    const diskPlugins: Plugin[] = [
      {
        name: '@kubb/plugin-oas',
        options: { validate: true, discriminator: 'strict' },
      } as Plugin,
    ]
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-oas', options: { validate: false } }]

    const result = mergePlugins(diskPlugins, studioPlugins)

    expect(result).toHaveLength(1)
    expect(result?.[0].name).toBe('@kubb/plugin-oas')
    expect(result?.[0].options).toEqual({ validate: false, discriminator: 'strict' })
  })

  it('deeply merges nested options', () => {
    const diskPlugins: Plugin[] = [
      {
        name: '@kubb/plugin-ts',
        options: {
          output: { path: 'src/gen' },
          enumType: 'asConst',
          group: { type: 'tag' },
        },
      } as Plugin,
    ]
    const studioPlugins: JSONKubbConfig['plugins'] = [
      {
        name: '@kubb/plugin-ts',
        options: {
          output: { path: 'src/types' },
          enumType: 'enum',
        },
      },
    ]

    const result = mergePlugins(diskPlugins, studioPlugins)

    expect(result).toHaveLength(1)
    expect(result?.[0].options).toEqual({
      output: { path: 'src/types' },
      enumType: 'enum',
      group: { type: 'tag' },
    })
  })

  it('preserves disk plugins without studio overrides', () => {
    const diskPlugins: Plugin[] = [
      {
        name: '@kubb/plugin-oas',
        options: { validate: true },
      } as Plugin,
      {
        name: '@kubb/plugin-ts',
        options: { enumType: 'asConst' },
      } as Plugin,
    ]
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-oas', options: { validate: false } }]

    const result = mergePlugins(diskPlugins, studioPlugins)

    expect(result).toHaveLength(2)
    expect(result?.[0].name).toBe('@kubb/plugin-oas')
    expect(result?.[0].options).toEqual({ validate: false })
    expect(result?.[1].name).toBe('@kubb/plugin-ts')
    expect(result?.[1].options).toEqual({ enumType: 'asConst' })
  })

  it('overrides array values with studio arrays', () => {
    const diskPlugins: Plugin[] = [
      {
        name: '@kubb/plugin-ts',
        options: {
          override: [
            { type: 'operationId', pattern: 'getPets', options: { enumType: 'enum' } },
            { type: 'operationId', pattern: 'getStores', options: { enumType: 'asConst' } },
          ],
        },
      } as Plugin,
    ]
    const studioPlugins: JSONKubbConfig['plugins'] = [
      {
        name: '@kubb/plugin-ts',
        options: {
          override: [{ type: 'operationId', pattern: 'getPets', options: { enumType: 'literal' } }],
        },
      },
    ]

    const result = mergePlugins(diskPlugins, studioPlugins)

    // Arrays should be completely overridden by studio, not merged
    expect(result?.[0].options).toEqual({
      override: [{ type: 'operationId', pattern: 'getPets', options: { enumType: 'literal' } }],
    })
  })

  it('handles plugins with null/undefined options', () => {
    const diskPlugins: Plugin[] = [
      {
        name: '@kubb/plugin-redoc',
        options: {},
      } as Plugin,
    ]
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-redoc', options: {} }]

    const result = mergePlugins(diskPlugins, studioPlugins)

    expect(result).toHaveLength(1)
    expect(result?.[0].options).toEqual({})
  })

  it('resolves studio plugins not present in disk config', () => {
    const diskPlugins: Plugin[] = [{ name: '@kubb/plugin-oas', options: { validate: true } } as Plugin]
    const studioPlugins: JSONKubbConfig['plugins'] = [
      { name: '@kubb/plugin-oas', options: { validate: false } },
      { name: '@kubb/plugin-ts', options: { enumType: 'enum' } },
    ]

    const result = mergePlugins(diskPlugins, studioPlugins)

    expect(result).toHaveLength(2)
    expect(result?.[0].name).toBe('@kubb/plugin-oas')
    expect(result?.[0].options).toEqual({ validate: false })
    // Plugin name gets transformed by the factory
    expect(result?.[1].name).toBe('plugin-ts')
  })
})
