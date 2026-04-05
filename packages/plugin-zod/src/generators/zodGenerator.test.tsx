import path from 'node:path'
import { camelCase } from '@internals/utils'
import { createOperation, createParameter, createProperty, createResponse, createSchema } from '@kubb/ast'
import type { OperationNode, SchemaNode, Visitor } from '@kubb/ast/types'
import type { Config, Group } from '@kubb/core'
import { describe, expect, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperation, renderGeneratorSchema } from '#mocks'
import { resolverZod } from '../resolvers/resolverZod.ts'
import type { PluginZod } from '../types.ts'
import { zodGenerator } from './zodGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [], parsers: [], adapter: createMockedAdapter() }

const defaultOptions: PluginZod['resolvedOptions'] = {
  dateType: 'string',
  typed: false,
  inferred: false,
  importPath: 'zod',
  coercion: false,
  operations: false,
  guidType: 'uuid',
  mini: false,
  wrapOutput: undefined,
  paramsCasing: undefined,
  output: { path: '.' },
  exclude: [],
  include: undefined,
  override: [],
  group: undefined,
  printer: undefined,
}

const stringSchema = createSchema({ type: 'string', name: 'PetName' })

const numberSchema = createSchema({ type: 'number', name: 'PetAge' })

const integerSchema = createSchema({ type: 'integer', name: 'PetId' })

const booleanSchema = createSchema({ type: 'boolean', name: 'IsActive' })

const enumSchema = createSchema({
  type: 'enum',
  name: 'PetStatus',
  primitive: 'string',
  enumValues: ['available', 'pending', 'sold'],
})

const objectSchema = createSchema({
  type: 'object',
  primitive: 'object',
  name: 'Pet',
  properties: [
    createProperty({ name: 'id', required: true, schema: createSchema({ type: 'integer' }) }),
    createProperty({ name: 'name', required: true, schema: createSchema({ type: 'string' }) }),
    createProperty({ name: 'status', schema: createSchema({ type: 'string', optional: true }) }),
    createProperty({ name: 'tags', schema: createSchema({ type: 'array', items: [createSchema({ type: 'string' })] }) }),
  ],
})

const arraySchema = createSchema({
  type: 'array',
  name: 'PetList',
  items: [createSchema({ type: 'string' })],
})

const nullableSchema = createSchema({
  type: 'string',
  name: 'NullableString',
  nullable: true,
})

const optionalSchema = createSchema({
  type: 'string',
  name: 'OptionalString',
  optional: true,
})

const unknownSchema = createSchema({ type: 'unknown', name: 'UnknownField' })

const nullishSchema = createSchema({ type: 'string', name: 'NullishString', nullable: true, optional: true })

const unionSchema = createSchema({
  type: 'union',
  name: 'PetOrCat',
  members: [createSchema({ type: 'string' }), createSchema({ type: 'number' })],
})

const intersectionSchema = createSchema({
  type: 'intersection',
  name: 'PetAndOwner',
  members: [
    createSchema({
      type: 'object',
      primitive: 'object',
      properties: [createProperty({ name: 'petName', required: true, schema: createSchema({ type: 'string' }) })],
    }),
    createSchema({
      type: 'object',
      primitive: 'object',
      properties: [createProperty({ name: 'ownerName', required: true, schema: createSchema({ type: 'string' }) })],
    }),
  ],
})

const schemaWithDescription = createSchema({
  type: 'string',
  name: 'LabelField',
  description: 'A human-readable label',
})

const schemaWithDefault = createSchema({
  type: 'string',
  name: 'StatusField',
  default: 'active',
})

const schemaWithPattern = createSchema({
  type: 'string',
  name: 'SlugField',
  pattern: '^[a-z0-9-]+$',
})

const additionalPropertiesObjectSchema = createSchema({
  type: 'object',
  primitive: 'object',
  name: 'MetaMap',
  properties: [createProperty({ name: 'id', required: true, schema: createSchema({ type: 'integer' }) })],
  additionalProperties: createSchema({ type: 'string' }),
})

const operationWithSnakeCaseParams: OperationNode = createOperation({
  operationId: 'updatePet',
  method: 'POST',
  path: '/pets/{pet_id}',
  tags: ['pets'],
  parameters: [
    createParameter({ name: 'pet_id', in: 'path', schema: createSchema({ type: 'string' }), required: true }),
    createParameter({ name: 'include_deleted', in: 'query', schema: createSchema({ type: 'boolean' }) }),
  ],
  requestBody: {
    schema: createSchema({
      type: 'object',
      primitive: 'object',
      properties: [createProperty({ name: 'name', required: true, schema: createSchema({ type: 'string' }) })],
    }),
  },
  responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', primitive: 'object', properties: [] }), description: 'Success' })],
})

