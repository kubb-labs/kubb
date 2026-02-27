import type { Plugin } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import type { JSONKubbConfig } from '~/types/agent.ts'
import { mergePlugins } from './mergePlugins.ts'

const makePlugin = (name: string, options: Record<string, unknown> = {}): Plugin => ({ name, options }) as Plugin

describe('mergePlugins', () => {
  it('returns undefined when both inputs are undefined', () => {
    expect(mergePlugins(undefined, undefined)).toBeUndefined()
  })

  it('returns disk plugins as-is when studio plugins are undefined', () => {
    const diskPlugins = [makePlugin('plugin-oas', { validate: true })]
    expect(mergePlugins(diskPlugins, undefined)).toBe(diskPlugins)
  })

  it('resolves and returns studio plugins when disk plugins are undefined', () => {
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-oas', options: { validate: false } }]
    const result = mergePlugins(undefined, studioPlugins)
    expect(result).toHaveLength(1)
    expect(result?.[0].name).toBe('plugin-oas')
    expect(result?.[0].options).toMatchObject({ validate: false })
  })

  it('merges studio options into a matching disk plugin, studio takes priority', () => {
    const diskPlugins = [makePlugin('plugin-oas', { validate: true })]
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-oas', options: { validate: false } }]

    const result = mergePlugins(diskPlugins, studioPlugins)

    expect(result).toHaveLength(1)
    expect(result?.[0].name).toBe('plugin-oas')
    expect(result?.[0].options).toMatchObject({ validate: false })
  })

  it('preserves disk plugins that have no studio counterpart', () => {
    const pluginTs = makePlugin('plugin-ts', { enumType: 'asConst' })
    const diskPlugins = [makePlugin('plugin-oas', { validate: true }), pluginTs]
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-oas', options: { validate: false } }]

    const result = mergePlugins(diskPlugins, studioPlugins)

    expect(result).toHaveLength(2)
    expect(result?.[1]).toBe(pluginTs)
  })

  it('overrides array values entirely with the studio array', () => {
    const diskPlugins = [
      makePlugin('plugin-ts', {
        override: [
          { type: 'operationId', pattern: 'getPets', options: { enumType: 'enum' } },
          { type: 'operationId', pattern: 'getStores', options: { enumType: 'asConst' } },
        ],
      }),
    ]
    const studioPlugins: JSONKubbConfig['plugins'] = [
      { name: '@kubb/plugin-ts', options: { override: [{ type: 'operationId', pattern: 'getPets', options: { enumType: 'literal' } }] } },
    ]

    const result = mergePlugins(diskPlugins, studioPlugins)

    expect(result?.[0].options).toMatchObject({
      override: [{ type: 'operationId', pattern: 'getPets', options: { enumType: 'literal' } }],
    })
  })

  it('appends resolved studio plugins not present in disk config', () => {
    const diskPlugins = [makePlugin('plugin-oas', { validate: true })]
    const studioPlugins: JSONKubbConfig['plugins'] = [
      { name: '@kubb/plugin-oas', options: { validate: false } },
      { name: '@kubb/plugin-ts', options: { enumType: 'enum' } },
    ]

    const result = mergePlugins(diskPlugins, studioPlugins)

    expect(result).toHaveLength(2)
    expect(result?.[0].name).toBe('plugin-oas')
    expect(result?.[1].name).toBe('plugin-ts')
    expect(result?.[1].options).toMatchObject({ enumType: 'enum' })
  })
})
