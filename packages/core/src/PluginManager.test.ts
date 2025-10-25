import { createApp } from '@kubb/fabric-core'
import { createLogger } from './logger.ts'
import { PluginManager } from './PluginManager.ts'
import { createPlugin } from './plugin.ts'

import type { Config, Plugin } from './types.ts'

describe('PluginManager', () => {
  const pluginAMocks = {
    buildStart: vi.fn(),
    resolvePath: vi.fn(),
  } as const
  const pluginBMocks = {
    buildStart: vi.fn(),
    resolvePath: vi.fn(),
  } as const
  const pluginA = createPlugin(() => {
    return {
      name: 'pluginA',
      options: undefined as any,
      context: undefined as never,

      key: ['pluginA'],
      buildStart() {
        pluginAMocks.buildStart()
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
      key: ['pluginB', 1],
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
  })

  const pluginBBis = createPlugin(() => {
    return {
      name: 'pluginB',
      options: undefined as any,
      context: undefined as never,
      key: ['pluginB', 2],
      buildStart() {
        pluginBMocks.buildStart()
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
    app: createApp(),
    logger: createLogger({ logLevel: 3 }),
  })

  afterEach(() => {
    pluginBMocks.resolvePath.mockReset()
  })

  test('if pluginManager can be created', () => {
    expect(pluginManager.plugins.size).toBe(config.plugins.length + 1)
    expect(PluginManager.hooks).toStrictEqual(['buildStart', 'resolvePath', 'resolveName', 'buildEnd'])
    expect(pluginManager.getPluginsByKey('buildStart', ['pluginB'])?.[0]?.name).toBe('pluginB')
  })

  test('hookFirst', async () => {
    const { result, plugin } = await pluginManager.hookFirst({
      hookName: 'resolvePath',
      parameters: ['path.ts'],
      message: '',
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
      message: '',
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
      message: '',
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
    } catch (e) {
      expect(e).toBeDefined()
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

    expect(name).toBe('pluginBName')
    expect(hookForPluginSyncMock).toHaveBeenCalled()
  })

  test('hookForPlugin', async () => {
    await pluginManager.hookForPlugin({
      pluginKey: ['pluginB'],
      hookName: 'resolvePath',
      parameters: ['path.ts'],
      message: '',
    })

    expect(pluginAMocks.resolvePath).toHaveBeenCalled()
    expect(pluginBMocks.resolvePath).toHaveBeenCalled()
  })

  test('if validatePlugins works with 2 plugins', () => {
    expect(PluginManager.getDependedPlugins([{ name: 'pluginA' }, { name: 'pluginB' }, { name: 'pluginC' }] as Plugin[], 'pluginA')).toBeTruthy()
    expect(PluginManager.getDependedPlugins([{ name: 'pluginA' }, { name: 'pluginB' }, { name: 'pluginC' }] as Plugin[], 'pluginB')).toBeTruthy()
    expect(PluginManager.getDependedPlugins([{ name: 'pluginA' }, { name: 'pluginB' }, { name: 'pluginC' }] as Plugin[], ['pluginA', 'pluginC'])).toBeTruthy()
    try {
      PluginManager.getDependedPlugins([{ name: 'pluginA' }, { name: 'pluginB' }, { name: 'pluginC' }] as Plugin[], ['pluginA', 'pluginD'])
    } catch (e) {
      expect(e).toBeDefined()
    }
  })
})
