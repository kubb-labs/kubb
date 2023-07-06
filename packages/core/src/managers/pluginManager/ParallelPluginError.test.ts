import { ParallelPluginError } from './ParallelPluginError.ts'
import { PluginManager } from './PluginManager.ts'

import type { KubbConfig } from '../../types.ts'
import { createLogger } from '../../utils/logger.ts'

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
    plugins: [],
  }
  const queueTaskMock = vi.fn()
  const pluginManager = new PluginManager(config, {
    logger: createLogger(),
    task: queueTaskMock,
  })

  test('can create custom Error ParallelPluginError', () => {
    const error = new ParallelPluginError('message', { pluginManager, errors: [{ message: 'error1', cause: new Error(), name: 'name1', pluginManager }] })

    expect(error).toBeDefined()
    expect(error.pluginManager).toBe(pluginManager)
  })

  test.todo('findError')
})
