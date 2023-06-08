import { createPlugin } from '../../plugin.ts'
import { hooks, PluginManager } from './PluginManager.ts'

import type { KubbConfig, KubbPlugin, TransformResult } from '../../types.ts'

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

  const config: KubbConfig = {
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
  }
  const onExecuteMock = vi.fn()
  const queueTaskMock = vi.fn()
  const pluginManager = new PluginManager(config, {
    onExecute: onExecuteMock,
    task: queueTaskMock,
  })

  test('if pluginManager can be created', () => {
    expect(pluginManager.queue).toBeDefined()
    expect(pluginManager.fileManager).toBeDefined()
    expect(pluginManager.plugins.length).toBe(config.plugins!.length + 1)
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

    expect(pluginAMocks.resolvePath).toBeCalled()
    expect(pluginBMocks.resolvePath).not.toBeCalled()
    expect(pluginManager.getExecuter()?.plugin.name).toBe('pluginA')
  })

  test('hookFirstSync', () => {
    const { result, plugin } = pluginManager.hookFirstSync({
      hookName: 'resolvePath',
      parameters: ['path'],
    })

    expect(plugin.name).toBe('pluginA')
    expect(result).toBe('pluginA/gen')

    expect(pluginAMocks.resolvePath).toBeCalled()
    expect(pluginManager.getExecuter()?.plugin.name).toBe('pluginA')
    expect(pluginBMocks.resolvePath).not.toBeCalled()
  })

  test('hookParallel', async () => {
    await pluginManager.hookParallel({
      hookName: 'resolvePath',
      parameters: ['path'],
    })

    expect(pluginAMocks.resolvePath).toBeCalled()
    expect(pluginBMocks.resolvePath).toBeCalled()
    expect(pluginManager.getExecuter()?.plugin.name).toBe('pluginB')
  })

  test('hookReduceArg0', async () => {
    const transformReducerMocks = vi.fn((_previousCode: string, result: TransformResult | Promise<TransformResult>, _plugin: KubbPlugin) => {
      return result
    })

    await pluginManager.hookReduceArg0({
      hookName: 'transform',
      parameters: ['code', 'path'],
      reduce: transformReducerMocks,
    })

    expect(transformReducerMocks).toBeCalledTimes(2)
    expect(transformReducerMocks).toHaveBeenNthCalledWith(1, 'code', 'code pluginA', expect.anything())
    expect(transformReducerMocks).toHaveBeenNthCalledWith(2, 'code', 'code pluginA pluginB', expect.anything())

    expect(pluginAMocks.transform).toBeCalled()
    expect(pluginBMocks.transform).toBeCalled()
    expect(pluginManager.getExecuter()?.plugin.name).toBe('pluginB')
  })

  test('hookSeq', async () => {
    await pluginManager.hookSeq({
      hookName: 'resolvePath',
      parameters: ['path'],
    })

    expect(pluginAMocks.transform).toBeCalled()
    expect(pluginBMocks.transform).toBeCalled()
    expect(pluginManager.getExecuter()?.plugin.name).toBe('pluginB')
  })

  test('resolvePath without `pluginName`', async () => {
    const hooksFirstSyncMock = vi.fn(pluginManager.hookFirstSync)
    const hookForPluginSyncMock = vi.fn(pluginManager.hookForPluginSync)

    pluginManager.hookFirstSync = hooksFirstSyncMock as any
    pluginManager.hookForPluginSync = hookForPluginSyncMock as any

    const path = pluginManager.resolvePath({
      fileName: 'fileName',
    })

    expect(path).toBe('pluginA/gen')
    expect(hookForPluginSyncMock).not.toBeCalled()
    expect(hooksFirstSyncMock).toBeCalledWith({ hookName: 'resolvePath', parameters: ['fileName', undefined, undefined] })
  })
  test('resolvePath with `pluginName`', async () => {
    const hooksFirstSyncMock = vi.fn(pluginManager.hookFirstSync)
    const hookForPluginSyncMock = vi.fn(pluginManager.hookForPluginSync)

    pluginManager.hookFirstSync = hooksFirstSyncMock as any
    pluginManager.hookForPluginSync = hookForPluginSyncMock as any

    const path = pluginManager.resolvePath({
      fileName: 'fileNameB',
      pluginName: 'pluginB',
    })

    expect(path).toBe('pluginB/gen')
    expect(hookForPluginSyncMock).toBeCalled()
  })

  test('resolveName without `pluginName`', async () => {
    const hooksFirstSyncMock = vi.fn(pluginManager.hookFirstSync)
    const hookForPluginSyncMock = vi.fn(pluginManager.hookForPluginSync)

    pluginManager.hookFirstSync = hooksFirstSyncMock as any
    pluginManager.hookForPluginSync = hookForPluginSyncMock as any

    const name = pluginManager.resolveName({
      name: 'name',
    })

    // pluginA does not have `resolveName` so taking the first plugin that returns a name
    expect(name).toBe('pluginBName')
    expect(hookForPluginSyncMock).not.toBeCalled()
    expect(hooksFirstSyncMock).toBeCalledWith({ hookName: 'resolveName', parameters: ['name'] })
  })
  test('resolveName with `pluginName`', async () => {
    const hooksFirstSyncMock = vi.fn(pluginManager.hookFirstSync)
    const hookForPluginSyncMock = vi.fn(pluginManager.hookForPluginSync)

    pluginManager.hookFirstSync = hooksFirstSyncMock as any
    pluginManager.hookForPluginSync = hookForPluginSyncMock as any

    const name = pluginManager.resolveName({
      name: 'nameB',
      pluginName: 'pluginB',
    })

    expect(name).toBe('pluginBName')
    expect(hookForPluginSyncMock).toBeCalled()
  })

  test('load', async () => {
    const hooksFirstMock = vi.fn(pluginManager.hookFirst)

    pluginManager.hookFirst = hooksFirstMock as any
    const { result: name } = await pluginManager.load('id')

    expect(name).toBe('id')
    expect(hooksFirstMock).toBeCalledWith({ hookName: 'load', parameters: ['id'] })
  })

  test('hookForPlugin', async () => {
    await pluginManager.hookForPlugin({
      pluginName: 'pluginB',
      hookName: 'resolvePath',
      parameters: ['path'],
    })

    expect(pluginAMocks.transform).toBeCalled()
    expect(pluginBMocks.transform).toBeCalled()
    expect(pluginManager.getExecuter()?.plugin.name).toBe('pluginB')
  })
})
