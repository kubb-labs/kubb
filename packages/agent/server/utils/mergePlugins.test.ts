import type { Plugin } from '@kubb/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { JSONKubbConfig } from '~/types/agent.ts'
import { mergePlugins } from './mergePlugins.ts'

const makePlugin = (name: string, options: Record<string, unknown> = {}): Plugin => ({ name, options }) as Plugin

// Mock resolvePlugins so mergePlugins doesn't need real plugin packages
vi.mock('./resolvePlugins.ts', () => ({
  resolvePlugins: vi.fn(async (entries: Array<{ name: string; options: unknown }>) =>
    entries.map(({ name, options }) => {
      // Simulate the real behavior: strip '@kubb/' prefix and camelCase → short name used by plugins
      const shortName = name.replace('@kubb/', '')
      return makePlugin(shortName, options as Record<string, unknown>)
    }),
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('mergePlugins', () => {
  it('returns undefined when both inputs are undefined', async () => {
    expect(await mergePlugins(undefined, undefined)).toBeUndefined()
  })

  it('returns disk plugins as-is when studio plugins are undefined', async () => {
    const diskPlugins = [makePlugin('plugin-oas', { validate: true })]
    expect(await mergePlugins(diskPlugins, undefined)).toBe(diskPlugins)
  })

  it('resolves and returns studio plugins when disk plugins are undefined', async () => {
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-oas', options: { validate: false } }]
    const result = await mergePlugins(undefined, studioPlugins)
    expect(result).toHaveLength(1)
    expect(result?.[0].name).toBe('plugin-oas')
    expect(result?.[0].options).toMatchObject({ validate: false })
  })

  it('merges studio options into a matching disk plugin, studio takes priority', async () => {
    const diskPlugins = [makePlugin('plugin-oas', { validate: true })]
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-oas', options: { validate: false } }]

    const result = await mergePlugins(diskPlugins, studioPlugins)

    expect(result).toHaveLength(1)
    expect(result?.[0].name).toBe('plugin-oas')
    expect(result?.[0].options).toMatchObject({ validate: false })
  })

  it('returns a fresh plugin instance (not the disk reference) when merging matching plugins', async () => {
    const diskPlugin = makePlugin('plugin-oas', { validate: true })
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-oas', options: { validate: false } }]

    const result = await mergePlugins([diskPlugin], studioPlugins)

    // Must be a new instance so internal closures reference the merged options
    expect(result?.[0]).not.toBe(diskPlugin)
  })

  it('preserves disk plugins that have no studio counterpart', async () => {
    const pluginTs = makePlugin('plugin-ts', { enumType: 'asConst' })
    const diskPlugins = [makePlugin('plugin-oas', { validate: true }), pluginTs]
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-oas', options: { validate: false } }]

    const result = await mergePlugins(diskPlugins, studioPlugins)

    expect(result).toHaveLength(2)
    expect(result?.[1]).toBe(pluginTs)
  })

  it('appends resolved studio plugins not present in disk config', async () => {
    const diskPlugins = [makePlugin('plugin-oas', { validate: true })]
    const studioPlugins: JSONKubbConfig['plugins'] = [
      { name: '@kubb/plugin-oas', options: { validate: false } },
      { name: '@kubb/plugin-ts', options: { enumType: 'enum' } },
    ]

    const result = await mergePlugins(diskPlugins, studioPlugins)

    expect(result).toHaveLength(2)
    expect(result?.[0].name).toBe('plugin-oas')
    expect(result?.[1].name).toBe('plugin-ts')
    expect(result?.[1].options).toMatchObject({ enumType: 'enum' })
  })

  describe('false opt-out cases', () => {
    it('preserves barrel: false from studio override when disk has a barrel object', async () => {
      const diskPlugins = [makePlugin('plugin-ts', { barrel: { type: 'named' } })]
      const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-ts', options: { barrel: false } }]

      const result = await mergePlugins(diskPlugins, studioPlugins)

      expect(result?.[0].options).toMatchObject({ barrel: false })
    })

    it('preserves barrel object from studio override when disk has barrel: false', async () => {
      const diskPlugins = [makePlugin('plugin-ts', { barrel: false })]
      const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-ts', options: { barrel: { type: 'named' } } }]

      const result = await mergePlugins(diskPlugins, studioPlugins)

      expect(result?.[0].options).toMatchObject({ barrel: { type: 'named' } })
    })

    it('preserves infinite: false from studio override when disk has an infinite object', async () => {
      const diskPlugins = [makePlugin('plugin-react-query', { infinite: { queryParam: 'cursor' } })]
      const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-react-query', options: { infinite: false } }]

      const result = await mergePlugins(diskPlugins, studioPlugins)

      expect(result?.[0].options).toMatchObject({ infinite: false })
    })

    it('preserves query: false from studio override when disk has a query object', async () => {
      const diskPlugins = [makePlugin('plugin-react-query', { query: { methods: ['get'] } })]
      const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-react-query', options: { query: false } }]

      const result = await mergePlugins(diskPlugins, studioPlugins)

      expect(result?.[0].options).toMatchObject({ query: false })
    })

    it('preserves mutation: false from studio override when disk has a mutation object', async () => {
      const diskPlugins = [makePlugin('plugin-react-query', { mutation: { methods: ['post', 'put'] } })]
      const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-react-query', options: { mutation: false } }]

      const result = await mergePlugins(diskPlugins, studioPlugins)

      expect(result?.[0].options).toMatchObject({ mutation: false })
    })
  })
})
