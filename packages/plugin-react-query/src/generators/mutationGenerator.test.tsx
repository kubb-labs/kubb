import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config, Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { buildOperation, OperationGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { describe, expect, test } from 'vitest'
import { createMockedPluginManager, matchFiles } from '#mocks'
import { MutationKey, QueryKey } from '../components'
import type { PluginReactQuery } from '../types.ts'
import { mutationGenerator } from './mutationGenerator.tsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
    options: Partial<PluginReactQuery['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginReactQuery['resolvedOptions'] = {
      client: {
        dataReturnType: 'data',
        client: 'axios',
        bundle: false,
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
      suspense: false,
      infinite: false,
      output: {
        path: '.',
      },
      group: undefined,
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginReactQuery>
    const fabric = createReactFabric()
    const mockedPluginManager = createMockedPluginManager(props.name)
    const generator = new OperationGenerator(options, {
      fabric,
      oas,
      include: undefined,
      pluginManager: mockedPluginManager,

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
      Component: mutationGenerator.Operation,
      plugin,
    })

    await matchFiles(fabric.files)
  })

  test('mutation disabled with mutation: false', async () => {
    const oas = await parse(path.resolve(__dirname, '../../mocks/petStore.yaml'))

    const options: PluginReactQuery['resolvedOptions'] = {
      client: {
        dataReturnType: 'data',
        client: 'axios',
        bundle: false,
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
      mutation: false,
      suspense: false,
      infinite: false,
      output: {
        path: '.',
      },
      group: undefined,
    }
    const plugin = { options } as Plugin<PluginReactQuery>
    const fabric = createReactFabric()
    const mockedPluginManager = createMockedPluginManager('mutationDisabled')
    const generator = new OperationGenerator(options, {
      fabric,
      oas,
      include: undefined,
      pluginManager: mockedPluginManager,

      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
      exclude: [],
    })

    const operation = oas.operation('/pet/{pet_id}', 'post')
    await buildOperation(operation, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      generator,
      Component: mutationGenerator.Operation,
      plugin,
    })

    // When mutation: false, no files should be generated for POST operations
    expect(fabric.files).toHaveLength(0)
  })
})
