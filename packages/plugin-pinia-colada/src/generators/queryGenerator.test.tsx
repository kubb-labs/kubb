import path from 'node:path'
import type { Config, Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'

import { buildOperation, OperationGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { createMockedPluginManager, matchFiles } from '#mocks'
import { MutationKey, QueryKey } from '../components'
import type { PluginPiniaColada } from '../types.ts'
import { queryGenerator } from './queryGenerator.tsx'

describe('queryGenerator operation', async () => {
  const testData = [
    {
      name: 'findByTags',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {},
    },
    {
      name: 'findByTagsPathParamsObject',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        pathParamsType: 'object',
      },
    },
    {
      name: 'findByTagsWithZod',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        parser: 'zod',
      },
    },
    {
      name: 'findByTagsWithCustomQueryKey',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        query: {
          methods: ['get'],
          importPath: '@pinia/colada',
        },
        queryKey(props) {
          const keys = QueryKey.getTransformer(props)
          return ['"test"', ...keys]
        },
      },
    },
    {
      name: 'clientGetImportPath',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        client: {
          dataReturnType: 'data',
          importPath: 'axios',
        },
      },
    },
    {
      name: 'clientDataReturnTypeFull',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        client: {
          dataReturnType: 'full',
          client: 'axios',
        },
      },
    },
    {
      name: 'postAsQuery',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{petId}',
      method: 'post',
      options: {
        query: {
          importPath: '@pinia/colada',
          methods: ['post'],
        },
      },
    },
    {
      name: 'findByTagsObject',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        paramsType: 'object',
        pathParamsType: 'object',
      },
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginPiniaColada['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginPiniaColada['resolvedOptions'] = {
      client: {
        dataReturnType: 'data',
        client: 'axios',
        importPath: undefined,
        bundle: false,
      },
      parser: 'zod',
      paramsType: 'inline',
      paramsCasing: undefined,
      pathParamsType: 'inline',
      queryKey: QueryKey.getTransformer,
      mutationKey: MutationKey.getTransformer,
      query: {
        importPath: '@pinia/colada',
        methods: ['get'],
      },
      mutation: {
        methods: ['post'],
        importPath: '@pinia/colada',
      },
      output: {
        path: '.',
      },
      group: undefined,
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginPiniaColada>
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
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      generator,
      Component: queryGenerator.Operation,
      plugin,
    })

    await matchFiles(fabric.files)
  })
})
