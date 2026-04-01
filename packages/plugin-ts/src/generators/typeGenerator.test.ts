import path from 'node:path'
import { camelCase } from '@internals/utils'
import { createOperation, createParameter, createProperty, createResponse, createSchema } from '@kubb/ast'
import type { OperationNode, Visitor } from '@kubb/ast/types'
import type { Config, Group } from '@kubb/core'
import { renderOperation, renderSchema } from '@kubb/core'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, expect, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles } from '#mocks'
import { resolverTs } from '../resolvers/resolverTs.ts'
import type { PluginTs } from '../types.ts'
import { typeGenerator } from './typeGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [] }

const defaultOptions: PluginTs['resolvedOptions'] = {
  enumType: 'asConst',
  enumTypeSuffix: 'Key',
  enumKeyCasing: 'none',
  optionalType: 'questionToken',
  arrayType: 'array',
  syntaxType: 'type',
  paramsCasing: undefined,
  output: { path: '.' },
  group: undefined,
  printer: undefined,
}

const enumSchema = createSchema({
  type: 'enum',
  name: 'petStatus',
  primitive: 'string',
  enumValues: ['available', 'pending', 'sold'],
})

const multiWordEnumSchema = createSchema({
  type: 'enum',
  name: 'orderStatus',
  primitive: 'string',
  enumValues: ['in_progress', 'awaiting_payment', 'fully_shipped'],
})

const objectSchema = createSchema({
  type: 'object',
  name: 'Pet',
  properties: [
    createProperty({ name: 'id', required: true, schema: createSchema({ type: 'string' }) }),
    createProperty({ name: 'name', required: true, schema: createSchema({ type: 'string' }) }),
    createProperty({ name: 'description', schema: createSchema({ type: 'string', optional: true }) }),
    createProperty({ name: 'tags', schema: createSchema({ type: 'array', items: [createSchema({ type: 'string' })] }) }),
  ],
})

const operationWithSnakeCaseParams: OperationNode = createOperation({
  operationId: 'updatePet',
  method: 'POST',
  path: '/pets/{pet_id}',
  tags: ['pets'],
  parameters: [
    createParameter({ name: 'pet_id', in: 'path', schema: createSchema({ type: 'string' }), required: true }),
    createParameter({ name: 'include_deleted', in: 'query', schema: createSchema({ type: 'boolean' }) }),
    createParameter({ name: 'request_source', in: 'query', schema: createSchema({ type: 'string' }) }),
  ],
  requestBody: {
    schema: createSchema({ type: 'object', properties: [createProperty({ name: 'name', required: true, schema: createSchema({ type: 'string' }) })] }),
  },
  responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Success' })],
})

describe('typeGenerator — Operation', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const operations = [
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
      name: 'showPetById — GET with path param',
      node: createOperation({
        operationId: 'showPetById',
        method: 'GET',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'string' }), required: true })],
        responses: [
          createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Expected response' }),
          createResponse({ statusCode: 'default', schema: createSchema({ type: 'object', properties: [] }), description: 'Unexpected error' }),
        ],
      }),
    },
    {
      name: 'findPetsByStatus — GET with query param enum',
      node: createOperation({
        operationId: 'findPetsByStatus',
        method: 'GET',
        path: '/pet/findByStatus',
        tags: ['pet'],
        parameters: [
          createParameter({
            name: 'status',
            in: 'query',
            schema: createSchema({ type: 'enum', primitive: 'string', enumValues: ['available', 'pending', 'sold'] }),
          }),
        ],
        responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Successful operation' })],
      }),
    },
    {
      name: 'addPet — POST with request body',
      node: createOperation({
        operationId: 'addPet',
        method: 'POST',
        path: '/pet',
        tags: ['pet'],
        requestBody: { schema: createSchema({ type: 'object', properties: [] }) },
        responses: [
          createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Successful operation' }),
          createResponse({ statusCode: '405', schema: createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
        ],
      }),
    },
    {
      name: 'updatePetWithForm — POST with path and query params',
      node: createOperation({
        operationId: 'updatePetWithForm',
        method: 'POST',
        path: '/pet/{petId}',
        tags: ['pet'],
        parameters: [
          createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'integer' }), required: true }),
          createParameter({ name: 'name', in: 'query', schema: createSchema({ type: 'string' }) }),
          createParameter({ name: 'status', in: 'query', schema: createSchema({ type: 'string' }) }),
        ],
        responses: [
          createResponse({ statusCode: '200', schema: createSchema({ type: 'void' }), description: 'Success' }),
          createResponse({ statusCode: '405', schema: createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
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
        requestBody: { schema: createSchema({ type: 'object', properties: [], description: 'Order payload' }) },
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
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'string' }), required: true })],
        responses: [createResponse({ statusCode: '204', description: 'No content', schema: createSchema({ type: 'void' }) })],
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
      name: 'noTagsOperation — GET with no tags',
      node: createOperation({
        operationId: 'get_enterprise_configurations_id_v2025.0',
        method: 'GET',
        path: '/enterprise_configurations/:enterprise_id',
        tags: [],
        parameters: [createParameter({ name: 'enterprise_id', in: 'path', schema: createSchema({ type: 'string' }), required: true })],
        responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Enterprise config' })],
      }),
    },
  ] as const satisfies Array<{ name: string; node: OperationNode }>

  test.each(operations)('$name', async (props) => {
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options: defaultOptions, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: props.name })

    await renderOperation(props.node, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Operation,
      plugin,
      options: defaultOptions,
      resolver: resolverTs,
    })

    await matchFiles(fabric.files, props.name)
  })
})

