import { AsyncEventEmitter } from '@internals/utils'
import { createFabric } from '@kubb/react-fabric'
import { afterEach, describe, expect, it, test, vi } from 'vitest'
import { createPlugin } from './createPlugin.ts'
import { PluginDriver } from './PluginDriver.ts'
import type { Config, KubbEvents, Plugin } from './types.ts'

describe('PluginDriver', () => {
  const pluginAMocks = {
    install: vi.fn(),
    resolvePath: vi.fn(),
  } as const
  const pluginBMocks = {
    install: vi.fn(),
    resolvePath: vi.fn(),
  } as const
  const pluginA = createPlugin(() => {
    return {
      name: 'pluginA',
      options: undefined as any,
      context: undefined as never,

      install() {
        pluginAMocks.install()
      },
      resolvePath() {
        pluginAMocks.resolvePath()

        return 'pluginA/gen'
      },
    }
  })

  const pluginB = createPlugin(() => {
    return {
      name: 'pluginB',
      options: undefined as any,
      context: undefined as never,
      install() {
        pluginBMocks.install()
      },
      resolvePath() {
        pluginBMocks.resolvePath()

        return 'pluginB/gen'
      },
      resolveName() {
        return 'pluginBName'
      },
    }
  })

  const pluginC = createPlugin(() => {
    return {
      name: 'pluginC',
      options: undefined as any,
      context: undefined as never,
      install() {
        pluginBMocks.install()
      },
      resolvePath() {
        pluginBMocks.resolvePath()

        return 'pluginC/gen'
      },
      resolveName() {
        return 'pluginCName'
      },
    }
  })

  const config = {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    plugins: [pluginA({}), pluginB({}), pluginC({})] as Plugin[],
  } satisfies Config
  const pluginDriver = new PluginDriver(config, {
    fabric: createFabric(),
    events: new AsyncEventEmitter<KubbEvents>(),
  })

  afterEach(() => {
    pluginBMocks.resolvePath.mockReset()
    pluginDriver.events.removeAll()
  })

  test('if pluginDriver can be created', () => {
    expect(pluginDriver.plugins.length).toBe(config.plugins.length)
    expect(pluginDriver.getPluginsByName('install', 'pluginB')?.[0]?.name).toBe('pluginB')
  })

  test('hookFirst', async () => {
    const { result, plugin } = await pluginDriver.hookFirst({
      hookName: 'resolvePath',
      parameters: ['path.ts'],
    })

    expect(plugin.name).toBe('pluginA')
    expect(result).toBe('pluginA/gen')

    expect(pluginAMocks.resolvePath).toHaveBeenCalled()
    expect(pluginBMocks.resolvePath).not.toHaveBeenCalled()
  })

  test('hookFirstSync', () => {
    const { result, plugin } = pluginDriver.hookFirstSync({
      hookName: 'resolvePath',
      parameters: ['path.ts'],
    })!

    expect(plugin.name).toBe('pluginA')
    expect(result).toBe('pluginA/gen')

    expect(pluginAMocks.resolvePath).toHaveBeenCalled()

    expect(pluginBMocks.resolvePath).not.toHaveBeenCalled()
  })

  test('hookParallel', async () => {
    await pluginDriver.hookParallel({
      hookName: 'resolvePath',
      parameters: ['path.ts'],
    })

    expect(pluginAMocks.resolvePath).toHaveBeenCalled()
    expect(pluginBMocks.resolvePath).toHaveBeenCalled()
  })

  test('resolvePath without `pluginName`', () => {
    const path = pluginDriver.resolvePath({
      baseName: 'baseName.ts',
    })

    expect(path).toBe('pluginA/gen')
  })
  test('resolvePath with `pluginName`', () => {
    const path = pluginDriver.resolvePath({
      baseName: 'fileNameB.ts',
      pluginName: 'pluginB',
    })

    expect(path).toBe('pluginB/gen')
  })

  test('resolveName without `pluginName`', () => {
    const name = pluginDriver.resolveName({
      name: 'name',
    })

    // pluginA does not have `resolveName` so taking the first plugin that returns a name
    expect(name).toBe('pluginBName')
  })
  test('resolveName with `pluginName`', () => {
    const hooksFirstSyncMock = vi.fn(pluginDriver.hookFirstSync)
    const hookForPluginSyncMock = vi.fn(pluginDriver.hookForPluginSync)

    pluginDriver.hookFirstSync = hooksFirstSyncMock as any
    pluginDriver.hookForPluginSync = hookForPluginSyncMock as any

    const name = pluginDriver.resolveName({
      name: 'nameB',
      pluginName: 'pluginB',
    })

    expect(name).toBe('pluginBName')
    expect(hookForPluginSyncMock).toHaveBeenCalled()
  })

  test('hookForPlugin', async () => {
    pluginBMocks.resolvePath.mockReset()

    await pluginDriver.hookForPlugin({
      pluginName: 'pluginB',
      hookName: 'resolvePath',
      parameters: ['path.ts'],
    })

    expect(pluginBMocks.resolvePath).toHaveBeenCalled()
  })

  test('hookForPluginSync should work with non-function hooks', () => {
    const staticPlugin = createPlugin(() => {
      return {
        name: 'staticPlugin',
        options: undefined as any,
        context: undefined as never,
        resolvePath: 'static/path' as any,
      }
    })

    const staticConfig = {
      ...config,
      plugins: [staticPlugin({})] as Plugin[],
    } satisfies Config

    const staticPluginDriver = new PluginDriver(staticConfig, {
      fabric: createFabric(),
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    const paths = staticPluginDriver.hookForPluginSync({
      pluginName: 'staticPlugin',
      hookName: 'resolvePath',
      parameters: ['path.ts'],
    })

    expect(paths).toEqual(['static/path'])
  })

  it('should handle plugin hook errors gracefully', async () => {
    const errorPlugin = createPlugin(() => {
      return {
        name: 'errorPlugin',
        options: undefined as any,
        context: undefined as never,
        install() {
          throw new Error('Install failed')
        },
      }
    })

    const errorConfig = {
      ...config,
      plugins: [errorPlugin({})] as Plugin[],
    } satisfies Config

    const errorPluginDriver = new PluginDriver(errorConfig, {
      fabric: createFabric(),
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    const errorSpy = vi.fn()
    errorPluginDriver.events.on('error', errorSpy)

    const result = await errorPluginDriver.hookFirst({
      hookName: 'install',
      parameters: [] as any,
    })

    expect(result.result).toBeNull()
    expect(errorSpy).toHaveBeenCalled()
  })

  test('resolvePath should return default path when no plugins have resolvePath', () => {
    const noResolvePlugin = createPlugin(() => {
      return {
        name: 'noResolvePlugin',
        options: undefined as any,
        context: undefined as never,
      }
    })

    const noResolveConfig = {
      ...config,
      plugins: [noResolvePlugin({})] as Plugin[],
    } satisfies Config

    const noResolvePluginDriver = new PluginDriver(noResolveConfig, {
      fabric: createFabric(),
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    const path = noResolvePluginDriver.resolvePath({
      baseName: 'test.ts',
    })

    expect(path).toContain('test.ts')
  })

  test('getFile should create file with correct properties', () => {
    const pluginWithPath = createPlugin(() => ({
      name: 'pluginA',
      options: undefined as any,
      context: undefined as never,
      resolvePath(baseName: string) {
        return `pluginA/gen/${baseName}`
      },
    }))
    const localPluginDriver = new PluginDriver(
      { ...config, plugins: [pluginWithPath({})] as Plugin[] },
      { fabric: createFabric(), events: new AsyncEventEmitter<KubbEvents>() },
    )

    const file = localPluginDriver.getFile({
      name: 'testFile',
      extname: '.ts',
      pluginName: 'pluginA',
    })

    expect(file).toBeDefined()
    expect(file.baseName).toBe('testFile.ts')
    expect(file.path).toBeDefined()
  })

  test('getFile should work with custom mode', () => {
    const pluginWithPath = createPlugin(() => ({
      name: 'pluginA',
      options: undefined as any,
      context: undefined as never,
      resolvePath(baseName: string) {
        return `pluginA/gen/${baseName || 'index.ts'}`
      },
    }))
    const localPluginDriver = new PluginDriver(
      { ...config, plugins: [pluginWithPath({})] as Plugin[] },
      { fabric: createFabric(), events: new AsyncEventEmitter<KubbEvents>() },
    )

    const file = localPluginDriver.getFile({
      name: 'testFile',
      extname: '.ts',
      mode: 'single',
      pluginName: 'pluginA',
    })

    expect(file).toBeDefined()
    // in single mode resolvedName is '', so the plugin receives '.ts' as baseName
    expect(file.baseName).toBe('.ts')
  })

  test('getPluginsByName should return correct plugins', () => {
    const plugins = pluginDriver.getPluginsByName('install', 'pluginB')

    expect(plugins).toBeDefined()
    expect(plugins?.length).toBeGreaterThan(0)
    expect(plugins?.[0]?.name).toBe('pluginB')
  })

  test('getPluginsByName should return empty array for non-existent plugin', () => {
    const plugins = pluginDriver.getPluginsByName('install', 'nonExistent')

    expect(plugins).toEqual([])
  })

  test('should throw when multiple instances of the same plugin are used', () => {
    const duplicatePlugin = createPlugin(() => {
      return {
        name: 'duplicatePlugin',
        options: undefined as any,
        context: undefined as never,
      }
    })

    const duplicateConfig = {
      ...config,
      plugins: [duplicatePlugin({}), duplicatePlugin({})] as Plugin[],
    } satisfies Config

    expect(
      () =>
        new PluginDriver(duplicateConfig, {
          fabric: createFabric(),
          events: new AsyncEventEmitter<KubbEvents>(),
        }),
    ).toThrow('Duplicate plugin "duplicatePlugin" detected')
  })
})
