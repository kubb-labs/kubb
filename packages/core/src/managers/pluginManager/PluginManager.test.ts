import { PluginManager } from './PluginManager.ts'

import { createPlugin } from '../../plugin.ts'

import type { KubbConfig } from '../../types.ts'

describe('PluginManager', () => {
  const pluginAMocks = {
    buildStart: vi.fn(),
    resolvePath: vi.fn(),
  }
  const pluginBMocks = {
    buildStart: vi.fn(),
    resolvePath: vi.fn(),
  }
  const pluginA = createPlugin(() => {
    return {
      name: 'pluginA',
      buildStart() {
        pluginAMocks.buildStart()
      },
      resolvePath() {
        pluginAMocks.resolvePath()

        return 'pluginA'
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

        return 'pluginB'
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
  })

  test('hookFirst', async () => {
    const { result, plugin } = await pluginManager.hookFirst({
      hookName: 'resolvePath',
      parameters: ['path'],
    })

    expect(plugin.name).toBe('pluginA')
    expect(result).toBe('pluginA')

    expect(pluginAMocks.resolvePath).toBeCalled()
    expect(pluginBMocks.resolvePath).not.toBeCalled()
  })
})
