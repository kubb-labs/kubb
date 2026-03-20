import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { OperationGenerator, renderOperation } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, expect, test } from 'vitest'
import { createMockedPlugin, createMockedPluginDriver, matchFiles } from '#mocks'
import { MutationKey, QueryKey } from '../components'
import type { PluginReactQuery } from '../types.ts'
import { mutationGenerator } from './mutationGenerator.tsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('mutationGenerator operation', async () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

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
      name: 'updatePetByIdWithCustomOptions',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{pet_id}',
      method: 'post',
      options: {
        customOptions: {
          importPath: 'useCustomHookOptions.ts',
          name: 'useCustomHookOptions',
        },
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
    {
      name: 'createUsersWithListInput',
      input: '../../mocks/petStore.yaml',
      path: '/user/createWithList',
      method: 'post',
      options: {},
    },
    {
      name: 'requiredOneOfRequestBody',
      input: '../../mocks/requiredOneOfRequestBody.yaml',
      path: '/orders',
      method: 'post',
      options: {},
    },
    {
      name: 'requiredOneOfRequestBodyWithClientPlugin',
      input: '../../mocks/requiredOneOfRequestBody.yaml',
      path: '/orders',
      method: 'post',
      options: {},
      mockClientPlugin: true,
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginReactQuery['resolvedOptions']>
    mockClientPlugin?: boolean
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
      customOptions: undefined,
      output: {
        path: '.',
      },
      group: undefined,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options })
    const mockedPluginDriver = createMockedPluginDriver({ name: props.name })

    if ('mockClientPlugin' in props && props.mockClientPlugin) {
      mockedPluginDriver.getPluginByName = (pluginName) => {
        if (pluginName === 'plugin-client') {
          return { name: 'plugin-client' } as any
        }

        return undefined
      }
    }

    const generator = new OperationGenerator(options, {
      fabric,
      oas,
      include: undefined,
      driver: mockedPluginDriver,

      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
      exclude: [],
    })

    const operation = oas.operation(props.path, props.method)
    await renderOperation(operation, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      generator,
      Component: mutationGenerator.Operation,
      plugin,
    })

    await matchFiles(fabric.files, props.name)
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
      customOptions: undefined,
      output: {
        path: '.',
      },
      group: undefined,
    }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options })
    const mockedPluginDriver = createMockedPluginDriver({ name: 'mutationDisabled' })
    const generator = new OperationGenerator(options, {
      fabric,
      oas,
      include: undefined,
      driver: mockedPluginDriver,

      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
      exclude: [],
    })

    const operation = oas.operation('/pet/{pet_id}', 'post')
    await renderOperation(operation, {
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
