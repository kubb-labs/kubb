import { createOperation, createParameter, createResponse, createSchema } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { Config } from '@kubb/core'
import { buildOperation } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import ts, { factory } from 'typescript'
import { beforeEach, describe, expect, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginManager, matchFiles } from '#mocks'
import type { PluginTs } from '../../types.ts'
import { typeGenerator } from './typeGenerator.tsx'

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
    {
      name: 'listPets — GET with query params and paramsCasing camelcase',
      node: createOperation({
        operationId: 'listPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [createParameter({ name: 'my_limit', in: 'query', schema: createSchema({ type: 'integer' }) })],
        responses: [
          createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'A paged array of pets' }),
          createResponse({ statusCode: 'default', schema: createSchema({ type: 'object', properties: [] }), description: 'Unexpected error' }),
        ],
      }),
      options: {
        paramsCasing: 'camelcase',
      },
    },
    {
      name: 'createPet — POST with mapper overriding request body property',
      node: createOperation({
        operationId: 'createPets',
        method: 'POST',
        path: '/pets',
        tags: ['pets'],
        parameters: [createParameter({ name: 'name', in: 'path', schema: createSchema({ type: 'integer' }), required: true })],
        responses: [
          createResponse({ statusCode: '201', schema: createSchema({ type: 'object', properties: [] }), description: 'Null response' }),
          createResponse({ statusCode: 'default', schema: createSchema({ type: 'object', properties: [] }), description: 'Unexpected error' }),
        ],
      }),
      options: {
        mapper: {
          name: factory.createPropertySignature(
            undefined,
            factory.createIdentifier('fullName'),
            factory.createToken(ts.SyntaxKind.QuestionToken),
            factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          ),
        },
      },
    },
  ] as const satisfies Array<{ name: string; node: OperationNode; options?: Partial<PluginTs['resolvedOptions']> }>

  const defaultOptions: PluginTs['resolvedOptions'] = {
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

  test.each(testData)('$name', async (props) => {
    const options: PluginTs['resolvedOptions'] = {
      ...defaultOptions,
      ...('options' in props ? props.options : {}),
    }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })
    const mockedPluginManager = createMockedPluginManager({ name: props.name })

    await buildOperation(props.node, {
      version: '2',
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      pluginManager: mockedPluginManager,
      Component: typeGenerator.Operation,
      plugin,
      mode: 'split',
      options: options,
    })

    await matchFiles(fabric.files, props.name)
  })
})

describe('typeGenerator v2 — Operation — group', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const defaultOptions: PluginTs['resolvedOptions'] = {
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

  const node = createOperation({
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    parameters: [createParameter({ name: 'limit', in: 'query', schema: createSchema({ type: 'integer' }) })],
    responses: [
      createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'A paged array of pets' }),
      createResponse({ statusCode: 'default', schema: createSchema({ type: 'object', properties: [] }), description: 'Unexpected error' }),
    ],
  })

  test('group by tag — file is placed under the tag directory', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, group: { type: 'tag' } }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })
    const mockedPluginManager = createMockedPluginManager({ name: 'listPets' })

    await buildOperation(node, {
      version: '2',
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      pluginManager: mockedPluginManager,
      Component: typeGenerator.Operation,
      plugin,
      mode: 'split',
      options,
    })

    const file = fabric.files.find((f) => f.baseName === 'listPets.ts')
    expect(file).toBeDefined()
    expect(file!.path).toBe('pets/listPets.ts')
  })

  test('group by path — file is placed under the path directory', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, group: { type: 'path' } }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })
    const mockedPluginManager = createMockedPluginManager({ name: 'listPets' })

    await buildOperation(node, {
      version: '2',
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      pluginManager: mockedPluginManager,
      Component: typeGenerator.Operation,
      plugin,
      mode: 'split',
      options,
    })

    const file = fabric.files.find((f) => f.baseName === 'listPets.ts')
    expect(file).toBeDefined()
    expect(file!.path).toBe('pets/listPets.ts')
  })

  test('no group — file is placed flat', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, group: undefined }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })
    const mockedPluginManager = createMockedPluginManager({ name: 'listPets' })

    await buildOperation(node, {
      version: '2',
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      pluginManager: mockedPluginManager,
      Component: typeGenerator.Operation,
      plugin,
      mode: 'split',
      options,
    })

    const file = fabric.files.find((f) => f.baseName === 'listPets.ts')
    expect(file).toBeDefined()
    expect(file!.path).toBe('listPets.ts')
  })
})
