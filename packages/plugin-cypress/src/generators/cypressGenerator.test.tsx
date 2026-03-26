/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */
import { createOperation, createParameter, createResponse, createSchema } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { Config } from '@kubb/core'
import { renderOperation } from '@kubb/core'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles } from '#mocks'
import { resolverCypress } from '../resolvers'
import type { PluginCypress } from '../types.ts'
import { cypressGenerator } from './cypressGenerator.tsx'

describe('cypressGenerator operation', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const testData = [
    {
      name: 'showPetById',
      node: createOperation({
        operationId: 'showPetById',
        method: 'GET',
        path: '/pets/:petId',
        tags: ['pets'],
        parameters: [createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'string' }), required: true })],
        responses: [
          createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Expected response to a valid request' }),
          createResponse({ statusCode: 'default', schema: createSchema({ type: 'object', properties: [] }), description: 'Unexpected error' }),
        ],
      }),
      options: {},
    },
    {
      name: 'getPets',
      node: createOperation({
        operationId: 'listPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [createParameter({ name: 'limit', in: 'query', schema: createSchema({ type: 'string' }) })],
        responses: [
          createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'A paged array of pets' }),
          createResponse({ statusCode: 'default', schema: createSchema({ type: 'object', properties: [] }), description: 'Unexpected error' }),
        ],
      }),
      options: {},
    },
    {
      name: 'getPetsWithTemplateString',
      node: createOperation({
        operationId: 'listPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [createParameter({ name: 'limit', in: 'query', schema: createSchema({ type: 'string' }) })],
        responses: [
          createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'A paged array of pets' }),
          createResponse({ statusCode: 'default', schema: createSchema({ type: 'object', properties: [] }), description: 'Unexpected error' }),
        ],
      }),
      options: {
        baseURL: '${123456}',
      },
    },
    {
      name: 'createPet',
      node: createOperation({
        operationId: 'createPets',
        method: 'POST',
        path: '/pets',
        tags: ['pets'],
        requestBody: {
          description: 'Pet to create',
          schema: createSchema({ type: 'object', properties: [] }),
        },
        responses: [
          createResponse({ statusCode: '201', schema: createSchema({ type: 'void' }), description: 'Null response' }),
          createResponse({ statusCode: 'default', schema: createSchema({ type: 'object', properties: [] }), description: 'Unexpected error' }),
        ],
      }),
      options: {},
    },
    {
      name: 'updatePet',
      node: createOperation({
        operationId: 'updatePet',
        method: 'PUT',
        path: '/pets/:petId',
        tags: ['pets'],
        parameters: [createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'string' }), required: true })],
        requestBody: {
          description: 'Pet to update',
          schema: createSchema({ type: 'object', properties: [] }),
        },
        responses: [
          createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Pet updated successfully' }),
          createResponse({ statusCode: 'default', schema: createSchema({ type: 'object', properties: [] }), description: 'Unexpected error' }),
        ],
      }),
      options: {},
    },
    {
      name: 'deletePet',
      node: createOperation({
        operationId: 'deletePet',
        method: 'DELETE',
        path: '/pets/:petId',
        tags: ['pets'],
        parameters: [
          createParameter({ name: 'api_key', in: 'header', schema: createSchema({ type: 'string' }), required: false }),
          createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'integer' }), required: true }),
        ],
        responses: [createResponse({ statusCode: '400', schema: createSchema({ type: 'object', properties: [] }), description: 'Invalid pet value' })],
      }),
      options: {},
    },
  ] as const satisfies Array<{
    name: string
    node: OperationNode
    options: Partial<PluginCypress['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const defaultOptions: PluginCypress['resolvedOptions'] = {
      output: {
        path: '.',
      },
      baseURL: undefined,
      group: undefined,
      dataReturnType: 'data',
      paramsCasing: 'camelcase',
      paramsType: 'inline',
      pathParamsType: 'inline',
      resolver: resolverCypress,
      transformers: [],
      ...props.options,
    }

    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options: defaultOptions })

    await renderOperation(props.node, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      driver: createMockedPluginDriver(),
      Component: cypressGenerator.Operation,
      plugin,
      options: defaultOptions,
    })

    await matchFiles(fabric.files, props.name)
  })
})
