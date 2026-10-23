import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { createMockedAdapter } from '@kubb/core/mocks'
import { defineExtension, memoryStorage, type UserConfig } from '@kubb/core'
import { describe, expect, test, vi } from 'vitest'
import type { UnpluginBuildContext } from 'unplugin'
import { unpluginFactory } from './unpluginFactory.ts'

type KubbUnpluginOptions = ReturnType<typeof unpluginFactory>

/** The plugin that runs the Kubb build, the first of the two the factory returns. */
function getPluginOptions(options: KubbUnpluginOptions) {
  const [plugin] = Array.isArray(options) ? options : [options]
  if (!plugin) throw new Error('Expected an unplugin option')

  return plugin
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

  test('fails the host build when the config is missing and no kubb.config.ts exists', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'unplugin-kubb-'))
    using _cwd = vi.spyOn(process, 'cwd').mockReturnValue(root)
    const pluginOptions = getPluginOptions(unpluginFactory(undefined, viteMeta))

    await expect(pluginOptions.buildStart?.call(createBuildContext())).rejects.toThrow('[unplugin-kubb] Config is not set')
    await fs.rm(root, { recursive: true, force: true })
  })

  test('loads kubb.config.ts when the config option is not set', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'unplugin-kubb-'))
    using _cwd = vi.spyOn(process, 'cwd').mockReturnValue(root)
    // A config without `input` skips generation, so a load error is the only way this fails.
    await fs.writeFile(path.join(root, 'kubb.config.ts'), "globalThis.__kubbConfigLoaded = true\nexport default { output: { path: './gen' } }\n")
    const pluginOptions = getPluginOptions(unpluginFactory(undefined, viteMeta))

    await pluginOptions.buildStart?.call(createBuildContext())

    expect((globalThis as { __kubbConfigLoaded?: boolean }).__kubbConfigLoaded).toBe(true)
    await fs.rm(root, { recursive: true, force: true })
  })

  test('resolves a relative root from the folder of the kubb.config.ts it finds', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'unplugin-kubb-'))
    await fs.mkdir(path.join(root, 'specs'))
    await fs.mkdir(path.join(root, 'web'))
    await fs.writeFile(path.join(root, 'specs', 'pet.openapi.yaml'), 'openapi: 3.0.0\ninfo: { title: Pets, version: 1.0.0 }\npaths: {}\n')
    await fs.writeFile(path.join(root, 'kubb.config.ts'), "export default { root: './specs', input: './pet.openapi.yaml', output: { path: './gen' } }\n")
    // The bundler runs in a subfolder, so a root resolved from cwd would miss the spec.
    using _cwd = vi.spyOn(process, 'cwd').mockReturnValue(path.join(root, 'web'))
    const pluginOptions = getPluginOptions(unpluginFactory(undefined, viteMeta))

    await expect(pluginOptions.buildStart?.call(createBuildContext())).resolves.toBeUndefined()
    await fs.rm(root, { recursive: true, force: true })
  })

  test('skips the build for a config without input, used only for spec imports', async () => {
    const setup = vi.fn()
    const { input: _input, ...config } = createConfig(setup)
    const pluginOptions = getPluginOptions(unpluginFactory({ config }, viteMeta))

    await pluginOptions.buildStart?.call(createBuildContext())

    expect(setup).not.toHaveBeenCalled()
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
