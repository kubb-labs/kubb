import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AsyncEventEmitter } from '@internals/utils'
import { createFile, createSource, createText } from '@kubb/ast'
import { afterEach, describe, expect, it, test, vi } from 'vitest'
import { createMockedAdapter } from '#mocks'
import { createKubb } from './createKubb.ts'
import { createPlugin } from './createPlugin.ts'
import { definePlugin } from './definePlugin.ts'
import type { Config, KubbHooks, Plugin } from './types.ts'

describe('createKubb', () => {
  const pluginMocks = {
    buildStart: vi.fn(),
    resolvePath: vi.fn(),
  } as const

  const file = createFile({
    path: 'hello/world.json',
    baseName: 'world.json',
    sources: [createSource({ nodes: [createText(`{ "hello": "world" }`)] })],
    imports: [],
    exports: [],
  })
  const plugin = createPlugin(() => {
    return {
      name: 'plugin',
      options: undefined as any,
      context: undefined as never,
      async buildStart(...params) {
        pluginMocks.buildStart(...params)

        await this.addFile(file)
      },
    }
  })

  const config = {
    root: '.',
    input: {
      path: 'https://petstore3.swagger.io/api/v3/openapi.json',
    },
    output: {
      path: './src/gen',
      clean: true,
      barrelType: false as const,
    },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [plugin({})] as Array<Plugin>,
  } satisfies Config

  afterEach(() => {
    Object.keys(pluginMocks).forEach((key) => {
      const mock = pluginMocks[key as keyof typeof pluginMocks]

      mock.mockClear()
    })
  })

  test('if build can run and return created files and the pluginDriver', async () => {
    const { driver } = await createKubb({
      config,
      hooks: new AsyncEventEmitter<KubbHooks>(),
    }).build()

    expect(driver.fileManager.files).toBeDefined()
    expect(driver).toBeDefined()
    // The plugin's buildStart already added the file during build
    expect(driver.fileManager.files.some((f) => f.baseName === file.baseName)).toBe(true)
  })

  test('if build with one plugin is running the different hooks in the correct order', async () => {
    const { driver } = await createKubb({
      config,
      hooks: new AsyncEventEmitter<KubbHooks>(),
    }).build()

    expect(driver.fileManager.files.map((file) => ({ ...file, id: undefined, path: undefined }))).toMatchInlineSnapshot(`
      [
        {
          "baseName": "world.json",
          "exports": [],
          "extname": ".json",
          "id": undefined,
          "imports": [],
          "kind": "File",
          "meta": {},
          "name": "world",
          "path": undefined,
          "sources": [
            {
              "kind": "Source",
              "nodes": [
                {
                  "kind": "Text",
                  "value": "{ "hello": "world" }",
                },
              ],
            },
          ],
        },
      ]
    `)

    expect(pluginMocks.buildStart).toHaveBeenCalledTimes(1)
  })

  it('should handle plugin installation errors', async () => {
    const errorPlugin = createPlugin(() => {
      return {
        name: 'errorPlugin',
        options: undefined as any,
        context: undefined as never,
        async buildStart() {
          throw new Error('Installation failed')
        },
      }
    })

    const errorConfig = {
      ...config,
      plugins: [errorPlugin({})] as Array<Plugin>,
    }

    const { failedPlugins } = await createKubb({
      config: errorConfig,
      hooks: new AsyncEventEmitter<KubbHooks>(),
    }).safeBuild()

    expect(failedPlugins.size).toBe(1)
    const failedPlugin = Array.from(failedPlugins)[0]
    expect(failedPlugin?.plugin.name).toBe('errorPlugin')
    expect(failedPlugin?.error.message).toBe('Installation failed')
  })

  it('should emit debug events during build process', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const debugSpy = vi.fn()
    hooks.on('kubb:debug', debugSpy)

    await createKubb({
      config,
      hooks,
    }).build()
  })

  it('should handle array input with warning', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const warnSpy = vi.fn()
    hooks.on('kubb:warn', warnSpy)

    const arrayConfig = {
      ...config,
      input: [{ path: 'test1.yaml' }, { path: 'test2.yaml' }],
    } as any

    await createKubb({
      config: arrayConfig,
      hooks,
    }).build()

    expect(warnSpy).toHaveBeenCalledWith('This feature is still under development — use with caution')
  })

  it.todo('should generate barrel file when barrelType is set')

  it.todo('should handle "all" barrel type')

  test('safeBuild should return error instead of throwing', async () => {
    const throwingPlugin = createPlugin(() => {
      return {
        name: 'throwingPlugin',
        options: undefined as any,
        context: undefined as never,
        async buildStart() {
          throw new Error('Critical error')
        },
      }
    })

    const throwingConfig = {
      ...config,
      plugins: [throwingPlugin({})] as Array<Plugin>,
    }

    const result = await createKubb({
      config: throwingConfig,
      hooks: new AsyncEventEmitter<KubbHooks>(),
    }).safeBuild()

    expect(result.failedPlugins.size).toBeGreaterThan(0)
  })

  it('should track plugin timings', async () => {
    const { pluginTimings } = await createKubb({
      config,
      hooks: new AsyncEventEmitter<KubbHooks>(),
    }).build()

    expect(pluginTimings).toBeDefined()
    expect(pluginTimings.size).toBeGreaterThan(0)
  })

  it('should emit plugin lifecycle events', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const startSpy = vi.fn()
    const endSpy = vi.fn()

    hooks.on('kubb:plugin:start', startSpy)
    hooks.on('kubb:plugin:end', endSpy)

    await createKubb({
      config,
      hooks,
    }).build()

    expect(startSpy).toHaveBeenCalled()
    expect(endSpy).toHaveBeenCalled()
  })

  it('should not include files with barrelType false in barrel', async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'kubb-test-excluded-'))

    try {
      const indexableFile = createFile({
        path: join(tmpDir, 'mocks/excluded.ts'),
        baseName: 'excluded.ts',
        sources: [
          createSource({
            nodes: [createText('export const excluded = "excluded"')],
            isIndexable: true,
            name: 'excluded',
          }),
        ],
        imports: [],
        exports: [],
        meta: { pluginName: 'excludedPlugin' },
      })

      const excludedPlugin = createPlugin(() => {
        return {
          name: 'excludedPlugin',
          options: { output: { barrelType: false } } as any,
          context: undefined as never,
          async buildStart() {
            await this.addFile(indexableFile)
          },
        }
      })

      const excludeConfig: Config = {
        ...config,
        output: {
          ...config.output,
          path: tmpDir,
          barrelType: 'named' as const,
          write: false,
        },
        plugins: [excludedPlugin({})] as Array<Plugin>,
      }

      const { driver } = await createKubb({
        config: excludeConfig,
        hooks: new AsyncEventEmitter<KubbHooks>(),
      }).build()

      const barrelFile = driver.fileManager.files.find((f) => f.baseName === 'index.ts')
      if (barrelFile) {
        const hasExcludedExport = barrelFile.exports?.some((e) => e.name?.includes('excluded'))
        expect(hasExcludedExport).toBeFalsy()
      }
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('cleans up hook-style plugin listeners between builds on shared hooks', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({
            name: 'hook-gen',
            operations: vi.fn(),
          })
        },
      },
    }))()
    const hookConfig = { ...config, plugins: [hookPlugin as unknown as Plugin] } satisfies Config

    await createKubb({ config: hookConfig, hooks }).build()
    await createKubb({ config: hookConfig, hooks }).build()

    expect(hooks.listenerCount('kubb:plugin:setup')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:schema')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:operation')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:operations')).toBe(0)
  })
})
