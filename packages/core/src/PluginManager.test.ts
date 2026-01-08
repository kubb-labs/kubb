import { createFabric } from '@kubb/react-fabric'
import { afterEach, describe, expect, it, test, vi } from 'vitest'
import { definePlugin } from './definePlugin.ts'
import { PluginManager } from './PluginManager.ts'
import type { Config, KubbEvents, Plugin } from './types.ts'
import { AsyncEventEmitter } from './utils/AsyncEventEmitter.ts'

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

      key: ['pluginA'],
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
      key: ['pluginB', 1],
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

  const pluginBBis = definePlugin(() => {
    return {
      name: 'pluginB',
      options: undefined as any,
      context: undefined as never,
      key: ['pluginB', 2],
      install() {
        pluginBMocks.install()
      },
      resolvePath() {
        pluginBMocks.resolvePath()

        return 'pluginBBis/gen'
      },
      resolveName() {
        return 'pluginBBisName'
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
    plugins: [pluginA({}), pluginB({}), pluginBBis({})] as Plugin[],
  } satisfies Config
  const pluginManager = new PluginManager(config, {
    fabric: createFabric(),
    events: new AsyncEventEmitter<KubbEvents>(),
  })

  afterEach(() => {
    pluginBMocks.resolvePath.mockReset()
  })

  test('if pluginManager can be created', () => {
    expect(pluginManager.plugins.length).toBe(config.plugins.length)
    expect(pluginManager.getPluginsByKey('install', ['pluginB'])?.[0]?.name).toBe('pluginB')
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
    })

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

  test('resolvePath without `pluginKey`', () => {
    const path = pluginManager.resolvePath({
      baseName: 'baseName.ts',
    })

    expect(path).toBe('pluginA/gen')
  })
  test('resolvePath with `pluginKey`', () => {
    const path = pluginManager.resolvePath({
      baseName: 'fileNameB.ts',
      pluginKey: ['pluginB', 1],
    })

    expect(path).toBe('pluginB/gen')
  })

  test('resolvePath with `pluginKey` that will run on first `pluginB` variant', () => {
    try {
      pluginManager.resolvePath({
        baseName: 'fileNameB.ts',
        pluginKey: ['pluginB'],
      })
    } catch (error) {
      expect(error).toBeDefined()
    }
  })

  test('resolveName without `pluginKey`', () => {
    const name = pluginManager.resolveName({
      name: 'name',
    })

    // pluginA does not have `resolveName` so taking the first plugin that returns a name
    expect(name).toBe('pluginBName')
  })
  test('resolveName with `pluginKey`', () => {
    const hooksFirstSyncMock = vi.fn(pluginManager.hookFirstSync)
    const hookForPluginSyncMock = vi.fn(pluginManager.hookForPluginSync)

    pluginManager.hookFirstSync = hooksFirstSyncMock as any
    pluginManager.hookForPluginSync = hookForPluginSyncMock as any

    const name = pluginManager.resolveName({
      name: 'nameB',
      pluginKey: ['pluginB', '1'],
    })

    // Since 'pluginBName' was already used in the previous test, this should return 'pluginBName2'
    expect(name).toBe('pluginBName2')
    expect(hookForPluginSyncMock).toHaveBeenCalled()
  })

  test('hookForPlugin', async () => {
    await pluginManager.hookForPlugin({
      pluginKey: ['pluginB'],
      hookName: 'resolvePath',
      parameters: ['path.ts'],
    })

    expect(pluginAMocks.resolvePath).toHaveBeenCalled()
    expect(pluginBMocks.resolvePath).toHaveBeenCalled()
  })

  test('hookForPluginSync should work with non-function hooks', () => {
    const staticPlugin = definePlugin(() => {
      return {
        name: 'staticPlugin',
        options: undefined as any,
        context: undefined as never,
        key: ['staticPlugin'],
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
      pluginKey: ['staticPlugin'],
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
        key: ['errorPlugin'],
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
        key: ['noResolvePlugin'],
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
    const file = pluginManager.getFile({
      name: 'testFile',
      extname: '.ts',
      pluginKey: ['pluginA'],
    })

    expect(file).toBeDefined()
    expect(file.baseName).toBe('testFile.ts')
    expect(file.path).toBeDefined()
  })

  test('getFile should work with custom mode', () => {
    const file = pluginManager.getFile({
      name: 'testFile',
      extname: '.ts',
      mode: 'single',
      pluginKey: ['pluginA'],
    })

    expect(file).toBeDefined()
    expect(file.baseName).toBe('testFile.ts')
  })

  test('getPluginsByKey should return correct plugins', () => {
    const plugins = pluginManager.getPluginsByKey('install', ['pluginB'])

    expect(plugins).toBeDefined()
    expect(plugins?.length).toBeGreaterThan(0)
    expect(plugins?.[0]?.name).toBe('pluginB')
  })

  test('getPluginsByKey should return empty array for non-existent plugin', () => {
    const plugins = pluginManager.getPluginsByKey('install', ['nonExistent'])

    expect(plugins).toEqual([])
  })

  test('resolveName should handle duplicate schema names', () => {
    const resolvePlugin = definePlugin(() => {
      return {
        name: 'resolvePlugin',
        options: undefined as any,
        context: undefined as never,
        key: ['resolvePlugin'],
        resolveName(name: string) {
          // Simulate pascalCase transformation that could create duplicates
          // e.g., "get-maintenance-200" -> "GetMaintenance200"
          return name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')
        },
      }
    })

    const resolveConfig = {
      ...config,
      plugins: [resolvePlugin({})] as Plugin[],
    } satisfies Config

    const resolvePluginManager = new PluginManager(resolveConfig, {
      fabric: createFabric(),
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    // First call with "get-maintenance-200" should return "GetMaintenance200"
    const name1 = resolvePluginManager.resolveName({
      name: 'get-maintenance-200',
      pluginKey: ['resolvePlugin'],
      type: 'type',
    })

    // Second call with similar name should return "GetMaintenance2002" (with number suffix)
    const name2 = resolvePluginManager.resolveName({
      name: 'get-maintenance-200',
      pluginKey: ['resolvePlugin'],
      type: 'type',
    })

    // Third call with different input that resolves to same name should also get unique suffix
    const name3 = resolvePluginManager.resolveName({
      name: 'getMaintenance200',
      pluginKey: ['resolvePlugin'],
      type: 'type',
    })

    expect(name1).toBe('GetMaintenance200')
    expect(name2).toBe('GetMaintenance2002')
    expect(name3).toBe('GetMaintenance2003')
  })
})
