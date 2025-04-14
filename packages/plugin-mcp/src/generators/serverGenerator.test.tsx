import { createMockedPluginManager, matchFiles } from '@kubb/core/mocks'

import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { OperationGenerator } from '@kubb/plugin-oas'
import type { PluginMcp } from '../types.ts'
import { serverGenerator } from './serverGenerator.tsx'

describe('operationsGenerator operations', async () => {
  const testData = [
    {
      name: 'showPetById',
      input: '../../mocks/petStore.yaml',
      path: '/pets/{petId}',
      method: 'get',
      options: {},
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginMcp['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginMcp['resolvedOptions'] = {
      client: {
        importPath: '@kubb/plugin-client/clients/axios',
        baseURL: '',
        dataReturnType: 'data',
      },
      output: {
        path: '.',
      },
      group: undefined,
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginMcp>
    const instance = new OperationGenerator(options, {
      oas,
      include: undefined,
      pluginManager: createMockedPluginManager(props.name),
      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
      exclude: [],
    })
    await instance.build(serverGenerator)

    const operations = Object.values(instance.operationsByMethod).map((item) => Object.values(item).map((item) => item.operation))

    const files = await serverGenerator.operations?.({
      operations: operations.flat().filter(Boolean),
      operationsByMethod: instance.operationsByMethod,
      options,
      instance,
    })

    await matchFiles(files)
  })
})
