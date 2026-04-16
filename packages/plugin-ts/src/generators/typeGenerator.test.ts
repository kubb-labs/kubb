import path from 'node:path'
import { camelCase } from '@internals/utils'

import type { Ast, Config, Group } from '@kubb/core'
import { ast } from '@kubb/core'
import { describe, expect, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperation, renderGeneratorSchema } from '#mocks'
import { resolverTs } from '../resolvers/resolverTs.ts'
import type { PluginTs } from '../types.ts'
import { typeGenerator } from './typeGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [], parsers: [], adapter: createMockedAdapter() }

const defaultOptions: PluginTs['resolvedOptions'] = {
  enumType: 'asConst',
  enumTypeSuffix: 'Key',
  enumKeyCasing: 'none',
  optionalType: 'questionToken',
  arrayType: 'array',
  syntaxType: 'type',
  paramsCasing: undefined,
  output: { path: '.' },
  exclude: [],
  include: undefined,
  override: [],
  group: undefined,
  printer: undefined,
}

const enumSchema = ast.createSchema({
  type: 'enum',
  name: 'petStatus',
  primitive: 'string',
  enumValues: ['available', 'pending', 'sold'],
})

const multiWordEnumSchema = ast.createSchema({
  type: 'enum',
  name: 'orderStatus',
  primitive: 'string',
  enumValues: ['in_progress', 'awaiting_payment', 'fully_shipped'],
})

const objectSchema = ast.createSchema({
  type: 'object',
  name: 'Pet',
  properties: [
    ast.createProperty({ name: 'id', required: true, schema: ast.createSchema({ type: 'string' }) }),
    ast.createProperty({ name: 'name', required: true, schema: ast.createSchema({ type: 'string' }) }),
    ast.createProperty({ name: 'description', schema: ast.createSchema({ type: 'string', optional: true }) }),
    ast.createProperty({ name: 'tags', schema: ast.createSchema({ type: 'array', items: [ast.createSchema({ type: 'string' })] }) }),
  ],
})

const operationWithSnakeCaseParams: Ast.OperationNode = ast.createOperation({
  operationId: 'updatePet',
  method: 'POST',
  path: '/pets/{pet_id}',
  tags: ['pets'],
  parameters: [
    ast.createParameter({ name: 'pet_id', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true }),
    ast.createParameter({ name: 'include_deleted', in: 'query', schema: ast.createSchema({ type: 'boolean' }) }),
    ast.createParameter({ name: 'request_source', in: 'query', schema: ast.createSchema({ type: 'string' }) }),
  ],
  requestBody: {
    schema: ast.createSchema({
      type: 'object',
      properties: [ast.createProperty({ name: 'name', required: true, schema: ast.createSchema({ type: 'string' }) })],
    }),
  },
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Success' })],
})

