import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AsyncEventEmitter, isPromise } from '@internals/utils'
import { createFile, createSource } from '@kubb/ast'
import { afterEach, describe, expect, it, test, vi } from 'vitest'
import { createMockedAdapter } from '#mocks'
import { build, safeBuild } from './build.ts'
import { createPlugin } from './createPlugin.ts'
import { defineConfig } from './defineConfig.ts'
import type { Config, KubbEvents, Plugin, UserConfig } from './types.ts'

describe('build', () => {
  const pluginMocks = {
    buildStart: vi.fn(),
    resolvePath: vi.fn(),
  } as const

  const file = createFile({
    path: 'hello/world.json',
    baseName: 'world.json',
    sources: [createSource({ value: `{ "hello": "world" }` })],
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
    },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [plugin({})] as Array<Plugin>,
  } satisfies Config

  const configs = [
    {
      name: 'simple',
      config,
    },
    {
      name: 'array',
      config: defineConfig([
        {
          root: '.',
          input: {
            path: 'https://petstore3.swagger.io/api/v3/openapi.json',
          },
          output: {
            path: './src/gen',
            clean: true,
          },
          parsers: [],
          adapter: createMockedAdapter(),
          plugins: [plugin({})] as Array<Plugin>,
        },
      ]),
    },
    {
      name: 'function',
      config: defineConfig(() => ({
        root: '.',
        input: {
          path: 'https://petstore3.swagger.io/api/v3/openapi.json',
        },
        output: {
          path: './src/gen',
          clean: true,
        },
        parsers: [],
        adapter: createMockedAdapter(),
        plugins: [plugin({})] as Array<Plugin>,
      })),
    },
    {
      name: 'functionArray',
      config: defineConfig(() => [
        {
          root: '.',
          input: {
            path: 'https://petstore3.swagger.io/api/v3/openapi.json',
          },
          output: {
            path: './src/gen',
            clean: true,
          },
          parsers: [],
          adapter: createMockedAdapter(),
          plugins: [plugin({})] as Array<Plugin>,
        },
      ]),
    },
  ]

  afterEach(() => {
    Object.keys(pluginMocks).forEach((key) => {
      const mock = pluginMocks[key as keyof typeof pluginMocks]

      mock.mockClear()
    })
  })

  test.each(configs)('adding file with config as $name', async ({ config }) => {
    let kubbUserConfig = Promise.resolve(config) as Promise<UserConfig | Array<UserConfig>>

    if (typeof config === 'function') {
      const possiblePromise = config({})
      if (isPromise(possiblePromise)) {
        kubbUserConfig = possiblePromise
      }
      kubbUserConfig = Promise.resolve(possiblePromise)
    }

    let JSONConfig = await kubbUserConfig

    if (!Array.isArray(JSONConfig)) {
      JSONConfig = [JSONConfig]
    }

    for (const config of JSONConfig) {
      const { fabric, driver } = await build({
        config,
        events: new AsyncEventEmitter<KubbEvents>(),
      })

      await fabric.addFile(file)

      expect(fabric.files).toBeDefined()
      expect(driver).toBeDefined()
      expect(fabric.files.length).toBe(1)

      driver.events.removeAll()
    }
  })

  test('if build can run and return created files and the pluginDriver', async () => {
    const { fabric, driver } = await build({
      config,
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    await fabric.addFile(file)

    expect(fabric.files).toBeDefined()
    expect(driver).toBeDefined()
    expect(fabric.files.length).toBe(1)
  })

  test('if build with one plugin is running the different hooks in the correct order', async () => {
    const { fabric } = await build({
      config,
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    await fabric.addFile(file)

    expect(fabric.files.map((file) => ({ ...file, id: undefined, path: undefined }))).toMatchInlineSnapshot(`
      [
        {
          "baseName": "world.json",
          "exports": [],
          "extname": ".json",
          "id": undefined,
          "imports": [],
          "meta": {},
          "name": "world",
          "path": undefined,
          "sources": [
            {
              "value": "{ "hello": "world" }",
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

    const { failedPlugins } = await safeBuild({
      config: errorConfig,
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    expect(failedPlugins.size).toBe(1)
    const failedPlugin = Array.from(failedPlugins)[0]
    expect(failedPlugin?.plugin.name).toBe('errorPlugin')
    expect(failedPlugin?.error.message).toBe('Installation failed')
  })

  it('should emit debug events during build process', async () => {
    const events = new AsyncEventEmitter<KubbEvents>()
    const debugSpy = vi.fn()
    events.on('debug', debugSpy)

    await build({
      config,
      events,
    })

    expect(debugSpy).toHaveBeenCalled()
  })

  it('should handle array input with warning', async () => {
    const events = new AsyncEventEmitter<KubbEvents>()
    const warnSpy = vi.fn()
    events.on('warn', warnSpy)

    const arrayConfig = {
      ...config,
      input: [{ path: 'test1.yaml' }, { path: 'test2.yaml' }],
    } as any

    await build({
      config: arrayConfig,
      events,
    })

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

    const result = await safeBuild({
      config: throwingConfig,
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    expect(result.failedPlugins.size).toBeGreaterThan(0)
  })

  it('should track plugin timings', async () => {
    const { pluginTimings } = await build({
      config,
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    expect(pluginTimings).toBeDefined()
    expect(pluginTimings.size).toBeGreaterThan(0)
  })

  it('should emit plugin lifecycle events', async () => {
    const events = new AsyncEventEmitter<KubbEvents>()
    const startSpy = vi.fn()
    const endSpy = vi.fn()

    events.on('plugin:start', startSpy)
    events.on('plugin:end', endSpy)

    await build({
      config,
      events,
    })

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
            value: 'export const excluded = "excluded"',
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

      const excludeConfig: UserConfig = {
        ...config,
        output: {
          ...config.output,
          path: tmpDir,
          barrelType: 'named' as const,
          write: false,
        },
        plugins: [excludedPlugin({})] as Array<Plugin>,
      }

      const { fabric } = await build({
        config: excludeConfig,
        events: new AsyncEventEmitter<KubbEvents>(),
      })

      const barrelFile = fabric.files.find((f) => f.baseName === 'index.ts')
      if (barrelFile) {
        const hasExcludedExport = barrelFile.exports?.some((e) => e.name?.includes('excluded'))
        expect(hasExcludedExport).toBeFalsy()
      }
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})