describe('typeGenerator — Operation — group', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

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

  test.each([
    {
      group: {
        type: 'tag',
        name: (ctx: { group: string }) => `${camelCase(ctx.group)}Controller`,
      } satisfies Group,
      expectedBaseName: 'ListPets.ts',
      expectedDir: 'petsController',
    },
    { group: undefined, expectedBaseName: 'ListPets.ts', expectedDir: undefined },
  ] satisfies Array<{
    group: Group | undefined
    expectedBaseName: string
    expectedDir: string | undefined
  }>)('group=$group.type — file path is computed correctly', async ({ group, expectedBaseName, expectedDir }) => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, group }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'listPets', config: testConfig })

    await renderOperation(node, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Operation,
      plugin,
      options,
      resolver: resolverTs,
    })

    const file = fabric.files.find((f) => f.baseName === expectedBaseName)
    expect(file).toBeDefined()
    const root = path.resolve(testConfig.root, testConfig.output.path)
    const expectedPath = expectedDir ? path.resolve(root, expectedDir, expectedBaseName) : path.resolve(root, expectedBaseName)
    expect(file!.path).toBe(expectedPath)
  })

  test('group=tag with empty tags falls back to default', async () => {
    const noTagNode = createOperation({
      operationId: 'getConfig',
      method: 'GET',
      path: '/config',
      tags: [],
      responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Config' })],
    })
    const options: PluginTs['resolvedOptions'] = {
      ...defaultOptions,
      group: {
        type: 'tag',
        name: (ctx: { group: string }) => `${camelCase(ctx.group)}Controller`,
      },
    }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'getConfig', config: testConfig })

    await renderOperation(noTagNode, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Operation,
      plugin,
      options,
      resolver: resolverTs,
    })

    const file = fabric.files.find((f) => f.baseName === 'GetConfig.ts')
    expect(file).toBeDefined()
    const root = path.resolve(testConfig.root, testConfig.output.path)
    expect(file!.path).toBe(path.resolve(root, 'defaultController', 'GetConfig.ts'))
  })
})

describe('typeGenerator — paramsCasing', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  test('paramsCasing undefined — snake_case params kept as-is', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, paramsCasing: undefined }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'paramsCasing undefined' })

    await renderOperation(operationWithSnakeCaseParams, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Operation,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(fabric.files, 'paramsCasing undefined')
  })

  test('paramsCasing camelcase — snake_case params converted to camelCase', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, paramsCasing: 'camelcase' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'paramsCasing camelcase' })

    await renderOperation(operationWithSnakeCaseParams, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Operation,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(fabric.files, 'paramsCasing camelcase')
  })
})

describe('typeGenerator — enumType', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const enumTypes = ['asConst', 'asPascalConst', 'enum', 'constEnum', 'literal', 'inlineLiteral'] as const satisfies Array<
    NonNullable<PluginTs['resolvedOptions']['enumType']>
  >

  test.each(enumTypes.map((t) => ({ enumType: t })))('enumType $enumType', async ({ enumType }) => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enumType }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: `enumType ${enumType}` })

    await renderSchema(enumSchema, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Schema,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(fabric.files, `enumType ${enumType}`)
  })
})

describe('typeGenerator — enumType — dotted name', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const dottedEnumSchema = createSchema({
    type: 'enum',
    name: 'enumNames.Type',
    primitive: 'string',
    enumValues: ['available', 'pending', 'sold'],
  })

  const dottedDefaultOptions: PluginTs['resolvedOptions'] = { ...defaultOptions, enumTypeSuffix: 'EnumKey' }

  const enumTypes = ['asConst', 'asPascalConst', 'constEnum', 'enum', 'literal', 'inlineLiteral'] as const

  test.each(enumTypes.map((et) => ({ enumType: et })))('enumType=$enumType — top-level enum with dotted name', async ({ enumType }) => {
    const options: PluginTs['resolvedOptions'] = { ...dottedDefaultOptions, enumType }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: `enumNames.Type — ${enumType}` })

    await renderSchema(dottedEnumSchema, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Schema,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(fabric.files, `enumNames.Type — ${enumType}`)
  })
})

