import type { Plugin, PluginRegistry } from '@kubb/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { JSONKubbConfig } from '~/types/agent.ts'
import { mergePlugins } from './mergePlugins.ts'

const makePlugin = (name: string, options: Record<string, unknown> = {}): Plugin => ({ name, options }) as Plugin

function createMockRegistry(): PluginRegistry {
  return {
    registerPlugin: vi.fn(),
    registerAdapter: vi.fn(),
    registerParser: vi.fn(),
    resolvePlugin: vi.fn(async (entry: { name: string; options?: unknown }) => {
      const shortName = entry.name.replace('@kubb/', '')
      return makePlugin(shortName, (entry.options ?? {}) as Record<string, unknown>)
    }),
    resolvePlugins: vi.fn(async (entries: Array<{ name: string; options?: unknown }>) =>
      entries.map(({ name, options }) => {
        const shortName = name.replace('@kubb/', '')
        return makePlugin(shortName, (options ?? {}) as Record<string, unknown>)
      }),
    ),
    resolveAdapter: vi.fn(),
    resolveParser: vi.fn(),
  }
}

let registry: PluginRegistry

beforeEach(() => {
  vi.clearAllMocks()
  registry = createMockRegistry()
})

describe('mergePlugins', () => {
  it('returns undefined when both inputs are undefined', async () => {
    expect(await mergePlugins(registry, undefined, undefined)).toBeUndefined()
  })

  it('returns disk plugins as-is when studio plugins are undefined', async () => {
    const diskPlugins = [makePlugin('plugin-oas', { validate: true })]
    expect(await mergePlugins(registry, diskPlugins, undefined)).toBe(diskPlugins)
  })

  it('resolves and returns studio plugins when disk plugins are undefined', async () => {
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-oas', options: { validate: false } }]
    const result = await mergePlugins(registry, undefined, studioPlugins)
    expect(result).toHaveLength(1)
    expect(result?.[0].name).toBe('plugin-oas')
    expect(result?.[0].options).toMatchObject({ validate: false })
  })

  it('merges studio options into a matching disk plugin, studio takes priority', async () => {
    const diskPlugins = [makePlugin('plugin-oas', { validate: true })]
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-oas', options: { validate: false } }]

    const result = await mergePlugins(registry, diskPlugins, studioPlugins)

    expect(result).toHaveLength(1)
    expect(result?.[0].name).toBe('plugin-oas')
    expect(result?.[0].options).toMatchObject({ validate: false })
  })

  it('returns a fresh plugin instance (not the disk reference) when merging matching plugins', async () => {
    const diskPlugin = makePlugin('plugin-oas', { validate: true })
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-oas', options: { validate: false } }]

    const result = await mergePlugins(registry, [diskPlugin], studioPlugins)

    // Must be a new instance so internal closures reference the merged options
    expect(result?.[0]).not.toBe(diskPlugin)
  })

  it('preserves disk plugins that have no studio counterpart', async () => {
    const pluginTs = makePlugin('plugin-ts', { enumType: 'asConst' })
    const diskPlugins = [makePlugin('plugin-oas', { validate: true }), pluginTs]
    const studioPlugins: JSONKubbConfig['plugins'] = [{ name: '@kubb/plugin-oas', options: { validate: false } }]

    const result = await mergePlugins(registry, diskPlugins, studioPlugins)

    expect(result).toHaveLength(2)
    expect(result?.[1]).toBe(pluginTs)
  })

  it('appends resolved studio plugins not present in disk config', async () => {
    const diskPlugins = [makePlugin('plugin-oas', { validate: true })]
    const studioPlugins: JSONKubbConfig['plugins'] = [
      { name: '@kubb/plugin-oas', options: { validate: false } },
      { name: '@kubb/plugin-ts', options: { enumType: 'enum' } },
    ]

    const result = await mergePlugins(registry, diskPlugins, studioPlugins)

    expect(result).toHaveLength(2)
    expect(result?.[0].name).toBe('plugin-oas')
    expect(result?.[1].name).toBe('plugin-ts')
    expect(result?.[1].options).toMatchObject({ enumType: 'enum' })
  })
})
