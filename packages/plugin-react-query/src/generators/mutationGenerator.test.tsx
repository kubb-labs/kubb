/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */
import { createOperation, createParameter, createResponse, createSchema } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { Config } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTsLegacy } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperation } from '#mocks'
import { MutationKey, QueryKey } from '../components'
import { resolverReactQuery } from '../resolvers/resolverReactQuery.ts'
import type { PluginReactQuery } from '../types.ts'
import { mutationGenerator } from './mutationGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [], parsers: [], adapter: createMockedAdapter() }

const defaultOptions: PluginReactQuery['resolvedOptions'] = {
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
  exclude: [],
  include: undefined,
  override: [],
  output: {
    path: '.',
  },
  group: undefined,
  resolver: resolverReactQuery,
  transformers: {},
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: undefined } as PluginTs['resolvedOptions'],
  resolver: resolverTsLegacy,
})

// Shared operation nodes
const findByTagsNode = createOperation({
  operationId: 'findPetsByTags',
  method: 'GET',
  path: '/pet/findByTags',
  tags: ['pet'],
  description: 'Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.',
  summary: 'Finds Pets by tags',
  parameters: [
    createParameter({ name: 'tags', in: 'query', schema: createSchema({ type: 'array', items: [createSchema({ type: 'string' })] }), required: true }),
    createParameter({ name: 'status', in: 'query', schema: createSchema({ type: 'string' }) }),
  ],
  responses: [
    createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'successful operation' }),
    createResponse({ statusCode: '400', schema: createSchema({ type: 'object', properties: [] }), description: 'Invalid tag value' }),
  ],
})

const postPetIdNode = createOperation({
  operationId: 'updatePetWithForm',
  method: 'POST',
  path: '/pet/{pet_id}',
  tags: ['pet'],
  summary: 'Updates a pet in the store with form data',
  parameters: [
    createParameter({ name: 'pet_id', in: 'path', schema: createSchema({ type: 'string' }), required: true }),
    createParameter({ name: 'name', in: 'query', schema: createSchema({ type: 'string' }) }),
    createParameter({ name: 'status', in: 'query', schema: createSchema({ type: 'string' }) }),
  ],
  responses: [
    createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'successful operation' }),
    createResponse({ statusCode: '405', schema: createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
  ],
})

const getPetIdNode = createOperation({
  operationId: 'getPetById',
  method: 'GET',
  path: '/pet/{pet_id}',
  tags: ['pet'],
  summary: 'Find pet by ID',
  description: 'Returns a single pet',
  parameters: [
    createParameter({ name: 'pet_id', in: 'path', schema: createSchema({ type: 'integer' }), required: true }),
  ],
  responses: [
    createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'successful operation' }),
    createResponse({ statusCode: '400', schema: createSchema({ type: 'object', properties: [] }), description: 'Invalid ID supplied' }),
  ],
})

const deletePetIdNode = createOperation({
  operationId: 'deletePet',
  method: 'DELETE',
  path: '/pet/{pet_id}',
  tags: ['pet'],
  summary: 'Deletes a pet',
  description: 'delete a pet',
  parameters: [
    createParameter({ name: 'pet_id', in: 'path', schema: createSchema({ type: 'integer' }), required: true }),
  ],
  responses: [
    createResponse({ statusCode: '400', schema: createSchema({ type: 'object', properties: [] }), description: 'Invalid pet value' }),
  ],
})

const createUsersWithListNode = createOperation({
  operationId: 'createUsersWithListInput',
  method: 'POST',
  path: '/user/createWithList',
  tags: ['user'],
  summary: 'Creates list of users with given input array',
  requestBody: {
    required: true,
    schema: createSchema({ type: 'array', items: [createSchema({ type: 'object', properties: [] })] }),
  },
  responses: [
    createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Successful operation' }),
  ],
})

const ordersNode = createOperation({
  operationId: 'createOrder',
  method: 'POST',
  path: '/orders',
  parameters: [
    createParameter({ name: 'X-Trace-Id', in: 'header', schema: createSchema({ type: 'string' }) }),
  ],
  requestBody: {
    required: true,
    schema: createSchema({ type: 'object', properties: [] }),
  },
  responses: [
    createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'ok' }),
  ],
})

describe('mutationGenerator operation', async () => {
  const testData = [
    {
      name: 'getAsMutation',
      node: findByTagsNode,
      options: {
        query: {
          importPath: '@tanstack/react-query',
          methods: [] as string[],
        },
        mutation: {
          importPath: 'custom-swr/mutation',
          methods: ['get'] as string[],
        },
      },
    },
    {
      name: 'clientPostImportPath',
      node: postPetIdNode,
      options: {
        client: {
          dataReturnType: 'data' as const,
          importPath: 'axios',
        },
      },
    },
    {
      name: 'updatePetById',
      node: postPetIdNode,
      options: {},
    },
    {
      name: 'updatePetByIdPathParamsObject',
      node: postPetIdNode,
      options: {
        pathParamsType: 'object' as const,
      },
    },
    {
      name: 'updatePetByIdWithCustomOptions',
      node: postPetIdNode,
      options: {
        customOptions: {
          importPath: 'useCustomHookOptions.ts',
          name: 'useCustomHookOptions',
        },
      },
    },
    {
      name: 'deletePet',
      node: deletePetIdNode,
      options: {
        mutation: {
          importPath: '@tanstack/react-query',
          methods: ['post', 'delete'] as string[],
        },
      },
    },
    {
      name: 'deletePetObject',
      node: getPetIdNode,
      options: {
        paramsType: 'object' as const,
        pathParamsType: 'object' as const,
        query: {
          importPath: '@tanstack/react-query',
          methods: [] as string[],
        },
        mutation: {
          importPath: '@tanstack/react-query',
          methods: ['get'] as string[],
        },
      },
    },
    {
      name: 'createUsersWithListInput',
      node: createUsersWithListNode,
      options: {},
    },
    {
      name: 'requiredOneOfRequestBody',
      node: ordersNode,
      options: {},
    },
    {
      name: 'requiredOneOfRequestBodyWithClientPlugin',
      node: ordersNode,
      options: {},
      mockClientPlugin: true,
    },
  ] as const satisfies Array<{ name: string; node: OperationNode; options: Partial<PluginReactQuery['resolvedOptions']>; mockClientPlugin?: boolean }>

  test.each(testData)('$name', async (props) => {
    const options: PluginReactQuery['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
      client: {
        ...defaultOptions.client,
        ...('client' in props.options ? props.options.client : {}),
      },
    }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMockedPluginDriver({ name: props.name, plugin: mockedTsPlugin })

    if ('mockClientPlugin' in props && props.mockClientPlugin) {
      const originalGetPlugin = driver.getPlugin.bind(driver)
      driver.getPlugin = (pluginName: string) => {
        if (pluginName === 'plugin-client') {
          return { name: 'plugin-client' } as any
        }

        return originalGetPlugin(pluginName)
      }
    }

    await renderGeneratorOperation(mutationGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverReactQuery,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })

  test('mutation disabled with mutation: false', async () => {
    const options: PluginReactQuery['resolvedOptions'] = {
      ...defaultOptions,
      mutation: false,
    }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMockedPluginDriver({ name: 'mutationDisabled', plugin: mockedTsPlugin })

    await renderGeneratorOperation(mutationGenerator, postPetIdNode, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverReactQuery,
    })

    // When mutation: false, no files should be generated for POST operations
    expect(driver.fileManager.files).toHaveLength(0)
  })
})