describe('typeGenerator — enumKeyCasing', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const casingVariants = ['screamingSnakeCase', 'snakeCase', 'pascalCase', 'camelCase', 'none'] as const satisfies Array<
    NonNullable<PluginTs['resolvedOptions']['enumKeyCasing']>
  >

  test.each(casingVariants.map((c) => ({ enumKeyCasing: c })))('enumKeyCasing $enumKeyCasing', async ({ enumKeyCasing }) => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enumType: 'asConst', enumKeyCasing }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: `enumKeyCasing ${enumKeyCasing}` })

    await renderSchema(multiWordEnumSchema, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Schema,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(fabric.files, `enumKeyCasing ${enumKeyCasing}`)
  })
})

describe('typeGenerator — enumTypeSuffix', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  test('enumTypeSuffix Key (default)', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enumType: 'asConst', enumTypeSuffix: 'Key' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'enumTypeSuffix Key' })

    await renderSchema(enumSchema, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Schema,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(fabric.files, 'enumTypeSuffix Key')
  })

  test('enumTypeSuffix Value', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enumType: 'asConst', enumTypeSuffix: 'Value' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'enumTypeSuffix Value' })

    await renderSchema(enumSchema, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Schema,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(fabric.files, 'enumTypeSuffix Value')
  })

  test('enumTypeSuffix empty string', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enumType: 'asConst', enumTypeSuffix: '' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'enumTypeSuffix empty' })

    await renderSchema(enumSchema, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Schema,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(fabric.files, 'enumTypeSuffix empty')
  })
})

describe('typeGenerator — syntaxType', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  test('syntaxType type (default)', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, syntaxType: 'type' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'syntaxType type' })

    await renderSchema(objectSchema, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Schema,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(fabric.files, 'syntaxType type')
  })

  test('syntaxType interface', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, syntaxType: 'interface' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'syntaxType interface' })

    await renderSchema(objectSchema, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Schema,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(fabric.files, 'syntaxType interface')
  })
})

describe('typeGenerator — optionalType', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const optionalTypes = ['questionToken', 'undefined', 'questionTokenAndUndefined'] as const satisfies Array<
    NonNullable<PluginTs['resolvedOptions']['optionalType']>
  >

  test.each(optionalTypes.map((t) => ({ optionalType: t })))('optionalType $optionalType', async ({ optionalType }) => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, optionalType }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: `optionalType ${optionalType}` })

    await renderSchema(objectSchema, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Schema,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(fabric.files, `optionalType ${optionalType}`)
  })
})

describe('typeGenerator — arrayType', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const arrayTypes = ['array', 'generic'] as const satisfies Array<NonNullable<PluginTs['resolvedOptions']['arrayType']>>

  test.each(arrayTypes.map((t) => ({ arrayType: t })))('arrayType $arrayType', async ({ arrayType }) => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, arrayType }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: `arrayType ${arrayType}` })

    await renderSchema(objectSchema, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Schema,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(fabric.files, `arrayType ${arrayType}`)
  })
})

describe('typeGenerator — transformers', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  test('schema transformer — removes optional properties from object', async () => {
    const removeOptionalProperties: Visitor = {
      schema(node) {
        if ('properties' in node) {
          return { ...node, properties: node.properties.filter((p) => p.required) }
        }
        return node
      },
    }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options: defaultOptions, resolver: resolverTs, transformer: removeOptionalProperties })
    const driver = createMockedPluginDriver({ name: 'transformers removeOptionalProperties' })

    await renderSchema(objectSchema, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Schema,
      plugin,
      options: defaultOptions,
      resolver: resolverTs,
    })

    await matchFiles(fabric.files, 'transformers removeOptionalProperties')
  })

  test('schema transformer — maps integer type to string', async () => {
    const integerToString: Visitor = {
      schema(node) {
        if (node.type === 'integer') return { ...node, type: 'string' }
        return node
      },
    }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options: defaultOptions, resolver: resolverTs, transformer: integerToString })
    const driver = createMockedPluginDriver({ name: 'transformers integerToString' })

    const schemaWithInteger = createSchema({
      type: 'object',
      name: 'Order',
      properties: [
        createProperty({ name: 'id', required: true, schema: createSchema({ type: 'integer' }) }),
        createProperty({ name: 'quantity', schema: createSchema({ type: 'integer', optional: true }) }),
        createProperty({ name: 'status', required: true, schema: createSchema({ type: 'string' }) }),
      ],
    })

    await renderSchema(schemaWithInteger, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGenerator.Schema,
      plugin,
      options: defaultOptions,
      resolver: resolverTs,
    })

    await matchFiles(fabric.files, 'transformers integerToString')
  })
})
