/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */
import { createOperation, createParameter, createResponse, createSchema } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { Config } from '@kubb/core'
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
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: undefined } as PluginTs['resolvedOptions'],
  resolver: resolverTsLegacy,
})

// Shared operation nodes
const addPetNode = createOperation({
  operationId: 'addPet',
  method: 'POST',
  path: '/pet',
  tags: ['pet'],
  description: 'Add a new pet to the store',
  summary: 'Add a new pet to the store',
  requestBody: { schema: createSchema({ type: 'object', properties: [] }), required: true },
  responses: [
    createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Successful operation' }),
    createResponse({ statusCode: '405', schema: createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
  ],
})

const updatePetByIdNode = createOperation({
  operationId: 'updatePetWithForm',
  method: 'POST',
  path: '/pet/{petId}',
  tags: ['pet'],
  summary: 'Updates a pet in the store with form data',
  parameters: [
    createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'string' }), required: true }),
    createParameter({ name: 'name', in: 'query', schema: createSchema({ type: 'string' }) }),
    createParameter({ name: 'status', in: 'query', schema: createSchema({ type: 'string' }) }),
  ],
  responses: [
    createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'successful operation' }),
    createResponse({ statusCode: '405', schema: createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
  ],
})

describe('mutationGenerator operation', async () => {
  const testData = [
    {
      name: 'addPet',
      node: addPetNode,
      options: {},
    },
    {
      name: 'mutationImportPath',
      node: addPetNode,
      options: {
        mutation: {
          importPath: 'custom-swr/mutation',
          methods: ['get'] as string[],
        },
      },
    },
    {
      name: 'clientGetImportPath',
      node: addPetNode,
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
      name: 'addPetObject',
      node: addPetNode,
      options: {
        paramsType: 'object' as const,
        pathParamsType: 'object' as const,
      },
    },
    {
      name: 'addPetWithParamsToTrigger',
      node: addPetNode,
      options: {
        mutation: {
          importPath: 'swr/mutation',
          methods: ['post'] as string[],
          paramsToTrigger: true,
        },
      },
    },
  ] as const satisfies Array<{ name: string; node: OperationNode; options: Partial<PluginSwr['resolvedOptions']> }>

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
