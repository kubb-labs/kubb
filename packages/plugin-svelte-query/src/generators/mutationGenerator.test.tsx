import path from 'node:path'
import type { Plugin } from '@kubb/core'
import { createMockedPluginManager, matchFiles } from '#mocks'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { buildOperation, OperationGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { MutationKey, QueryKey } from '../components'
import type { PluginSvelteQuery } from '../types.ts'
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
      path: '/pet/{petId}',
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
      path: '/pet/{petId}',
      method: 'post',
      options: {},
    },
    {
      name: 'updatePetByIdPathParamsObject',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{petId}',
      method: 'post',
      options: {
        pathParamsType: 'object',
      },
    },
    {
      name: 'deletePet',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{petId}',
      method: 'delete',
      options: {},
    },
    {
      name: 'deletePetObject',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{petId}',
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
    options: Partial<PluginSvelteQuery['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginSvelteQuery['resolvedOptions'] = {
      client: {
        dataReturnType: 'data',
        importPath: '@kubb/plugin-client/clients/axios',
      },
      parser: 'zod',
      paramsCasing: undefined,
      paramsType: 'inline',
      pathParamsType: 'inline',
      queryKey: QueryKey.getTransformer,
      mutationKey: MutationKey.getTransformer,
      query: {
        importPath: '@tanstack/svelte-query',
        methods: ['get'],
      },
      mutation: {
        methods: ['post'],
        importPath: '@tanstack/svelte-query',
      },
      output: {
        path: '.',
      },
      group: undefined,
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginSvelteQuery>
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

    const operation = oas.operation(props.path, props.method)
    await buildOperation(operation, {
      fabric,
      instance,
      generator: mutationGenerator,
      options,
    })

    await matchFiles(fabric.files)
  })
})
