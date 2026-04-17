import { AsyncEventEmitter } from '@internals/utils'
import { createMockedAdapter, createMockedPlugin } from '@kubb/core/mocks'
import { afterEach, describe, expect, it, test, vi } from 'vitest'
import { PluginDriver } from './PluginDriver.ts'
import type { Config, KubbHooks, NormalizedPlugin, PluginParameter } from './types.ts'

describe('PluginDriver', () => {
  const pluginAMocks = {
    buildStart: vi.fn(),
    resolvePath: vi.fn(),
  } as const
  const pluginBMocks = {
    buildStart: vi.fn(),
    resolvePath: vi.fn(),
  } as const
  const pluginA = {
    name: 'pluginA',
    options: undefined as unknown as NormalizedPlugin['options'],
    buildStart() {
      pluginAMocks.buildStart()
    },
    resolvePath() {
      pluginAMocks.resolvePath()

      return 'pluginA/gen'
    },
  }

  const pluginB = {
    name: 'pluginB',
    options: undefined as unknown as NormalizedPlugin['options'],
    buildStart() {
      pluginBMocks.buildStart()
    },
    resolvePath() {
      pluginBMocks.resolvePath()

      return 'pluginB/gen'
    },
    resolveName() {
      return 'pluginBName'
    },
  }

  const pluginC = {
    name: 'pluginC',
    options: undefined as unknown as NormalizedPlugin['options'],
    buildStart() {
      pluginBMocks.buildStart()
    },
    resolvePath() {
      pluginBMocks.resolvePath()

      return 'pluginC/gen'
    },
    resolveName() {
      return 'pluginCName'
    },
  }

  const config = {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [pluginA, pluginB, pluginC] as unknown as Array<NormalizedPlugin>,
  } satisfies Config
  const pluginDriver = new PluginDriver(config, {
    hooks: new AsyncEventEmitter<KubbHooks>(),
  })

  afterEach(() => {
    pluginBMocks.resolvePath.mockReset()
    pluginDriver.hooks.removeAll()
  })

  test('if pluginDriver can be created', () => {
    expect(pluginDriver.plugins.size).toBe(config.plugins.length)
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

    pluginDriver.hookFirstSync = hooksFirstSyncMock as unknown as typeof pluginDriver.hookFirstSync
    pluginDriver.hookForPluginSync = hookForPluginSyncMock as unknown as typeof pluginDriver.hookForPluginSync

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
    const staticPlugin = {
      name: 'staticPlugin',
      options: undefined as unknown as NormalizedPlugin['options'],
      resolvePath: 'static/path' as unknown as NonNullable<PluginParameter<'resolvePath'>>[0],
    }

    const staticConfig = {
      ...config,
      plugins: [staticPlugin] as unknown as Array<NormalizedPlugin>,
    } satisfies Config

    const staticPluginDriver = new PluginDriver(staticConfig, {
      hooks: new AsyncEventEmitter<KubbHooks>(),
    })

    const paths = staticPluginDriver.hookForPluginSync({
      pluginName: 'staticPlugin',
      hookName: 'resolvePath',
      parameters: ['path.ts'],
    })

    expect(paths).toEqual(['static/path'])
  })

  it('should handle plugin hook errors gracefully', async () => {
    const errorPlugin = {
      name: 'errorPlugin',
      options: undefined as unknown as NormalizedPlugin['options'],
      buildStart() {
        throw new Error('Install failed')
      },
    }

    const errorConfig = {
      ...config,
      plugins: [errorPlugin] as unknown as Array<NormalizedPlugin>,
    } satisfies Config

    const errorPluginDriver = new PluginDriver(errorConfig, {
      hooks: new AsyncEventEmitter<KubbHooks>(),
    })

    const errorSpy = vi.fn()
    errorPluginDriver.hooks.on('kubb:error', errorSpy)

    const result = await errorPluginDriver.hookFirst({
      hookName: 'buildStart',
      parameters: [] as unknown as PluginParameter<'buildStart'>,
    })

    expect(result.result).toBeNull()
    expect(errorSpy).toHaveBeenCalled()
  })

  test('resolvePath should return default path when no plugins have resolvePath', () => {
    const noResolvePlugin = createMockedPlugin({ name: 'noResolvePlugin', options: undefined as unknown as NormalizedPlugin['options'] })

    const noResolveConfig = {
      ...config,
      plugins: [noResolvePlugin] as unknown as Array<NormalizedPlugin>,
    } satisfies Config

    const noResolvePluginDriver = new PluginDriver(noResolveConfig, {
      hooks: new AsyncEventEmitter<KubbHooks>(),
    })

    const path = noResolvePluginDriver.resolvePath({
      baseName: 'test.ts',
    })

    expect(path).toContain('test.ts')
  })

  test('getFile should create file with correct properties', () => {
    const pluginWithPath = {
      name: 'pluginA',
      options: undefined as unknown as NormalizedPlugin['options'],
      resolvePath(baseName: string) {
        return `pluginA/gen/${baseName}`
      },
    }
    const localPluginDriver = new PluginDriver(
      { ...config, plugins: [pluginWithPath] as unknown as Array<NormalizedPlugin> },
      { hooks: new AsyncEventEmitter<KubbHooks>() },
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
    const pluginWithPath = {
      name: 'pluginA',
      options: undefined as unknown as NormalizedPlugin['options'],
      resolvePath(baseName: string) {
        return `pluginA/gen/${baseName || 'index.ts'}`
      },
    }
    const localPluginDriver = new PluginDriver(
      { ...config, plugins: [pluginWithPath] as unknown as Array<NormalizedPlugin> },
      { hooks: new AsyncEventEmitter<KubbHooks>() },
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
})
