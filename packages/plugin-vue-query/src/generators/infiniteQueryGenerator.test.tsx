import { createMockedPluginManager, matchFiles } from '@kubb/core/mocks'

import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas/parser'
import { OperationGenerator } from '@kubb/plugin-oas'
import { MutationKey, QueryKey } from '../components'
import type { PluginVueQuery } from '../types.ts'
import { infiniteQueryGenerator } from './infiniteQueryGenerator.tsx'

describe('infiniteQueryGenerator operation', async () => {
  const testData = [
    {
      name: 'findInfiniteByTags',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        infinite: {
          queryParam: 'pageSize',
          initialPageParam: 0,
          cursorParam: undefined,
        },
      },
    },
    {
      name: 'findInfiniteByTagsCursor',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        infinite: {
          queryParam: 'pageSize',
          initialPageParam: 0,
          cursorParam: 'cursor',
        },
      },
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginVueQuery['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginVueQuery['resolvedOptions'] = {
      client: {
        dataReturnType: 'data',
        importPath: '@kubb/plugin-client/client',
      },
      parser: 'zod',
      paramsType: 'inline',
      paramsCasing: undefined,
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
      output: {
        path: '.',
      },
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginVueQuery>
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
    await instance.build(infiniteQueryGenerator)

    const operation = oas.operation(props.path, props.method)
    const files = await infiniteQueryGenerator.operation?.({
      operation,
      options,
      instance,
    })

    await matchFiles(files)
  })
})
