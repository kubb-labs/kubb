import path from 'node:path'
import type { Plugin } from '@kubb/core'
import { createMockedPluginManager, matchFiles } from '@kubb/core/mocks'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { buildOperations, OperationGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react'
import type { PluginClient } from '../types.ts'
import { operationsGenerator } from './operationsGenerator.tsx'

describe('operationsGenerator operations', async () => {
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
    const fabric = createReactFabric()
    const instance = new OperationGenerator(options, {
      fabric,
      oas,
      include: undefined,
      pluginManager: createMockedPluginManager(props.name),
      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
      exclude: [],
    })
    await instance.build(operationsGenerator)

    const operations = await instance.getOperations()

    await buildOperations(
      operations.map((item) => item.operation),
      {
        fabric,
        instance,
        generator: operationsGenerator,
        options,
      },
    )

    await matchFiles(fabric.files)
  })
})
