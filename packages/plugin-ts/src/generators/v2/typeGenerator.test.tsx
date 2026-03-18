import type { Adapter, Config, Plugin } from '@kubb/core'
import { createOperation, createParameter, createResponse, createSchema } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import { buildOperation } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, test } from 'vitest'
import { createMockedPluginManager, matchFiles } from '#mocks'
import type { PluginTs } from '../../types.ts'
import { typeGenerator } from './typeGenerator.tsx'

/**
 * Minimal adapter mock for v2 tests — getImports always returns [] since
 * tests are run in a single-file mode and cross-file imports are not exercised.
 */
const mockAdapter = {
  name: 'oas',
  options: {},
  parse: async () => ({ kind: 'Root' as const, schemas: [], operations: [] }),
  getImports: () => [],
} satisfies Adapter<any>

describe('typeGenerator v2 — Operation', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const testData = [
    {
      name: 'listPets — GET with query params',
      node: createOperation({
        operationId: 'listPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [createParameter({ name: 'limit', in: 'query', schema: createSchema({ type: 'integer' }) })],
        responses: [
          createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'A paged array of pets' }),
          createResponse({ statusCode: 'default', schema: createSchema({ type: 'object', properties: [] }), description: 'Unexpected error' }),
        ],
      }),
    },
    {
      name: 'showPetById — GET with path params',
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
    },
    {
      name: 'createPet — POST with request body',
      node: createOperation({
        operationId: 'createPets',
        method: 'POST',
        path: '/pets',
        tags: ['pets'],
        requestBody: createSchema({
          type: 'object',
          properties: [],
          description: 'Pet to add',
        }),
        responses: [
          createResponse({ statusCode: '201', schema: createSchema({ type: 'object', properties: [] }), description: 'Null response' }),
          createResponse({ statusCode: 'default', schema: createSchema({ type: 'object', properties: [] }), description: 'Unexpected error' }),
        ],
      }),
    },
    {
      name: 'placeOrderPatch — PATCH with path params + request body + multiple status codes',
      node: createOperation({
        operationId: 'placeOrderPatch',
        method: 'PATCH',
        path: '/store/order/:orderId',
        tags: ['store'],
        parameters: [createParameter({ name: 'orderId', in: 'path', schema: createSchema({ type: 'integer' }), required: true })],
        requestBody: createSchema({ type: 'object', properties: [], description: 'Order payload' }),
        responses: [
          createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Successful operation' }),
          createResponse({ statusCode: '405', schema: createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
        ],
      }),
    },
    {
      name: 'deletePet — DELETE with no response body',
      node: createOperation({
        operationId: 'deletePet',
        method: 'DELETE',
        path: '/pets/:petId',
        tags: ['pets'],
        parameters: [createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'string' }), required: true })],
        responses: [createResponse({ statusCode: '204', description: 'No content' })],
      }),
    },
    {
      name: 'findArtifacts — GET with multiple query params',
      node: createOperation({
        operationId: 'findArtifacts',
        method: 'GET',
        path: '/artifacts',
        tags: ['artifacts'],
        parameters: [
          createParameter({ name: 'page', in: 'query', schema: createSchema({ type: 'integer' }) }),
          createParameter({ name: 'limit', in: 'query', schema: createSchema({ type: 'integer' }) }),
          createParameter({ name: 'sort', in: 'query', schema: createSchema({ type: 'string' }) }),
        ],
        responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Results' })],
      }),
    },
  ] as const satisfies Array<{ name: string; node: OperationNode }>

  test.each(testData)('$name', async (props) => {
    const options: PluginTs['resolvedOptions'] = {
      enumType: 'asConst',
      enumKeyCasing: 'none',
      enumSuffix: '',
      dateType: 'string',
      integerType: 'bigint',
      optionalType: 'questionToken',
      arrayType: 'array',
      transformers: {},
      unknownType: 'any',
      syntaxType: 'type',
      override: [],
      mapper: {},
      paramsCasing: undefined,
      output: { path: '.' },
      group: undefined,
      emptySchemaType: 'unknown',
    }

    const plugin = { options, name: '@kubb/plugin-ts' } as unknown as Plugin<PluginTs>
    const mockedPluginManager = createMockedPluginManager({ name: props.name })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (buildOperation as any)(props.node, {
      version: '2',
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: mockAdapter,
      pluginManager: mockedPluginManager,
      Component: typeGenerator.Operation,
      plugin,
      mode: 'split',
      options,
    })

    await matchFiles(fabric.files, props.name)
  })
})