describe('typeGenerator — Operation', () => {
  const operations = [
    {
      name: 'listPets — GET with query params',
      node: ast.createOperation({
        operationId: 'listPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [ast.createParameter({ name: 'limit', in: 'query', schema: ast.createSchema({ type: 'integer' }) })],
        responses: [
          ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'A paged array of pets' }),
          ast.createResponse({ statusCode: 'default', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Unexpected error' }),
        ],
      }),
    },
    {
      name: 'showPetById — GET with path param',
      node: ast.createOperation({
        operationId: 'showPetById',
        method: 'GET',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
        responses: [
          ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Expected response' }),
          ast.createResponse({ statusCode: 'default', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Unexpected error' }),
        ],
      }),
    },
    {
      name: 'findPetsByStatus — GET with query param enum',
      node: ast.createOperation({
        operationId: 'findPetsByStatus',
        method: 'GET',
        path: '/pet/findByStatus',
        tags: ['pet'],
        parameters: [
          ast.createParameter({
            name: 'status',
            in: 'query',
            schema: ast.createSchema({ type: 'enum', primitive: 'string', enumValues: ['available', 'pending', 'sold'] }),
          }),
        ],
        responses: [
          ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Successful operation' }),
        ],
      }),
    },
    {
      name: 'addPet — POST with request body',
      node: ast.createOperation({
        operationId: 'addPet',
        method: 'POST',
        path: '/pet',
        tags: ['pet'],
        requestBody: { schema: ast.createSchema({ type: 'object', properties: [] }) },
        responses: [
          ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Successful operation' }),
          ast.createResponse({ statusCode: '405', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
        ],
      }),
    },
    {
      name: 'updatePetWithForm — POST with path and query params',
      node: ast.createOperation({
        operationId: 'updatePetWithForm',
        method: 'POST',
        path: '/pet/{petId}',
        tags: ['pet'],
        parameters: [
          ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'integer' }), required: true }),
          ast.createParameter({ name: 'name', in: 'query', schema: ast.createSchema({ type: 'string' }) }),
          ast.createParameter({ name: 'status', in: 'query', schema: ast.createSchema({ type: 'string' }) }),
        ],
        responses: [
          ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'void' }), description: 'Success' }),
          ast.createResponse({ statusCode: '405', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
        ],
      }),
    },
    {
      name: 'placeOrderPatch — PATCH with path params + request body + multiple status codes',
      node: ast.createOperation({
        operationId: 'placeOrderPatch',
        method: 'PATCH',
        path: '/store/order/:orderId',
        tags: ['store'],
        parameters: [ast.createParameter({ name: 'orderId', in: 'path', schema: ast.createSchema({ type: 'integer' }), required: true })],
        requestBody: { schema: ast.createSchema({ type: 'object', properties: [], description: 'Order payload' }) },
        responses: [
          ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Successful operation' }),
          ast.createResponse({ statusCode: '405', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
        ],
      }),
    },
    {
      name: 'deletePet — DELETE with no response body',
      node: ast.createOperation({
        operationId: 'deletePet',
        method: 'DELETE',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
        responses: [ast.createResponse({ statusCode: '204', description: 'No content', schema: ast.createSchema({ type: 'void' }) })],
      }),
    },
    {
      name: 'findArtifacts — GET with multiple query params',
      node: ast.createOperation({
        operationId: 'findArtifacts',
        method: 'GET',
        path: '/artifacts',
        tags: ['artifacts'],
        parameters: [
          ast.createParameter({ name: 'page', in: 'query', schema: ast.createSchema({ type: 'integer' }) }),
          ast.createParameter({ name: 'limit', in: 'query', schema: ast.createSchema({ type: 'integer' }) }),
          ast.createParameter({ name: 'sort', in: 'query', schema: ast.createSchema({ type: 'string' }) }),
        ],
        responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Results' })],
      }),
    },
    {
      name: 'noTagsOperation — GET with no tags',
      node: ast.createOperation({
        operationId: 'get_enterprise_configurations_id_v2025.0',
        method: 'GET',
        path: '/enterprise_configurations/:enterprise_id',
        tags: [],
        parameters: [ast.createParameter({ name: 'enterprise_id', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
        responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Enterprise config' })],
      }),
    },
  ] as const satisfies Array<{ name: string; node: Ast.OperationNode }>

  test.each(operations)('$name', async (props) => {
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options: defaultOptions, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: props.name })

    await renderGeneratorOperation(typeGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})

describe('typeGenerator — Operation — group', () => {
  const node = ast.createOperation({
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    parameters: [ast.createParameter({ name: 'limit', in: 'query', schema: ast.createSchema({ type: 'integer' }) })],
    responses: [
      ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'A paged array of pets' }),
      ast.createResponse({ statusCode: 'default', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Unexpected error' }),
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

    await renderGeneratorOperation(typeGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    const file = driver.fileManager.files.find((f) => f.baseName === expectedBaseName)
    expect(file).toBeDefined()
    const root = path.resolve(testConfig.root, testConfig.output.path, options.output.path)
    const expectedPath = expectedDir ? path.resolve(root, expectedDir, expectedBaseName) : path.resolve(root, expectedBaseName)
    expect(file!.path).toBe(expectedPath)
  })

  test('group=tag with empty tags falls back to default', async () => {
    const noTagNode = ast.createOperation({
      operationId: 'getConfig',
      method: 'GET',
      path: '/config',
      tags: [],
      responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Config' })],
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

    await renderGeneratorOperation(typeGenerator, noTagNode, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    const file = driver.fileManager.files.find((f) => f.baseName === 'GetConfig.ts')
    expect(file).toBeDefined()
    const root = path.resolve(testConfig.root, testConfig.output.path, options.output.path)
    expect(file!.path).toBe(path.resolve(root, 'defaultController', 'GetConfig.ts'))
  })
})

describe('typeGenerator — paramsCasing', () => {
  test('paramsCasing undefined — snake_case params kept as-is', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, paramsCasing: undefined }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'paramsCasing undefined' })

    await renderGeneratorOperation(typeGenerator, operationWithSnakeCaseParams, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'paramsCasing undefined')
  })

  test('paramsCasing camelcase — snake_case params converted to camelCase', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, paramsCasing: 'camelcase' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'paramsCasing camelcase' })

    await renderGeneratorOperation(typeGenerator, operationWithSnakeCaseParams, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'paramsCasing camelcase')
  })
})

describe('typeGenerator — enumType', () => {
  const enumTypes = ['asConst', 'asPascalConst', 'enum', 'constEnum', 'literal', 'inlineLiteral'] as const satisfies Array<
    NonNullable<PluginTs['resolvedOptions']['enumType']>
  >

  test.each(enumTypes.map((t) => ({ enumType: t })))('enumType $enumType', async ({ enumType }) => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enumType }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: `enumType ${enumType}` })

    await renderGeneratorSchema(typeGenerator, enumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, `enumType ${enumType}`)
  })
})

