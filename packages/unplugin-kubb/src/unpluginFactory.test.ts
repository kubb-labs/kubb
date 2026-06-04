import path from 'node:path'
import { createMockedAdapter } from '@kubb/core/mocks'
import { ast, definePlugin, type Storage, type UserConfig } from '@kubb/core'
import { describe, expect, test, vi } from 'vitest'
import type { UnpluginBuildContext, UnpluginContext } from 'unplugin'
import nuxtModule from './nuxt.ts'
import { unpluginFactory } from './unpluginFactory.ts'
import vite from './vite.ts'
import webpack from './webpack.ts'

type KubbUnpluginOptions = ReturnType<typeof unpluginFactory>

function getPluginOptions(options: KubbUnpluginOptions) {
  if (Array.isArray(options)) {
    throw new Error('Expected a single unplugin option')
  }

  return options
}

function createBuildContext(): UnpluginBuildContext & UnpluginContext {
  return {
    addWatchFile: vi.fn(),
    emitFile: vi.fn(),
    getWatchFiles: vi.fn(() => []),
    parse: vi.fn(),
    error: vi.fn((reason) => {
      throw typeof reason === 'string' ? new Error(reason) : reason
    }),
    warn: vi.fn(),
  }
}

function createMemoryStorage() {
  const store = new Map<string, string>()
  const clear = vi.fn<Storage['clear']>(async (base) => {
    if (!base) {
      store.clear()
      return
    }

    for (const key of store.keys()) {
      if (key.startsWith(base)) {
        store.delete(key)
      }
    }
  })

  const storage: Storage = {
    name: 'memory',
    async hasItem(key) {
      return store.has(key)
    },
    async getItem(key) {
      return store.get(key) ?? null
    },
    async setItem(key, value) {
      store.set(key, value)
    },
    async removeItem(key) {
      store.delete(key)
    },
    async getKeys(base) {
      const keys = [...store.keys()]
      return base ? keys.filter((key) => key.startsWith(base)) : keys
    },
    clear,
  }

  return { clear, storage, store }
}

describe('unpluginFactory', () => {
  test('creates vite and webpack subpackage plugins', () => {
    expect(vite({ config: { output: { path: './gen' } } })).toMatchObject({ name: 'unplugin-kubb' })
    expect(webpack({ config: { output: { path: './gen' } } })).toBeDefined()
  })

  test('creates a nuxt module that registers vite and webpack integrations', async () => {
    await expect(nuxtModule.getMeta?.()).resolves.toMatchObject({
      name: 'nuxt-unplugin-kubb',
      configKey: 'unpluginKubb',
    })
  })

  test('uses the same generation defaults as defineConfig', async () => {
    const { storage, store } = createMemoryStorage()
    const file = ast.createFile({
      path: 'gen/component.tsx',
      baseName: 'component.tsx',
      imports: [ast.createImport({ name: ['jsx'], path: 'react/jsx-runtime' })],
      sources: [ast.createSource({ nodes: [ast.createText('export const Component = jsx("div", {})')] })],
    })
    const plugin = definePlugin(() => ({
      name: 'plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.injectFile(file)
        },
      },
    }))()
    const config = {
      input: { path: 'https://example.com/openapi.json' },
      output: { path: './gen' },
      adapter: createMockedAdapter(),
      plugins: [plugin],
      storage,
    } satisfies UserConfig
    const pluginOptions = getPluginOptions(unpluginFactory({ config }, { framework: 'vite' }))

    await pluginOptions.buildStart?.call(createBuildContext())

    expect([...store.values()][0]).toContain('react/jsx-runtime')
  })

  test('preserves the configured root during generation', async () => {
    const root = path.resolve(process.cwd(), 'custom-root')
    const { clear, storage } = createMemoryStorage()
    const config = {
      root,
      input: { path: 'https://example.com/openapi.json' },
      output: { path: './gen', clean: true },
      adapter: createMockedAdapter(),
      storage,
    } satisfies UserConfig
    const pluginOptions = getPluginOptions(unpluginFactory({ config }, { framework: 'vite' }))

    await pluginOptions.buildStart?.call(createBuildContext())

    expect(clear).toHaveBeenCalledWith(path.resolve(root, './gen'))
  })

  test('serves generated files as kubb: virtual modules', async () => {
    const file = ast.createFile({
      path: 'gen/component.tsx',
      baseName: 'component.tsx',
      imports: [ast.createImport({ name: ['jsx'], path: 'react/jsx-runtime' })],
      sources: [ast.createSource({ nodes: [ast.createText('export const Component = jsx("div", {})')] })],
    })
    const plugin = definePlugin(() => ({
      name: 'plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.injectFile(file)
        },
      },
    }))()
    const config = {
      input: { path: 'https://example.com/openapi.json' },
      output: { path: './gen' },
      adapter: createMockedAdapter(),
      plugins: [plugin],
    } satisfies UserConfig
    const pluginOptions = getPluginOptions(unpluginFactory({ config, virtual: true }, { framework: 'vite' }))

    await pluginOptions.buildStart?.call(createBuildContext())

    const resolveId = pluginOptions.resolveId
    const load = pluginOptions.load
    const resolved = typeof resolveId === 'function' ? await resolveId.call(createBuildContext(), 'kubb:component.tsx', undefined, { isEntry: false }) : null
    expect(resolved).toBe('\0kubb:component.tsx')

    const loaded = typeof load === 'function' && typeof resolved === 'string' ? await load.call(createBuildContext(), resolved) : null
    expect(loaded).toMatchObject({ code: expect.stringContaining('react/jsx-runtime') })
  })

  test('does not resolve virtual modules when virtual mode is off', async () => {
    const { storage } = createMemoryStorage()
    const config = {
      input: { path: 'https://example.com/openapi.json' },
      output: { path: './gen' },
      adapter: createMockedAdapter(),
      storage,
    } satisfies UserConfig
    const pluginOptions = getPluginOptions(unpluginFactory({ config }, { framework: 'vite' }))

    await pluginOptions.buildStart?.call(createBuildContext())

    const resolveId = pluginOptions.resolveId
    const resolved = typeof resolveId === 'function' ? await resolveId.call(createBuildContext(), 'kubb:component.tsx', undefined, { isEntry: false }) : 'not-a-function'
    expect(resolved).toBeNull()
  })

  test('fails the host build when generation fails', async () => {
    const plugin = definePlugin(() => ({
      name: 'plugin',
      hooks: {
        'kubb:plugin:setup'() {
          throw new Error('setup failed')
        },
      },
    }))()
    const config = {
      input: { path: 'https://example.com/openapi.json' },
      output: { path: './gen' },
      adapter: createMockedAdapter(),
      plugins: [plugin],
    } satisfies UserConfig
    const pluginOptions = getPluginOptions(unpluginFactory({ config }, { framework: 'vite' }))

    await expect(pluginOptions.buildStart?.call(createBuildContext())).rejects.toThrow('[unplugin-kubb]')
  })
})
