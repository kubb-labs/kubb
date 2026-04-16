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
import { suspenseQueryGenerator } from './suspenseQueryGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [], parsers: [], adapter: createMockedAdapter() }

const defaultOptions: PluginReactQuery['resolvedOptions'] = {
  client: {
    dataReturnType: 'data',
    client: 'axios',
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

describe('suspenseQueryGenerator operation', async () => {
  const testData = [
    {
      name: 'findSuspenseByTags',
      node: findByTagsNode,
      options: {
        suspense: {},
      },
    },
    {
      name: 'findSuspenseByTagsWithCustomOptions',
      node: findByTagsNode,
      options: {
        suspense: {},
        customOptions: {
          importPath: 'useCustomHookOptions.ts',
          name: 'useCustomHookOptions',
        },
      },
    },
    {
      name: 'findSuspenseByStatusAllOptional',
      node: findByStatusNode,
      options: {
        paramsType: 'object' as const,
        suspense: {},
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

    await renderGeneratorOperation(suspenseQueryGenerator, props.node, {
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
