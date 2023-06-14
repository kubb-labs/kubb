import { ParallelPluginError } from './ParallelPluginError.ts'
import { PluginManager } from './PluginManager.ts'

import type { KubbConfig } from '../../types.ts'

describe('ParallelPluginError', () => {
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
    plugins: [],
  }
  const onExecuteMock = vi.fn()
  const queueTaskMock = vi.fn()
  const pluginManager = new PluginManager(config, {
    onExecute: onExecuteMock,
    task: queueTaskMock,
  })

  test('can create custom Error ParallelPluginError', () => {
    const error = new ParallelPluginError('message', { pluginManager, errors: [{ message: 'error1', name: 'name1', pluginManager }] })

    expect(error).toBeDefined()
    expect(error.pluginManager).toBe(pluginManager)
  })

  test.todo('findError')
})
