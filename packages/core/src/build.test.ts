import type { KubbFile } from '@kubb/fabric-core/types'
import { build } from './build.ts'
import { definePlugin } from './definePlugin.ts'
import type { Config, KubbEvents, Plugin } from './types.ts'
import { AsyncEventEmitter } from './utils'

describe('build', () => {
  const pluginMocks = {
    install: vi.fn(),
    resolvePath: vi.fn(),
  } as const

  const file: KubbFile.File = {
    path: 'hello/world.json',
    baseName: 'world.json',
    sources: [{ value: `{ "hello": "world" }` }],
  }
  const plugin = definePlugin(() => {
    return {
      name: 'plugin',
      options: undefined as any,
      context: undefined as never,
      key: ['plugin'],
      async install(...params) {
        pluginMocks.install(...params)

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
    plugins: [plugin({})] as Plugin[],
  } satisfies Config

  afterEach(() => {
    Object.keys(pluginMocks).forEach((key) => {
      const mock = pluginMocks[key as keyof typeof pluginMocks]

      mock.mockClear()
    })
  })

  test('if build can run and return created files and the pluginManager', async () => {
    const { fabric, pluginManager } = await build({
      config,
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    await fabric.addFile(file)

    expect(fabric.files).toBeDefined()
    expect(pluginManager).toBeDefined()
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

    expect(pluginMocks.install).toHaveBeenCalledTimes(1)
  })

  it('should handle plugin installation errors', async () => {
    const errorPlugin = definePlugin(() => {
      return {
        name: 'errorPlugin',
        options: undefined as any,
        context: undefined as never,
        key: ['errorPlugin'],
        async install() {
          throw new Error('Installation failed')
        },
      }
    })

    const errorConfig = {
      ...config,
      plugins: [errorPlugin({})] as Plugin[],
    }

    const { failedPlugins } = await build({
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

  it.skip('should generate barrel file when barrelType is set', async () => {
    const indexableFile: KubbFile.File = {
      path: './src/gen/test.ts',
      baseName: 'test.ts',
      sources: [{ value: 'export const test = "test"', isIndexable: true, name: 'test' }],
      meta: { pluginKey: ['plugin'] },
    }

    const barrelPlugin = definePlugin(() => {
      return {
        name: 'barrelPlugin',
        options: { output: { barrelType: 'named' } } as any,
        context: undefined as never,
        key: ['plugin'],
        async install() {
          await this.addFile(indexableFile)
        },
      }
    })

    const barrelConfig = {
      ...config,
      output: {
        ...config.output,
        barrelType: 'named' as const,
        write: false,
      },
      plugins: [barrelPlugin({})] as Plugin[],
    }

    const { fabric } = await build({
      config: barrelConfig,
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    // Check if barrel exports were created
    const hasIndexableFiles = fabric.files.some((f) => f.sources.some((s) => s.isIndexable))
    expect(hasIndexableFiles).toBe(true)
  })

  it.skip('should handle "all" barrel type', async () => {
    const indexableFile: KubbFile.File = {
      path: './src/gen/test.ts',
      baseName: 'test.ts',
      sources: [{ value: 'export const test = "test"', isIndexable: true, name: 'test' }],
      meta: { pluginKey: ['plugin'] },
    }

    const allBarrelPlugin = definePlugin(() => {
      return {
        name: 'allBarrelPlugin',
        options: { output: { barrelType: 'all' } } as any,
        context: undefined as never,
        key: ['plugin'],
        async install() {
          await this.addFile(indexableFile)
        },
      }
    })

    const allBarrelConfig = {
      ...config,
      output: {
        ...config.output,
        barrelType: 'all' as const,
        write: false,
      },
      plugins: [allBarrelPlugin({})] as Plugin[],
    }

    const { fabric } = await build({
      config: allBarrelConfig,
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    // Check if indexable files exist
    const hasIndexableFiles = fabric.files.some((f) => f.sources.some((s) => s.isIndexable))
    expect(hasIndexableFiles).toBe(true)
  })

  test('safeBuild should return error instead of throwing', async () => {
    const throwingPlugin = definePlugin(() => {
      return {
        name: 'throwingPlugin',
        options: undefined as any,
        context: undefined as never,
        key: ['throwingPlugin'],
        async install() {
          throw new Error('Critical error')
        },
      }
    })

    const throwingConfig = {
      ...config,
      plugins: [throwingPlugin({})] as Plugin[],
    }

    const result = await build({
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
    const indexableFile: KubbFile.File = {
      path: 'src/gen/mocks/excluded.ts',
      baseName: 'excluded.ts',
      sources: [{ value: 'export const excluded = "excluded"', isIndexable: true, name: 'excluded' }],
      meta: { pluginKey: ['excludedPlugin'] },
    }

    const excludedPlugin = definePlugin(() => {
      return {
        name: 'excludedPlugin',
        options: { output: { barrelType: false } } as any,
        context: undefined as never,
        key: ['excludedPlugin'],
        async install() {
          await this.addFile(indexableFile)
        },
      }
    })

    const excludeConfig = {
      ...config,
      output: {
        ...config.output,
        barrelType: 'named' as const,
      },
      plugins: [excludedPlugin({})] as Plugin[],
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
  })
})
