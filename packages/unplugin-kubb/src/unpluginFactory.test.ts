import path from 'node:path'
import { ast } from '@kubb/ast'
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

describe('unpluginFactory', () => {
  test('uses the same generation defaults as defineConfig', async () => {
    const storage = memoryStorage()
    const file = ast.factory.createFile({
      path: 'gen/component.tsx',
      baseName: 'component.tsx',
      imports: [ast.factory.createImport({ name: ['jsx'], path: 'react/jsx-runtime' })],
      sources: [ast.factory.createSource({ nodes: [ast.factory.createText('export const Component = jsx("div", {})')] })],
    })
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin' },
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.injectFile(file)
        },
      },
    })()
    const config = {
      input: 'https://example.com/openapi.json',
      output: { path: './gen' },
      adapter: createMockedAdapter(),
      plugins: [plugin],
      storage,
    } satisfies UserConfig
    const pluginOptions = getPluginOptions(unpluginFactory({ config }, viteMeta))

    await pluginOptions.buildStart?.call(createBuildContext())

    const [key = ''] = await storage.readKeys()
    expect(await storage.readItem(key)).toContain('react/jsx-runtime')
  })

  test('preserves the configured root during generation', async () => {
    const root = path.resolve(process.cwd(), 'custom-root')
    const storage = memoryStorage()
    const empty = vi.spyOn(storage, 'empty')
    const config = {
      root,
      input: 'https://example.com/openapi.json',
      output: { path: './gen', clean: true },
      adapter: createMockedAdapter(),
      storage,
    } satisfies UserConfig
    const pluginOptions = getPluginOptions(unpluginFactory({ config }, viteMeta))

    await pluginOptions.buildStart?.call(createBuildContext())

    expect(empty).toHaveBeenCalledWith(path.resolve(root, './gen'))
  })

  test('fails the host build when generation fails', async () => {
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin' },
      hooks: {
        'kubb:plugin:setup'() {
          throw new Error('setup failed')
        },
      },
    })()
    const config = {
      input: 'https://example.com/openapi.json',
      output: { path: './gen' },
      adapter: createMockedAdapter(),
      plugins: [plugin],
    } satisfies UserConfig
    const pluginOptions = getPluginOptions(unpluginFactory({ config }, viteMeta))

    await expect(pluginOptions.buildStart?.call(createBuildContext())).rejects.toThrow('[unplugin-kubb]')
  })

  test('logs a failed generation when the input cannot be read', async () => {
    using log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    using _error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
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

    const lines = log.mock.calls.map(([line]) => String(line))
    expect(lines).toContain('✗ Generation failed')
    expect(lines).not.toContain('✓ Generation succeeded')
    expect(lines.find((line) => line.startsWith('Kubb Summary:'))).toBe('Kubb Summary: ✗ 1 passed | 0 failed (1) | 1 error')
  })

  test('fails the host build when the config is missing', async () => {
    const pluginOptions = getPluginOptions(unpluginFactory(undefined, viteMeta))

    await expect(pluginOptions.buildStart?.call(createBuildContext())).rejects.toThrow('[unplugin-kubb] Config is not set')
  })

  test('generates once when the host starts several builds with one instance', async () => {
    const setup = vi.fn()
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin' },
      hooks: { 'kubb:plugin:setup': setup },
    })()
    const config = {
      input: 'https://example.com/openapi.json',
      output: { path: './gen' },
      adapter: createMockedAdapter(),
      plugins: [plugin],
      storage: memoryStorage(),
    } satisfies UserConfig
    const pluginOptions = getPluginOptions(unpluginFactory({ config }, viteMeta))
    const buildStart = () => pluginOptions.buildStart?.call(createBuildContext())

    await Promise.all([buildStart(), buildStart()])
    await buildStart()

    expect(setup).toHaveBeenCalledTimes(1)
  })

  test('retries generation on the next build after a failed run', async () => {
    const setup = vi.fn().mockImplementationOnce(() => {
      throw new Error('setup failed')
    })
    const plugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin' },
      hooks: { 'kubb:plugin:setup': setup },
    })()
    const config = {
      input: 'https://example.com/openapi.json',
      output: { path: './gen' },
      adapter: createMockedAdapter(),
      plugins: [plugin],
      storage: memoryStorage(),
    } satisfies UserConfig
    const pluginOptions = getPluginOptions(unpluginFactory({ config }, viteMeta))

    await expect(pluginOptions.buildStart?.call(createBuildContext())).rejects.toThrow('[unplugin-kubb]')
    await pluginOptions.buildStart?.call(createBuildContext())

    expect(setup).toHaveBeenCalledTimes(2)
  })
})
