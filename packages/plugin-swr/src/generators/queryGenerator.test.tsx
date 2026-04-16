/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import type { Ast, Config } from '@kubb/core'
import { ast } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTsLegacy } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperation } from '#mocks'
import { QueryKey } from '../components'
import { MutationKey } from '../components/MutationKey.tsx'
import { resolverSwr } from '../resolvers/resolverSwr.ts'
import type { PluginSwr } from '../types.ts'
import { queryGenerator } from './queryGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [], parsers: [], adapter: createMockedAdapter() }

const defaultOptions: PluginSwr['resolvedOptions'] = {
  client: {
    dataReturnType: 'data',
    client: 'axios',
    importPath: undefined,
    bundle: false,
  },
  paramsCasing: undefined,
  queryKey: QueryKey.getTransformer,
  mutationKey: MutationKey.getTransformer,
  query: {
    importPath: 'swr',
    methods: ['get'],
  },
  mutation: {
    importPath: 'swr/mutation',
    methods: ['post'],
  },
  paramsType: 'object',
  pathParamsType: 'inline',
  parser: 'client',
  output: {
    path: '.',
  },
  group: undefined,
  exclude: [],
  include: undefined,
  override: [],
  resolver: resolverSwr,
  transformers: {},
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: undefined } as PluginTs['resolvedOptions'],
  resolver: resolverTsLegacy,
})

// Shared operation nodes
const findByTagsNode = ast.createOperation({
  operationId: 'findPetsByTags',
  method: 'GET',
  path: '/pet/findByTags',
  tags: ['pet'],
  description: 'Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.',
  summary: 'Finds Pets by tags',
  parameters: [
    ast.createParameter({
      name: 'tags',
      in: 'query',
      schema: ast.createSchema({ type: 'array', items: [ast.createSchema({ type: 'string' })] }),
      required: true,
    }),
    ast.createParameter({ name: 'status', in: 'query', schema: ast.createSchema({ type: 'string' }) }),
  ],
  responses: [
    ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' }),
    ast.createResponse({ statusCode: '400', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Invalid tag value' }),
  ],
})

const postAsQueryNode = ast.createOperation({
  operationId: 'updatePetWithForm',
  method: 'POST',
  path: '/pet/{petId}',
  tags: ['pet'],
  summary: 'Updates a pet in the store with form data',
  parameters: [
    ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true }),
    ast.createParameter({ name: 'name', in: 'query', schema: ast.createSchema({ type: 'string' }) }),
    ast.createParameter({ name: 'status', in: 'query', schema: ast.createSchema({ type: 'string' }) }),
  ],
  responses: [
    ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' }),
    ast.createResponse({ statusCode: '405', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
  ],
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
      node: postAsQueryNode,
      options: {
        query: {
          importPath: 'custom-swr',
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
  ] as const satisfies Array<{ name: string; node: Ast.OperationNode; options: Partial<PluginSwr['resolvedOptions']> }>

  test.each(testData)('$name', async (props) => {
    const options: PluginSwr['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
      client: {
        ...defaultOptions.client,
        ...('client' in props.options ? props.options.client : {}),
      },
    }
    const plugin = createMockedPlugin<PluginSwr>({ name: 'plugin-swr', options, resolver: resolverSwr })
    const driver = createMockedPluginDriver({ name: props.name, plugin: mockedTsPlugin })

    await renderGeneratorOperation(queryGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverSwr,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})
