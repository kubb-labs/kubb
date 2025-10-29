import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'

import { buildOperation, OperationGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { createMockedPluginManager, matchFiles } from '#mocks'
import { MutationKey, QueryKey } from '../components'
import type { PluginSolidQuery } from '../types.ts'
import { mutationGenerator } from './mutationGenerator.tsx'

describe('mutationGenerator operation', async () => {
  const testData = [
    {
      name: 'getAsMutation',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        mutation: {
          importPath: 'custom-swr/mutation',
          methods: ['get'],
        },
      },
    },
    {
      name: 'clientPostImportPath',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{pet_id}',
      method: 'post',
      options: {
        client: {
          dataReturnType: 'data',
          importPath: 'axios',
        },
      },
    },
    {
      name: 'updatePetById',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{pet_id}',
      method: 'post',
      options: {},
    },
    {
      name: 'updatePetByIdPathParamsObject',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{pet_id}',
      method: 'post',
      options: {
        pathParamsType: 'object',
      },
    },
    {
      name: 'deletePet',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{pet_id}',
      method: 'delete',
      options: {},
    },
    {
      name: 'deletePetObject',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{pet_id}',
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
    options: Partial<PluginSolidQuery['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginSolidQuery['resolvedOptions'] = {
      client: {
        dataReturnType: 'data',
        importPath: '@kubb/plugin-client/clients/axios',
      },
      parser: 'zod',
      paramsType: 'inline',
      paramsCasing: undefined,
      pathParamsType: 'inline',
      queryKey: QueryKey.getTransformer,
      mutationKey: MutationKey.getTransformer,
      query: {
        importPath: '@tanstack/solid-query',
        methods: ['get'],
      },
      mutation: {
        methods: ['post'],
        importPath: '@tanstack/solid-query',
      },
      output: {
        path: '.',
      },
      group: undefined,
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginSolidQuery>
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
      fabric,
      generator,
      Component: mutationGenerator.Operation,
      plugin,
    })

    await matchFiles(fabric.files)
  })
})
