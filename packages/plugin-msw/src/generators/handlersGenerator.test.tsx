import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { buildOperations, OperationGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { createMockedPluginManager, matchFiles } from '#mocks'
import type { PluginMsw } from '../types.ts'
import { handlersGenerator } from './handlersGenerator.tsx'

describe('handlersGenerator operations', async () => {
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
    options: Partial<PluginMsw['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginMsw['resolvedOptions'] = {
      output: {
        path: '.',
      },
      parser: 'data',
      baseURL: undefined,
      group: undefined,
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginMsw>
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
        Component: handlersGenerator.Operations,
        plugin,
      },
    )

    await matchFiles(fabric.files)
  })
})