describe('zodGenerator — Schema', () => {

  const schemas: Array<{ name: string; node: SchemaNode; options?: Partial<PluginZod['resolvedOptions']> }> = [
    { name: 'string', node: stringSchema },
    { name: 'number', node: numberSchema },
    { name: 'integer', node: integerSchema },
    { name: 'boolean', node: booleanSchema },
    { name: 'enum', node: enumSchema },
    { name: 'object', node: objectSchema },
    { name: 'array', node: arraySchema },
    { name: 'nullable', node: nullableSchema },
    { name: 'optional', node: optionalSchema },
    // dateType — printer renders based on representation, integration tests cover adapter-level dateType option
    { name: 'dateType string', node: createSchema({ type: 'date', name: 'DateField', representation: 'string' }) },
    { name: 'dateType date', node: createSchema({ type: 'date', name: 'DateField', representation: 'date' }) },
    // guidType options
    { name: 'guidType uuid', node: createSchema({ type: 'uuid', name: 'UuidField' }), options: { guidType: 'uuid' } },
    { name: 'guidType guid', node: createSchema({ type: 'uuid', name: 'GuidField' }), options: { guidType: 'guid' } },
    // coercion options
    { name: 'coercion true', node: objectSchema, options: { coercion: true } },
    { name: 'coercion strings', node: stringSchema, options: { coercion: { strings: true } } },
    { name: 'coercion numbers', node: numberSchema, options: { coercion: { numbers: true } } },
    { name: 'coercion dates', node: createSchema({ type: 'date', name: 'DateField', representation: 'date' }), options: { coercion: { dates: true } } },
    // inferred
    { name: 'inferred', node: stringSchema, options: { inferred: true } },
    // mini mode
    { name: 'mini', node: objectSchema, options: { mini: true, importPath: 'zod/mini' } },
    { name: 'mini nullable', node: nullableSchema, options: { mini: true, importPath: 'zod/mini' } },
    { name: 'mini optional', node: optionalSchema, options: { mini: true, importPath: 'zod/mini' } },
    { name: 'mini inferred', node: stringSchema, options: { mini: true, importPath: 'zod/mini', inferred: true } },
    // unknownType — adapter-level option; here we test that each AST node type renders correctly
    { name: 'unknownType any', node: unknownSchema },
    { name: 'unknownType unknown', node: createSchema({ type: 'unknown', name: 'UnknownField2' }) },
    { name: 'unknownType void', node: createSchema({ type: 'void', name: 'VoidField' }) },
    // integerType is an adapter-level option; the AST node type is already resolved to 'integer' or 'bigint'
    { name: 'bigint', node: createSchema({ type: 'bigint', name: 'PetId', primitive: 'integer' }) },
    // importPath custom
    { name: 'importPath custom', node: stringSchema, options: { importPath: '@acme/zod' } },
    // typed
    { name: 'typed', node: objectSchema, options: { typed: true } },
    // wrapOutput (applied to object property values)
    {
      name: 'wrapOutput',
      node: createSchema({
        type: 'object',
        primitive: 'object',
        name: 'WrappedPet',
        properties: [
          createProperty({ name: 'name', required: true, schema: createSchema({ type: 'string' }) }),
          createProperty({ name: 'age', schema: createSchema({ type: 'integer', optional: true }) }),
        ],
      }),
      options: { wrapOutput: ({ output }) => `${output}.openapi('WrappedPet')` },
    },
    // nullish (nullable + optional)
    { name: 'nullish', node: nullishSchema },
    // composite schemas
    { name: 'union', node: unionSchema },
    { name: 'intersection', node: intersectionSchema },
    // schema with description
    { name: 'description', node: schemaWithDescription },
    // schema with default value
    { name: 'default', node: schemaWithDefault },
    // schema with pattern/regex
    { name: 'pattern', node: schemaWithPattern },
    // object with additionalProperties
    { name: 'additionalProperties', node: additionalPropertiesObjectSchema },
    // datetime variants
    { name: 'dateType stringOffset', node: createSchema({ type: 'datetime', name: 'DatetimeOffset', offset: true }) },
    { name: 'dateType stringLocal', node: createSchema({ type: 'datetime', name: 'DatetimeLocal', local: true }) },
    // mini — additional schema types
    { name: 'mini union', node: unionSchema, options: { mini: true, importPath: 'zod/mini' } },
    { name: 'mini wrapOutput', node: stringSchema, options: { mini: true, importPath: 'zod/mini', wrapOutput: ({ output }) => `${output}.openapi('test')` } },
  ]

  test.each(schemas)('$name', async (props) => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, ...props.options }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver: resolverZod })
    const driver = createMockedPluginDriver({ name: props.name })

    await renderGeneratorSchema(zodGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverZod,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})

