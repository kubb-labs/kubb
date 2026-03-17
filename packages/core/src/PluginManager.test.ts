import { AsyncEventEmitter } from '@internals/utils'
import { createFabric } from '@kubb/react-fabric'
import { afterEach, describe, expect, it, test, vi } from 'vitest'
import { definePlugin } from './definePlugin.ts'
import { PluginManager } from './PluginManager.ts'
import type { Config, KubbEvents, Plugin } from './types.ts'

describe('PluginManager', () => {
  const pluginAMocks = {
    install: vi.fn(),
    resolvePath: vi.fn(),
  } as const
  const pluginBMocks = {
    install: vi.fn(),
    resolvePath: vi.fn(),
  } as const
  const pluginA = definePlugin(() => {
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

  const pluginB = definePlugin(() => {
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

  const pluginC = definePlugin(() => {
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
  const pluginManager = new PluginManager(config, {
    fabric: createFabric(),
    events: new AsyncEventEmitter<KubbEvents>(),
  })

  afterEach(() => {
    pluginBMocks.resolvePath.mockReset()
    pluginManager.events.removeAll()
  })

  test('if pluginManager can be created', () => {
    expect(pluginManager.plugins.length).toBe(config.plugins.length)
    expect(pluginManager.getPluginsByName('install', 'pluginB')?.[0]?.name).toBe('pluginB')
  })

  test('hookFirst', async () => {
    const { result, plugin } = await pluginManager.hookFirst({
      hookName: 'resolvePath',
      parameters: ['path.ts'],
    })

    expect(plugin.name).toBe('pluginA')
    expect(result).toBe('pluginA/gen')

    expect(pluginAMocks.resolvePath).toHaveBeenCalled()
    expect(pluginBMocks.resolvePath).not.toHaveBeenCalled()
  })

  test('hookFirstSync', () => {
    const { result, plugin } = pluginManager.hookFirstSync({
      hookName: 'resolvePath',
      parameters: ['path.ts'],
    })!

    expect(plugin.name).toBe('pluginA')
    expect(result).toBe('pluginA/gen')

    expect(pluginAMocks.resolvePath).toHaveBeenCalled()

    expect(pluginBMocks.resolvePath).not.toHaveBeenCalled()
  })

  test('hookParallel', async () => {
    await pluginManager.hookParallel({
      hookName: 'resolvePath',
      parameters: ['path.ts'],
    })

    expect(pluginAMocks.resolvePath).toHaveBeenCalled()
    expect(pluginBMocks.resolvePath).toHaveBeenCalled()
  })

  test('resolvePath without `pluginName`', () => {
    const path = pluginManager.resolvePath({
      baseName: 'baseName.ts',
    })

    expect(path).toBe('pluginA/gen')
  })
  test('resolvePath with `pluginName`', () => {
    const path = pluginManager.resolvePath({
      baseName: 'fileNameB.ts',
      pluginName: 'pluginB',
    })

    expect(path).toBe('pluginB/gen')
  })

  test('resolveName without `pluginName`', () => {
    const name = pluginManager.resolveName({
      name: 'name',
    })

    // pluginA does not have `resolveName` so taking the first plugin that returns a name
    expect(name).toBe('pluginBName')
  })
  test('resolveName with `pluginName`', () => {
    const hooksFirstSyncMock = vi.fn(pluginManager.hookFirstSync)
    const hookForPluginSyncMock = vi.fn(pluginManager.hookForPluginSync)

    pluginManager.hookFirstSync = hooksFirstSyncMock as any
    pluginManager.hookForPluginSync = hookForPluginSyncMock as any

    const name = pluginManager.resolveName({
      name: 'nameB',
      pluginName: 'pluginB',
    })

    expect(name).toBe('pluginBName')
    expect(hookForPluginSyncMock).toHaveBeenCalled()
  })

  test('hookForPlugin', async () => {
    pluginBMocks.resolvePath.mockReset()

    await pluginManager.hookForPlugin({
      pluginName: 'pluginB',
      hookName: 'resolvePath',
      parameters: ['path.ts'],
    })

    expect(pluginBMocks.resolvePath).toHaveBeenCalled()
  })

  test('hookForPluginSync should work with non-function hooks', () => {
    const staticPlugin = definePlugin(() => {
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

    const staticPluginManager = new PluginManager(staticConfig, {
      fabric: createFabric(),
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    const paths = staticPluginManager.hookForPluginSync({
      pluginName: 'staticPlugin',
      hookName: 'resolvePath',
      parameters: ['path.ts'],
    })

    expect(paths).toEqual(['static/path'])
  })

  it('should handle plugin hook errors gracefully', async () => {
    const errorPlugin = definePlugin(() => {
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

    const errorPluginManager = new PluginManager(errorConfig, {
      fabric: createFabric(),
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    const errorSpy = vi.fn()
    errorPluginManager.events.on('error', errorSpy)

    const result = await errorPluginManager.hookFirst({
      hookName: 'install',
      parameters: [] as any,
    })

    expect(result.result).toBeNull()
    expect(errorSpy).toHaveBeenCalled()
  })

  test('resolvePath should return default path when no plugins have resolvePath', () => {
    const noResolvePlugin = definePlugin(() => {
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

    const noResolvePluginManager = new PluginManager(noResolveConfig, {
      fabric: createFabric(),
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    const path = noResolvePluginManager.resolvePath({
      baseName: 'test.ts',
    })

    expect(path).toContain('test.ts')
  })

  test('getFile should create file with correct properties', () => {
    const pluginWithPath = definePlugin(() => ({
      name: 'pluginA',
      options: undefined as any,
      context: undefined as never,
      resolvePath(baseName: string) {
        return `pluginA/gen/${baseName}`
      },
    }))
    const localPluginManager = new PluginManager(
      { ...config, plugins: [pluginWithPath({})] as Plugin[] },
      { fabric: createFabric(), events: new AsyncEventEmitter<KubbEvents>() },
    )

    const file = localPluginManager.getFile({
      name: 'testFile',
      extname: '.ts',
      pluginName: 'pluginA',
    })

    expect(file).toBeDefined()
    expect(file.baseName).toBe('testFile.ts')
    expect(file.path).toBeDefined()
  })

  test('getFile should work with custom mode', () => {
    const pluginWithPath = definePlugin(() => ({
      name: 'pluginA',
      options: undefined as any,
      context: undefined as never,
      resolvePath(baseName: string) {
        return `pluginA/gen/${baseName || 'index.ts'}`
      },
    }))
    const localPluginManager = new PluginManager(
      { ...config, plugins: [pluginWithPath({})] as Plugin[] },
      { fabric: createFabric(), events: new AsyncEventEmitter<KubbEvents>() },
    )

    const file = localPluginManager.getFile({
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
    const plugins = pluginManager.getPluginsByName('install', 'pluginB')

    expect(plugins).toBeDefined()
    expect(plugins?.length).toBeGreaterThan(0)
    expect(plugins?.[0]?.name).toBe('pluginB')
  })

  test('getPluginsByName should return empty array for non-existent plugin', () => {
    const plugins = pluginManager.getPluginsByName('install', 'nonExistent')

    expect(plugins).toEqual([])
  })

  test('should throw when multiple instances of the same plugin are used', () => {
    const duplicatePlugin = definePlugin(() => {
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
        new PluginManager(duplicateConfig, {
          fabric: createFabric(),
          events: new AsyncEventEmitter<KubbEvents>(),
        }),
    ).toThrow('Duplicate plugin "duplicatePlugin" detected')
  })
})
