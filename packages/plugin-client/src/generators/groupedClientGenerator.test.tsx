import { createOperation, createParameter, createResponse, createSchema } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { Config } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperations } from '#mocks'
import { resolverClient } from '../resolvers/resolverClient.ts'
import type { PluginClient } from '../types.ts'
import { groupedClientGenerator } from './groupedClientGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [], parsers: [], adapter: createMockedAdapter() }

const defaultOptions: PluginClient['resolvedOptions'] = {
  dataReturnType: 'data',
  paramsType: 'inline',
  paramsCasing: undefined,
  pathParamsType: 'inline',
  client: 'axios',
  clientType: 'function',
  importPath: undefined,
  bundle: false,
  parser: 'client',
  output: {
    path: '.',
  },
  exclude: [],
  include: undefined,
  override: [],
  group: undefined,
  urlType: 'export',
  wrapper: undefined,
  baseURL: undefined,
  resolver: resolverClient,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: undefined } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const operationNodes: Array<OperationNode> = [
  createOperation({
    operationId: 'findPetsByTags',
    method: 'GET',
    path: '/pet/findByTags',
    tags: ['pet'],
    parameters: [
      createParameter({ name: 'tags', in: 'query', schema: createSchema({ type: 'array', items: [createSchema({ type: 'string' })] }), required: true }),
      createParameter({ name: 'status', in: 'query', schema: createSchema({ type: 'string' }) }),
    ],
    responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
  }),
  createOperation({
    operationId: 'updatePetWithForm',
    method: 'POST',
    path: '/pet/{petId}',
    tags: ['pet'],
    parameters: [createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'string' }), required: true })],
    requestBody: { schema: createSchema({ type: 'object', properties: [] }) },
    responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
  }),
  createOperation({
    operationId: 'deletePet',
    method: 'DELETE',
    path: '/pet/{petId}',
    tags: ['pet'],
    parameters: [
      createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'string' }), required: true }),
      createParameter({ name: 'api_key', in: 'header', schema: createSchema({ type: 'string' }) }),
    ],
    responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'void' }), description: 'successful operation' })],
  }),
]

describe('groupedClientsGenerators operations', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const testData = [
    {
      name: 'findByTags',
      options: {},
    },
  ] as const satisfies Array<{ name: string; options: Partial<PluginClient['resolvedOptions']> }>

  test.each(testData)('$name', async (props) => {
    const options: PluginClient['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginClient>({ name: 'plugin-client', options, resolver: resolverClient })
    const driver = createMockedPluginDriver({ name: props.name, plugin: mockedTsPlugin })

    await renderGeneratorOperations(groupedClientGenerator, operationNodes, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverClient,
    })

    await matchFiles(fabric.files, props.name)
  })
})