describe('zodGenerator — Operation', () => {

  const operations: Array<{ name: string; node: OperationNode; options?: Partial<PluginZod['resolvedOptions']> }> = [
    {
      name: 'listPets — GET with query params',
      node: createOperation({
        operationId: 'listPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [createParameter({ name: 'limit', in: 'query', schema: createSchema({ type: 'integer' }) })],
        responses: [
          createResponse({
            statusCode: '200',
            schema: createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'A paged array of pets',
          }),
          createResponse({
            statusCode: 'default',
            schema: createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Unexpected error',
          }),
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
          createResponse({
            statusCode: '200',
            schema: createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Expected response',
          }),
          createResponse({
            statusCode: 'default',
            schema: createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Unexpected error',
          }),
        ],
      }),
    },
    {
      name: 'addPet — POST with request body',
      node: createOperation({
        operationId: 'addPet',
        method: 'POST',
        path: '/pet',
        tags: ['pet'],
        requestBody: { schema: createSchema({ type: 'object', primitive: 'object', properties: [] }) },
        responses: [
          createResponse({
            statusCode: '200',
            schema: createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Successful operation',
          }),
          createResponse({ statusCode: '405', schema: createSchema({ type: 'object', primitive: 'object', properties: [] }), description: 'Invalid input' }),
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
        responses: [
          createResponse({
            statusCode: '200',
            schema: createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Successful operation',
          }),
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
        requestBody: { schema: createSchema({ type: 'object', primitive: 'object', properties: [], description: 'Order payload' }) },
        responses: [
          createResponse({
            statusCode: '200',
            schema: createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Successful operation',
          }),
          createResponse({ statusCode: '405', schema: createSchema({ type: 'object', primitive: 'object', properties: [] }), description: 'Invalid input' }),
        ],
      }),
    },
    {
      name: 'noTagsOperation — GET with no tags',
      node: createOperation({
        operationId: 'getConfig',
        method: 'GET',
        path: '/config',
        tags: [],
        responses: [
          createResponse({ statusCode: '200', schema: createSchema({ type: 'object', primitive: 'object', properties: [] }), description: 'Config' }),
        ],
      }),
    },
    {
      name: 'getPets — GET with header params',
      node: createOperation({
        operationId: 'getPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [
          createParameter({ name: 'X-Request-Id', in: 'header', schema: createSchema({ type: 'string' }), required: true }),
          createParameter({ name: 'X-Correlation-Id', in: 'header', schema: createSchema({ type: 'string' }) }),
        ],
        responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', primitive: 'object', properties: [] }), description: 'Pets' })],
      }),
    },
    {
      name: 'addPet — POST mini mode',
      node: createOperation({
        operationId: 'addPetMini',
        method: 'POST',
        path: '/pet',
        tags: ['pet'],
        requestBody: {
          schema: createSchema({
            type: 'object',
            primitive: 'object',
            properties: [createProperty({ name: 'name', required: true, schema: createSchema({ type: 'string' }) })],
          }),
        },
        responses: [
          createResponse({ statusCode: '200', schema: createSchema({ type: 'object', primitive: 'object', properties: [] }), description: 'Created' }),
        ],
      }),
      options: { mini: true, importPath: 'zod/mini' },
    },
    {
      name: 'listPets — GET inferred',
      node: createOperation({
        operationId: 'listPetsInferred',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [createParameter({ name: 'limit', in: 'query', schema: createSchema({ type: 'integer' }) })],
        responses: [
          createResponse({ statusCode: '200', schema: createSchema({ type: 'object', primitive: 'object', properties: [] }), description: 'Pets list' }),
        ],
      }),
      options: { inferred: true },
    },
    {
      name: 'createPet — POST with coercion',
      node: createOperation({
        operationId: 'createPet',
        method: 'POST',
        path: '/pets',
        tags: ['pets'],
        requestBody: {
          schema: createSchema({
            type: 'object',
            primitive: 'object',
            properties: [
              createProperty({ name: 'age', required: true, schema: createSchema({ type: 'number' }) }),
              createProperty({ name: 'name', required: true, schema: createSchema({ type: 'string' }) }),
            ],
          }),
        },
        responses: [
          createResponse({ statusCode: '201', schema: createSchema({ type: 'object', primitive: 'object', properties: [] }), description: 'Created' }),
        ],
      }),
      options: { coercion: true },
    },
  ]

  test.each(operations)('$name', async (props) => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, ...props.options }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver: resolverZod })
    const driver = createMockedPluginDriver({ name: props.name })

    await renderGeneratorOperation(zodGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverZod,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})

