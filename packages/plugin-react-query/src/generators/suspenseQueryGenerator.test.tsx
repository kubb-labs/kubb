import path from 'node:path'
import type { Config, Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'

import { buildOperation, OperationGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { createMockedPluginManager, matchFiles } from '#mocks'
import { MutationKey, QueryKey } from '../components'
import type { PluginReactQuery } from '../types.ts'
import { suspenseQueryGenerator } from './suspenseQueryGenerator.tsx'

describe('suspenseQueryGenerator operation', async () => {
  const testData = [
    {
      name: 'findSuspenseByTags',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        suspense: {},
      },
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginReactQuery['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginReactQuery['resolvedOptions'] = {
      client: {
        dataReturnType: 'data',
        client: 'axios',
      },
      bundle: false,
      parser: 'zod',
      paramsCasing: undefined,
      paramsType: 'inline',
      pathParamsType: 'inline',
      queryKey: QueryKey.getTransformer,
      mutationKey: MutationKey.getTransformer,
      query: {
        importPath: '@tanstack/react-query',
        methods: ['get'],
      },
      mutation: {
        methods: ['post'],
        importPath: '@tanstack/react-query',
      },
      infinite: false,
      output: {
        path: '.',
      },
      group: undefined,
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginReactQuery>
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

    const operation = oas.operation(props.path, props.method)

    await buildOperation(operation, {
      config: {} as Config,
      fabric,
      generator,
      Component: suspenseQueryGenerator.Operation,
      plugin,
    })

    await matchFiles(fabric.files)
  })
})
