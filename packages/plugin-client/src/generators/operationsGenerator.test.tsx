import type { Ast, Config } from '@kubb/core'
import { ast } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperations } from '#mocks'
import { resolverClient } from '../resolvers/resolverClient.ts'
import type { PluginClient } from '../types.ts'
import { operationsGenerator } from './operationsGenerator.tsx'

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

const operationNodes: Array<Ast.OperationNode> = [
  ast.createOperation({
    operationId: 'findPetsByTags',
    method: 'GET',
    path: '/pet/findByTags',
    tags: ['pet'],
    parameters: [
      ast.createParameter({
        name: 'tags',
        in: 'query',
        schema: ast.createSchema({ type: 'array', items: [ast.createSchema({ type: 'string' })] }),
        required: true,
      }),
      ast.createParameter({ name: 'status', in: 'query', schema: ast.createSchema({ type: 'string' }) }),
    ],
    responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
  }),
  ast.createOperation({
    operationId: 'updatePetWithForm',
    method: 'POST',
    path: '/pet/{petId}',
    tags: ['pet'],
    parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
    requestBody: { schema: ast.createSchema({ type: 'object', properties: [] }) },
    responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
  }),
  ast.createOperation({
    operationId: 'deletePet',
    method: 'DELETE',
    path: '/pet/{petId}',
    tags: ['pet'],
    parameters: [
      ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true }),
      ast.createParameter({ name: 'api_key', in: 'header', schema: ast.createSchema({ type: 'string' }) }),
    ],
    responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'void' }), description: 'successful operation' })],
  }),
]

describe('operationsGenerator operations', () => {
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

    await renderGeneratorOperations(operationsGenerator, operationNodes, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverClient,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})
