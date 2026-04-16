/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import type { Config } from '@kubb/core'
import { ast } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTsLegacy } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperation } from '#mocks'
import { QueryKey } from '../components'
import { MutationKey } from '../components/MutationKey.tsx'
import { resolverSwr } from '../resolvers/resolverSwr.ts'
import type { PluginSwr } from '../types.ts'
import { mutationGenerator } from './mutationGenerator.tsx'

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
  paramsType: 'inline',
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

// Shared operation nodes — match petStore.yaml operations

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

const updatePetByIdNode = ast.createOperation({
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

const deletePetNode = ast.createOperation({
  operationId: 'deletePet',
  method: 'DELETE',
  path: '/pet/{petId}',
  tags: ['pet'],
  summary: 'Deletes a pet',
  description: 'delete a pet',
  parameters: [
    ast.createParameter({ name: 'api_key', in: 'header', schema: ast.createSchema({ type: 'string' }) }),
    ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'integer' }), required: true }),
  ],
  responses: [ast.createResponse({ statusCode: '400', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Invalid pet value' })],
})

const getPetByIdNode = ast.createOperation({
  operationId: 'getPetById',
  method: 'GET',
  path: '/pet/{petId}',
  tags: ['pet'],
  summary: 'Find pet by ID',
  description: 'Returns a single pet',
  parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'integer' }), required: true })],
  responses: [
    ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' }),
    ast.createResponse({ statusCode: '400', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Invalid ID supplied' }),
    ast.createResponse({ statusCode: '404', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Pet not found' }),
  ],
})

describe('mutationGenerator operation', async () => {
  const testData = [
    {
      name: 'getAsMutation',
      node: findByTagsNode,
      options: {
        mutation: {
          importPath: 'custom-swr/mutation',
          methods: ['get'] as string[],
        },
      },
    },
    {
      name: 'clientPostImportPath',
      node: updatePetByIdNode,
      options: {
        client: {
          dataReturnType: 'data' as const,
          importPath: 'axios',
        },
      },
    },
    {
      name: 'updatePetById',
      node: updatePetByIdNode,
      options: {},
    },
    {
      name: 'updatePetByIdPathParamsObject',
      node: updatePetByIdNode,
      options: {
        pathParamsType: 'object' as const,
      },
    },
    {
      name: 'deletePet',
      node: deletePetNode,
      options: {
        mutation: {
          importPath: 'swr/mutation',
          methods: ['delete'] as string[],
        },
      },
    },
    {
      name: 'deletePetObject',
      node: getPetByIdNode,
      options: {
        paramsType: 'object' as const,
        pathParamsType: 'object' as const,
      },
    },
    {
      name: 'updatePetByIdParamsToTrigger',
      node: updatePetByIdNode,
      options: {
        mutation: {
          importPath: 'swr/mutation',
          methods: ['post'] as string[],
          paramsToTrigger: true,
        },
      },
    },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginSwr['resolvedOptions']> }>

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

    await renderGeneratorOperation(mutationGenerator, props.node, {
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
