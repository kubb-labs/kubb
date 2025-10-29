import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { buildOperations, OperationGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { createMockedPluginManager, matchFiles } from '#mocks'
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
    const fabric = createReactFabric()
    const generator = new OperationGenerator(options, {
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

    const operations = await generator.getOperations()

    await buildOperations(
      operations.map((item) => item.operation),
      {
        fabric,
        generator,
        Component: groupedClientGenerator.Operations,
        plugin,
      },
    )

    await matchFiles(fabric.files)
  })
})