describe('typeGenerator — enumType — dotted name', () => {
  const dottedEnumSchema = ast.createSchema({
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

    await renderGeneratorSchema(typeGenerator, dottedEnumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, `enumNames.Type — ${enumType}`)
  })
})

describe('typeGenerator — enumKeyCasing', () => {
  const casingVariants = ['screamingSnakeCase', 'snakeCase', 'pascalCase', 'camelCase', 'none'] as const satisfies Array<
    NonNullable<PluginTs['resolvedOptions']['enumKeyCasing']>
  >

  test.each(casingVariants.map((c) => ({ enumKeyCasing: c })))('enumKeyCasing $enumKeyCasing', async ({ enumKeyCasing }) => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enumType: 'asConst', enumKeyCasing }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: `enumKeyCasing ${enumKeyCasing}` })

    await renderGeneratorSchema(typeGenerator, multiWordEnumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, `enumKeyCasing ${enumKeyCasing}`)
  })
})

describe('typeGenerator — enumTypeSuffix', () => {
  test('enumTypeSuffix Key (default)', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enumType: 'asConst', enumTypeSuffix: 'Key' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'enumTypeSuffix Key' })

    await renderGeneratorSchema(typeGenerator, enumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'enumTypeSuffix Key')
  })

  test('enumTypeSuffix Value', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enumType: 'asConst', enumTypeSuffix: 'Value' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'enumTypeSuffix Value' })

    await renderGeneratorSchema(typeGenerator, enumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'enumTypeSuffix Value')
  })

  test('enumTypeSuffix empty string', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enumType: 'asConst', enumTypeSuffix: '' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'enumTypeSuffix empty' })

    await renderGeneratorSchema(typeGenerator, enumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'enumTypeSuffix empty')
  })
})

describe('typeGenerator — syntaxType', () => {
  test('syntaxType type (default)', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, syntaxType: 'type' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'syntaxType type' })

    await renderGeneratorSchema(typeGenerator, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'syntaxType type')
  })

  test('syntaxType interface', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, syntaxType: 'interface' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: 'syntaxType interface' })

    await renderGeneratorSchema(typeGenerator, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'syntaxType interface')
  })
})

describe('typeGenerator — optionalType', () => {
  const optionalTypes = ['questionToken', 'undefined', 'questionTokenAndUndefined'] as const satisfies Array<
    NonNullable<PluginTs['resolvedOptions']['optionalType']>
  >

  test.each(optionalTypes.map((t) => ({ optionalType: t })))('optionalType $optionalType', async ({ optionalType }) => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, optionalType }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: `optionalType ${optionalType}` })

    await renderGeneratorSchema(typeGenerator, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, `optionalType ${optionalType}`)
  })
})

describe('typeGenerator — arrayType', () => {
  const arrayTypes = ['array', 'generic'] as const satisfies Array<NonNullable<PluginTs['resolvedOptions']['arrayType']>>

  test.each(arrayTypes.map((t) => ({ arrayType: t })))('arrayType $arrayType', async ({ arrayType }) => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, arrayType }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTs })
    const driver = createMockedPluginDriver({ name: `arrayType ${arrayType}` })

    await renderGeneratorSchema(typeGenerator, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, `arrayType ${arrayType}`)
  })
})

describe('typeGenerator — transformers', () => {
  test('schema transformer — removes optional properties from object', async () => {
    const removeOptionalProperties: Ast.Visitor = {
      schema(node) {
        if ('properties' in node) {
          return { ...node, properties: node.properties.filter((p) => p.required) }
        }
        return node
      },
    }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options: defaultOptions, resolver: resolverTs, transformer: removeOptionalProperties })
    const driver = createMockedPluginDriver({ name: 'transformers removeOptionalProperties' })

    await renderGeneratorSchema(typeGenerator, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'transformers removeOptionalProperties')
  })

  test('schema transformer — maps integer type to string', async () => {
    const integerToString: Ast.Visitor = {
      schema(node) {
        if (node.type === 'integer') return { ...node, type: 'string' }
        return node
      },
    }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options: defaultOptions, resolver: resolverTs, transformer: integerToString })
    const driver = createMockedPluginDriver({ name: 'transformers integerToString' })

    const schemaWithInteger = ast.createSchema({
      type: 'object',
      name: 'Order',
      properties: [
        ast.createProperty({ name: 'id', required: true, schema: ast.createSchema({ type: 'integer' }) }),
        ast.createProperty({ name: 'quantity', schema: ast.createSchema({ type: 'integer', optional: true }) }),
        ast.createProperty({ name: 'status', required: true, schema: ast.createSchema({ type: 'string' }) }),
      ],
    })

    await renderGeneratorSchema(typeGenerator, schemaWithInteger, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverTs,
    })

    await matchFiles(driver.fileManager.files, 'transformers integerToString')
  })
})
