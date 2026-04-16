/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import type { Ast, Config } from '@kubb/core'
import { ast } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperation } from '#mocks'
import { resolverClient } from '../resolvers/resolverClient.ts'
import type { PluginClient } from '../types.ts'
import { clientGenerator } from './clientGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [], parsers: [], adapter: createMockedAdapter() }

const defaultOptions: PluginClient['resolvedOptions'] = {
  dataReturnType: 'data',
  paramsCasing: undefined,
  paramsType: 'inline',
  pathParamsType: 'inline',
  client: 'axios',
  clientType: 'function',
  importPath: undefined,
  bundle: false,
  parser: 'client',
  output: {
    path: '.',
    banner: '/* eslint-disable no-alert, no-console */',
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

// Shared operation nodes
const findByTagsNode = ast.createOperation({
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
})

const updatePetByIdNode = ast.createOperation({
  operationId: 'updatePetWithForm',
  method: 'POST',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
  requestBody: { schema: ast.createSchema({ type: 'object', properties: [] }) },
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
})

const deletePetNode = ast.createOperation({
  operationId: 'deletePet',
  method: 'DELETE',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [
    ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true }),
    ast.createParameter({ name: 'api_key', in: 'header', schema: ast.createSchema({ type: 'string' }) }),
  ],
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'void' }), description: 'successful operation' })],
})

const uploadFileNode = ast.createOperation({
  operationId: 'uploadFile',
  method: 'POST',
  path: '/pet/{petId}/uploadImage',
  tags: ['pet'],
  parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
  requestBody: { contentType: 'multipart/form-data', schema: ast.createSchema({ type: 'object', properties: [] }) },
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
})

const findByStatusNode = ast.createOperation({
  operationId: 'findPetsByStatus',
  method: 'GET',
  path: '/pet/findByStatus',
  tags: ['pet'],
  parameters: [ast.createParameter({ name: 'status', in: 'query', schema: ast.createSchema({ type: 'string' }) })],
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
})

const requiredOneOfRequestBodyNode = ast.createOperation({
  operationId: 'createOrder',
  method: 'POST',
  path: '/orders',
  tags: ['store'],
  requestBody: {
    required: true,
    schema: ast.createSchema({ type: 'union', schemas: [ast.createSchema({ type: 'object', properties: [] }), ast.createSchema({ type: 'string' })] }),
  },
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
})

const dashedPathParamsNode = ast.createOperation({
  operationId: 'getOrganization',
  method: 'GET',
  path: '/organizations/{organization-id}',
  tags: ['organizations'],
  parameters: [ast.createParameter({ name: 'organization-id', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
})

const underscoredPathParamsNode = ast.createOperation({
  operationId: 'getItem',
  method: 'GET',
  path: '/v1/items/{item_id}',
  tags: ['items'],
  parameters: [ast.createParameter({ name: 'item_id', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
})

describe('clientGenerator operation', () => {
  const testData = [
    { name: 'findByTags', node: findByTagsNode, options: {} },
    { name: 'findByTagsWithTemplateString', node: findByTagsNode, options: {}, baseURL: '${123456}' },
    { name: 'findByTagsWithZod', node: findByTagsNode, options: { parser: 'zod' as const } },
    { name: 'findByTagsFull', node: findByTagsNode, options: { dataReturnType: 'full' as const } },
    { name: 'findByTagsWithZodFull', node: findByTagsNode, options: { parser: 'zod' as const, dataReturnType: 'full' as const } },
    { name: 'importPath', node: findByTagsNode, options: { importPath: 'axios' as const } },
    { name: 'findByTagsObject', node: findByTagsNode, options: { paramsType: 'object' as const, pathParamsType: 'object' as const } },
    { name: 'updatePetById', node: updatePetByIdNode, options: {} },
    { name: 'deletePet', node: deletePetNode, options: {} },
    { name: 'deletePetObject', node: deletePetNode, options: { pathParamsType: 'object' as const } },
    { name: 'updatePetByIdClean', node: updatePetByIdNode, options: { urlType: false as const } },
    { name: 'uploadFile', node: uploadFileNode, options: {} },
    { name: 'findByTagsWithBaseURL', node: findByTagsNode, options: {}, baseURL: 'https://petstore3.swagger.io/api/v3' },
    { name: 'findByStatusAllOptional', node: findByStatusNode, options: { paramsType: 'object' as const, pathParamsType: 'object' as const } },
    { name: 'findByStatusAllOptionalInline', node: findByStatusNode, options: { paramsType: 'inline' as const, pathParamsType: 'inline' as const } },
    { name: 'requiredOneOfRequestBody', node: requiredOneOfRequestBodyNode, options: {} },
    { name: 'dashedPathParams', node: dashedPathParamsNode, options: { paramsCasing: 'camelcase' as const, pathParamsType: 'object' as const } },
    { name: 'dashedPathParamsInline', node: dashedPathParamsNode, options: { paramsCasing: 'camelcase' as const, pathParamsType: 'inline' as const } },
    { name: 'underscoredPathParams', node: underscoredPathParamsNode, options: { paramsCasing: 'camelcase' as const, pathParamsType: 'object' as const } },
    {
      name: 'underscoredPathParamsInline',
      node: underscoredPathParamsNode,
      options: { paramsCasing: 'camelcase' as const, pathParamsType: 'inline' as const },
    },
  ] as const satisfies Array<{ name: string; node: Ast.OperationNode; options: Partial<PluginClient['resolvedOptions']>; baseURL?: string }>

  test.each(testData)('$name', async (props) => {
    const options: PluginClient['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginClient>({ name: 'plugin-client', options, resolver: resolverClient })
    const driver = createMockedPluginDriver({ name: props.name, plugin: mockedTsPlugin })

    await renderGeneratorOperation(clientGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter({
        inputNode: { kind: 'Input', schemas: [], operations: [], meta: { baseURL: 'baseURL' in props ? props.baseURL : undefined } },
      }),
      driver,
      plugin,
      options,
      resolver: resolverClient,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})
