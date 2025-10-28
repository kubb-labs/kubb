import path from 'node:path'
import type { Plugin } from '@kubb/core'
import { createMockedPluginManager, matchFiles } from '#mocks'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { OperationGenerator } from '@kubb/plugin-oas'
import { buildOperations } from '@kubb/plugin-oas/generators'
import { createReactFabric } from '@kubb/react-fabric'
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

    const operations = await instance.getOperations()

    await buildOperations(
      operations.map((item) => item.operation),
      {
        fabric,
        instance,
        generator: serverGenerator,
        options,
      },
    )

    await matchFiles(fabric.files)
  })
})
