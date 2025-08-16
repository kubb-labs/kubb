import { createMockedPluginManager, matchFiles } from '@kubb/core/mocks'

import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { OperationGenerator } from '@kubb/plugin-oas'
import type { PluginClient } from '../types.ts'
import { groupedClientGenerator } from './groupedClientGenerator.tsx'

describe('groupedClientsGenerators operations', async () => {
  const testData = [
    {
      name: 'findByTags',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {},
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginClient['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginClient['resolvedOptions'] = {
      dataReturnType: 'data',
      paramsType: 'inline',
      paramsCasing: undefined,
      pathParamsType: 'inline',
      importPath: '@kubb/plugin-client/clients/axios',
      baseURL: '',
      parser: 'client',
      output: {
        path: '.',
      },
      group: undefined,
      urlType: 'export',
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginClient>
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
    await instance.build(groupedClientGenerator)

    const operations = await instance.getOperations()

    const files = await groupedClientGenerator.operations?.({
      operations: operations.map((item) => item.operation),
      options,
      instance,
    })

    await matchFiles(files)
  })
})
