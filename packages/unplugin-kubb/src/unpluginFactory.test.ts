import { stripVTControlCharacters } from 'node:util'
import { createMockedAdapter } from '@kubb/core/mocks'
import { defineExtension, memoryStorage, type UserConfig } from '@kubb/core'
import { describe, expect, test, vi } from 'vitest'
import type { UnpluginBuildContext } from 'unplugin'
import { unpluginFactory } from './unpluginFactory.ts'

type KubbUnpluginOptions = ReturnType<typeof unpluginFactory>

function getPluginOptions(options: KubbUnpluginOptions) {
  if (Array.isArray(options)) {
    throw new Error('Expected a single unplugin option')
  }

  return options
}

// unplugin@3's UnpluginContextMeta requires a `versions` map alongside `framework`.
const viteMeta = { framework: 'vite', versions: {} } as const

function createBuildContext(): UnpluginBuildContext {
  return {
    addWatchFile: vi.fn(),
    emitFile: vi.fn(),
    getWatchFiles: vi.fn(() => []),
    parse: vi.fn(),
  }
}

function createConfig(setup: () => void) {
  const plugin = defineExtension({
    kind: 'plugin',
    meta: { name: 'plugin' },
    hooks: { 'kubb:plugin:setup': setup },
  })()

  return {
    input: 'https://example.com/openapi.json',
    output: { path: './gen' },
    adapter: createMockedAdapter(),
    plugins: [plugin],
    storage: memoryStorage(),
  } satisfies UserConfig
}

describe('unpluginFactory', () => {
  test('prints the cli summary of a failed generation when the input cannot be read', async () => {
    using log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const config = {
      input: './missing.yaml',
      output: { path: './gen' },
      adapter: createMockedAdapter({
        async parse() {
          throw new Error('Cannot read the file set as `input`')
        },
      }),
      storage: memoryStorage(),
    } satisfies UserConfig
    const pluginOptions = getPluginOptions(unpluginFactory({ config }, viteMeta))

    await expect(pluginOptions.buildStart?.call(createBuildContext())).rejects.toThrow('[unplugin-kubb]')

    const lines = log.mock.calls.map(([line]) => stripVTControlCharacters(String(line)).trim())
    expect(lines).toContain('Plugins  1 not run')
    expect(lines).toContain('Issues   1 error')
  })

  test('fails the host build when the config is missing', async () => {
    const pluginOptions = getPluginOptions(unpluginFactory(undefined, viteMeta))

    await expect(pluginOptions.buildStart?.call(createBuildContext())).rejects.toThrow('[unplugin-kubb] Config is not set')
  })

  test('generates once when the host starts several builds with one instance', async () => {
    const setup = vi.fn()
    const pluginOptions = getPluginOptions(unpluginFactory({ config: createConfig(setup) }, viteMeta))
    const buildStart = () => pluginOptions.buildStart?.call(createBuildContext())

    await Promise.all([buildStart(), buildStart()])
    await buildStart()

    expect(setup).toHaveBeenCalledTimes(1)
  })

  test('retries generation on the next build after a failed run', async () => {
    const setup = vi.fn().mockImplementationOnce(() => {
      throw new Error('setup failed')
    })
    const pluginOptions = getPluginOptions(unpluginFactory({ config: createConfig(setup) }, viteMeta))

    await expect(pluginOptions.buildStart?.call(createBuildContext())).rejects.toThrow('[unplugin-kubb]')
    await pluginOptions.buildStart?.call(createBuildContext())

    expect(setup).toHaveBeenCalledTimes(2)
  })
})
