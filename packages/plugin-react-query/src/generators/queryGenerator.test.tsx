/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */
import { createOperation, createParameter, createResponse, createSchema } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { Config } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTsLegacy } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperation } from '#mocks'
import { MutationKey, QueryKey } from '../components'
import { resolverReactQuery } from '../resolvers/resolverReactQuery.ts'
import type { PluginReactQuery } from '../types.ts'
import { queryGenerator } from './queryGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [], parsers: [], adapter: createMockedAdapter() }

const defaultOptions: PluginReactQuery['resolvedOptions'] = {
  client: {
    dataReturnType: 'data',
    client: 'axios',
    clientType: 'function',
    bundle: false,
  },
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
  parameters: [createParameter({ name: 'pet_id', in: 'path', schema: createSchema({ type: 'integer' }), required: true })],
  responses: [
    createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'successful operation' }),
    createResponse({ statusCode: '400', schema: createSchema({ type: 'object', properties: [] }), description: 'Invalid ID supplied' }),
  ],
})

const findByStatusNode = createOperation({
  operationId: 'findPetsByStatus',
  method: 'GET',
  path: '/pet/findByStatus',
  tags: ['pet'],
  summary: 'Finds Pets by status',
  description: 'Multiple status values can be provided with comma separated strings',
  parameters: [createParameter({ name: 'status', in: 'query', schema: createSchema({ type: 'string' }) })],
  responses: [
    createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'successful operation' }),
    createResponse({ statusCode: '400', schema: createSchema({ type: 'object', properties: [] }), description: 'Invalid status value' }),
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
  responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Successful operation' })],
})

describe('queryGenerator operation', async () => {
  const testData = [
    {
      name: 'findByTags',
      node: findByTagsNode,
      options: {},
    },
    {
      name: 'findByTagsTemplateString',
      node: findByTagsNode,
      options: {
        client: {
          baseURL: '${123456}',
        },
      },
    },
    {
      name: 'findByTagsPathParamsObject',
      node: findByTagsNode,
      options: {
        pathParamsType: 'object' as const,
      },
    },
    {
      name: 'findByTagsWithZod',
      node: findByTagsNode,
      options: {
        parser: 'zod' as const,
      },
    },
    {
      name: 'findByTagsWithCustomQueryKey',
      node: findByTagsNode,
      options: {
        query: {
          methods: ['get'] as string[],
          importPath: '@tanstack/react-query',
        },
        queryKey(props: Parameters<typeof QueryKey.getTransformer>[0]) {
          const keys = QueryKey.getTransformer(props)
          return ['"test"', ...keys]
        },
      },
    },
    {
      name: 'findByTagsWithCustomOptions',
      node: findByTagsNode,
      options: {
        customOptions: {
          importPath: 'useCustomHookOptions.ts',
          name: 'useCustomHookOptions',
        },
      },
    },
    {
      name: 'clientGetImportPath',
      node: findByTagsNode,
      options: {
        client: {
          dataReturnType: 'data' as const,
          importPath: 'axios',
        },
      },
    },
    {
      name: 'clientDataReturnTypeFull',
      node: findByTagsNode,
      options: {
        client: {
          dataReturnType: 'full' as const,
          client: 'axios',
        },
      },
    },
    {
      name: 'postAsQuery',
      node: postPetIdNode,
      options: {
        query: {
          importPath: 'custom-query',
          methods: ['post'] as string[],
        },
      },
    },
    {
      name: 'findByTagsObject',
      node: findByTagsNode,
      options: {
        paramsType: 'object' as const,
        pathParamsType: 'object' as const,
      },
    },
    {
      name: 'getPetIdCamelCase',
      node: getPetIdNode,
      options: {
        paramsCasing: 'camelcase' as const,
      },
    },
    {
      name: 'findByStatusAllOptional',
      node: findByStatusNode,
      options: {
        paramsType: 'object' as const,
      },
    },
    {
      name: 'findByStatusAllOptionalInline',
      node: findByStatusNode,
      options: {
        paramsType: 'inline' as const,
      },
    },
    {
      name: 'createUsersWithListInputAsQuery',
      node: createUsersWithListNode,
      options: {
        query: {
          importPath: '@tanstack/react-query',
          methods: ['post'] as string[],
        },
      },
    },
  ] as const satisfies Array<{ name: string; node: OperationNode; options: Partial<PluginReactQuery['resolvedOptions']> }>

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

    await renderGeneratorOperation(queryGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverReactQuery,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})
