/* eslint-disable @typescript-eslint/unbound-method */
import { createPlugin } from '../../plugin.ts'
import { hooks, PluginManager } from './PluginManager.ts'

import type { KubbConfig, TransformResult } from '../../types.ts'
import { createLogger } from '../../utils/logger.ts'

describe('PluginManager', () => {
  const pluginAMocks = {
    buildStart: vi.fn(),
    resolvePath: vi.fn(),
    transform: vi.fn(),
  } as const
  const pluginBMocks = {
    buildStart: vi.fn(),
    resolvePath: vi.fn(),
    transform: vi.fn(),
  } as const
  const pluginA = createPlugin(() => {
    return {
      name: 'pluginA',
      buildStart() {
        pluginAMocks.buildStart()
      },
      resolvePath() {
        pluginAMocks.resolvePath()

        return 'pluginA/gen'
      },
      load() {
        return 'id'
      },
      transform(code) {
        pluginAMocks.transform()

        return `${code} pluginA`
      },
    }
  })

  const pluginB = createPlugin(() => {
    return {
      name: 'pluginB',
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
      transform(code) {
        pluginBMocks.transform()

        return `${code} pluginB`
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
    logLevel: 'info',
    plugins: [pluginA({}), pluginB({})],
  } satisfies KubbConfig
  const queueTaskMock = vi.fn()
  const pluginManager = new PluginManager(config, {
    logger: createLogger(),
    task: queueTaskMock,
  })

  test('if pluginManager can be created', () => {
    expect(pluginManager.queue).toBeDefined()
    expect(pluginManager.fileManager).toBeDefined()
    expect(pluginManager.plugins.length).toBe(config.plugins.length + 1)
    expect(hooks).toStrictEqual(['validate', 'buildStart', 'resolvePath', 'resolveName', 'load', 'transform', 'writeFile', 'buildEnd'])
    expect(pluginManager.getPlugin('buildStart', 'pluginB')?.name).toBe('pluginB')
  })

  test('hookFirst', async () => {
    const { result, plugin } = await pluginManager.hookFirst({
      hookName: 'resolvePath',
      parameters: ['path'],
    })

    expect(plugin.name).toBe('pluginA')
    expect(result).toBe('pluginA/gen')

    expect(pluginAMocks.resolvePath).toHaveBeenCalled()
    expect(pluginBMocks.resolvePath).not.toHaveBeenCalled()
  })

  test('hookFirstSync', () => {
    const { result, plugin } = pluginManager.hookFirstSync({
      hookName: 'resolvePath',
      parameters: ['path'],
    })

    expect(plugin.name).toBe('pluginA')
    expect(result).toBe('pluginA/gen')

    expect(pluginAMocks.resolvePath).toHaveBeenCalled()

    expect(pluginBMocks.resolvePath).not.toHaveBeenCalled()
  })

  test('hookParallel', async () => {
    await pluginManager.hookParallel({
      hookName: 'resolvePath',
      parameters: ['path'],
    })

    expect(pluginAMocks.resolvePath).toHaveBeenCalled()
    expect(pluginBMocks.resolvePath).toHaveBeenCalled()
  })

  test('hookReduceArg0', async () => {
    const transformReducerMocks = vi.fn((_previousCode: string, result: TransformResult | Promise<TransformResult>) => {
      return result
    })

    await pluginManager.hookReduceArg0({
      hookName: 'transform',
      parameters: ['code', 'path'],
      reduce: transformReducerMocks,
    })

    expect(transformReducerMocks).toHaveBeenCalledTimes(2)
    // expect(transformReducerMocks).toHaveBeenNthCalledWith(1, 'code', 'code pluginA', expect.anything())
    expect(transformReducerMocks.mock.calls[0]).toEqual(['code', 'code pluginA', expect.anything()])
    // expect(transformReducerMocks).toHaveBeenNthCalledWith(2, 'code', 'code pluginA pluginB', expect.anything())
    expect(transformReducerMocks.mock.calls[1]).toEqual(['code', 'code pluginA pluginB', expect.anything()])

    expect(pluginAMocks.transform).toHaveBeenCalled()
    expect(pluginBMocks.transform).toHaveBeenCalled()
  })

  test('hookSeq', async () => {
    await pluginManager.hookSeq({
      hookName: 'resolvePath',
      parameters: ['path'],
    })

    expect(pluginAMocks.transform).toHaveBeenCalled()
    expect(pluginBMocks.transform).toHaveBeenCalled()
  })

  test('resolvePath without `pluginName`', () => {
    const path = pluginManager.resolvePath({
      fileName: 'fileName',
    })

    expect(path).toBe('pluginA/gen')
  })
  test('resolvePath with `pluginName`', () => {
    const path = pluginManager.resolvePath({
      fileName: 'fileNameB',
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
    await pluginManager.hookForPlugin({
      pluginName: 'pluginB',
      hookName: 'resolvePath',
      parameters: ['path'],
    })

    expect(pluginAMocks.transform).toHaveBeenCalled()
    expect(pluginBMocks.transform).toHaveBeenCalled()
  })
})