describe('zodGenerator — Operation — group', () => {

  const node = createOperation({
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    parameters: [createParameter({ name: 'limit', in: 'query', schema: createSchema({ type: 'integer' }) })],
    responses: [
      createResponse({
        statusCode: '200',
        schema: createSchema({ type: 'object', primitive: 'object', properties: [] }),
        description: 'A paged array of pets',
      }),
      createResponse({ statusCode: 'default', schema: createSchema({ type: 'object', primitive: 'object', properties: [] }), description: 'Unexpected error' }),
    ],
  })

  test.each([
    {
      group: {
        type: 'tag',
        name: (ctx: { group: string }) => `${camelCase(ctx.group)}Controller`,
      } satisfies Group,
      expectedBaseName: 'listPetsSchema.ts',
      expectedDir: 'petsController',
    },
    { group: undefined, expectedBaseName: 'listPetsSchema.ts', expectedDir: undefined },
  ] satisfies Array<{
    group: Group | undefined
    expectedBaseName: string
    expectedDir: string | undefined
  }>)('group=$group.type — file path is computed correctly', async ({ group, expectedBaseName, expectedDir }) => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, group }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver: resolverZod })
    const driver = createMockedPluginDriver({ name: 'listPets', config: testConfig })

    await renderGeneratorOperation(zodGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverZod,
    })

    const file = driver.fileManager.files.find((f) => f.baseName === expectedBaseName)
    expect(file).toBeDefined()
    const root = path.resolve(testConfig.root, testConfig.output.path, options.output.path)
    const expectedPath = expectedDir ? path.resolve(root, expectedDir, expectedBaseName) : path.resolve(root, expectedBaseName)
    expect(file!.path).toBe(expectedPath)
  })
})

describe('zodGenerator — paramsCasing', () => {

  test('paramsCasing undefined — snake_case params kept as-is', async () => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, paramsCasing: undefined }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver: resolverZod })
    const driver = createMockedPluginDriver({ name: 'paramsCasing undefined' })

    await renderGeneratorOperation(zodGenerator, operationWithSnakeCaseParams, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverZod,
    })

    await matchFiles(driver.fileManager.files, 'paramsCasing undefined')
  })

  test('paramsCasing camelcase — snake_case params converted to camelCase', async () => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, paramsCasing: 'camelcase' }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver: resolverZod })
    const driver = createMockedPluginDriver({ name: 'paramsCasing camelcase' })

    await renderGeneratorOperation(zodGenerator, operationWithSnakeCaseParams, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverZod,
    })

    await matchFiles(driver.fileManager.files, 'paramsCasing camelcase')
  })
})

describe('zodGenerator — transformers', () => {

  test('schema transformer — removes optional properties from object', async () => {
    const removeOptionalProperties: Visitor = {
      schema(node) {
        if ('properties' in node) {
          return { ...node, properties: node.properties.filter((p) => p.required) }
        }
        return node
      },
    }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver: resolverZod, transformer: removeOptionalProperties })
    const driver = createMockedPluginDriver({ name: 'transformers removeOptionalProperties' })

    await renderGeneratorSchema(zodGenerator, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverZod,
    })

    await matchFiles(driver.fileManager.files, 'transformers removeOptionalProperties')
  })

  test('schema transformer — maps integer type to string', async () => {
    const integerToString: Visitor = {
      schema(node) {
        if (node.type === 'integer') return { ...node, type: 'string' }
        return node
      },
    }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver: resolverZod, transformer: integerToString })
    const driver = createMockedPluginDriver({ name: 'transformers integerToString' })

    const schemaWithInteger = createSchema({
      type: 'object',
      primitive: 'object',
      name: 'Order',
      properties: [
        createProperty({ name: 'id', required: true, schema: createSchema({ type: 'integer' }) }),
        createProperty({ name: 'quantity', schema: createSchema({ type: 'integer', optional: true }) }),
        createProperty({ name: 'status', required: true, schema: createSchema({ type: 'string' }) }),
      ],
    })

    await renderGeneratorSchema(zodGenerator, schemaWithInteger, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverZod,
    })

    await matchFiles(driver.fileManager.files, 'transformers integerToString')
  })
})
