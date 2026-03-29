import path from 'node:path'
import { createOperation, createParameter, createProperty, createResponse, createSchema } from '@kubb/ast'
import type { OperationNode, SchemaNode } from '@kubb/ast/types'
import type { Config } from '@kubb/core'
import { renderOperation, renderSchema } from '@kubb/core'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles } from '#mocks'
import { resolverZod } from '../resolvers/resolverZod.ts'
import type { PluginZod } from '../types.ts'
import { zodGenerator } from './zodGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [] }

const defaultOptions: PluginZod['resolvedOptions'] = {
  dateType: 'string',
  unknownType: 'any',
  emptySchemaType: 'any',
  integerType: 'bigint',
  typed: false,
  inferred: false,
  importPath: 'zod',
  coercion: false,
  operations: false,
  guidType: 'uuid',
  mini: false,
  wrapOutput: undefined,
  output: { path: '.' },
  group: undefined,
  transformers: [],
}

// ---------------------------------------------------------------------------
// Schema test data
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Schema tests
// ---------------------------------------------------------------------------

describe('zodGenerator — Schema', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

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
    // dateType options
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
  ]

  test.each(schemas)('$name', async (props) => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, ...props.options }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver: resolverZod })
    const driver = createMockedPluginDriver({ name: props.name })

    await renderSchema(props.node, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: zodGenerator.Schema,
      plugin,
      options,
      resolver: resolverZod,
    })

    await matchFiles(fabric.files, props.name)
  })
})

// ---------------------------------------------------------------------------
// Operation tests
// ---------------------------------------------------------------------------

describe('zodGenerator — Operation', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

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
  ]

  test.each(operations)('$name', async (props) => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, ...props.options }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver: resolverZod })
    const driver = createMockedPluginDriver({ name: props.name })

    await renderOperation(props.node, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: zodGenerator.Operation,
      plugin,
      options,
      resolver: resolverZod,
    })

    await matchFiles(fabric.files, props.name)
  })
})
