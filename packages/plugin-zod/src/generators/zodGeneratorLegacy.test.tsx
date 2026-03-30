import { createOperation, createParameter, createProperty, createResponse, createSchema } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { Config } from '@kubb/core'
import { renderOperation, renderSchema } from '@kubb/core'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles } from '#mocks'
import { resolverZodLegacy } from '../resolvers/resolverZodLegacy.ts'
import type { PluginZod } from '../types.ts'
import { zodGeneratorLegacy } from './zodGeneratorLegacy.tsx'

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
  paramsCasing: undefined,
  output: { path: '.' },
  group: undefined,
  transformers: [],
}

describe('zodGeneratorLegacy — Schema', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  test('legacy — enum schema', async () => {
    const enumSchema = createSchema({
      type: 'enum',
      name: 'petStatus',
      primitive: 'string',
      enumValues: ['available', 'pending', 'sold'],
    })
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver: resolverZodLegacy })
    const driver = createMockedPluginDriver({ name: 'legacy — enum schema' })

    await renderSchema(enumSchema, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: zodGeneratorLegacy.Schema,
      plugin,
      options: defaultOptions,
      resolver: resolverZodLegacy,
    })

    await matchFiles(fabric.files, 'legacy — enum schema')
  })

  test('legacy — object schema', async () => {
    const objectSchema = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({ name: 'id', required: true, schema: createSchema({ type: 'integer' }) }),
        createProperty({ name: 'name', required: true, schema: createSchema({ type: 'string' }) }),
        createProperty({ name: 'status', schema: createSchema({ type: 'string', optional: true }) }),
      ],
    })
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver: resolverZodLegacy })
    const driver = createMockedPluginDriver({ name: 'legacy — object schema' })

    await renderSchema(objectSchema, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: zodGeneratorLegacy.Schema,
      plugin,
      options: defaultOptions,
      resolver: resolverZodLegacy,
    })

    await matchFiles(fabric.files, 'legacy — object schema')
  })
})

describe('zodGeneratorLegacy — Operation', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const operations = [
    {
      name: 'legacy — listPets — GET with query param',
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
      name: 'legacy — addPet — POST with request body',
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
      name: 'legacy — deletePet — DELETE with response enum array',
      node: createOperation({
        operationId: 'deletePet',
        method: 'DELETE',
        path: '/pet/{petId}',
        tags: ['pet'],
        parameters: [createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'string' }), required: true })],
        responses: [
          createResponse({
            statusCode: '200',
            schema: createSchema({ type: 'array', items: [createSchema({ type: 'enum', primitive: 'string', enumValues: ['TYPE1', 'TYPE2', 'TYPE3'] })] }),
            description: 'Successful deletion',
          }),
        ],
      }),
    },
    {
      name: 'legacy — createPets — POST with header param enum',
      node: createOperation({
        operationId: 'createPets',
        method: 'POST',
        path: '/pets',
        tags: ['pets'],
        parameters: [
          createParameter({
            name: 'X-EXAMPLE',
            in: 'header',
            required: true,
            schema: createSchema({ type: 'enum', primitive: 'string', enumValues: ['ONE', 'TWO', 'THREE'] }),
          }),
        ],
        responses: [createResponse({ statusCode: '201', schema: createSchema({ type: 'void' }), description: 'Null response' })],
      }),
    },
  ] as const satisfies Array<{ name: string; node: OperationNode }>

  test.each(operations)('$name', async (props) => {
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver: resolverZodLegacy })
    const driver = createMockedPluginDriver({ name: props.name })

    await renderOperation(props.node, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: zodGeneratorLegacy.Operation,
      plugin,
      options: defaultOptions,
      resolver: resolverZodLegacy,
    })

    await matchFiles(fabric.files, props.name)
  })

  test('legacy — custom resolver — name transformer adds Zod suffix', async () => {
    const wrappedResolver: typeof resolverZodLegacy = {
      ...resolverZodLegacy,
      default(name, type) {
        return `${resolverZodLegacy.default(name, type)}Zod`
      },
    }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver: wrappedResolver })
    const driver = createMockedPluginDriver({ name: 'legacy — addPet — name transformer' })

    const node = createOperation({
      operationId: 'addPet',
      method: 'POST',
      path: '/pet',
      tags: ['pet'],
      requestBody: { schema: createSchema({ type: 'object', properties: [] }) },
      responses: [
        createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Successful operation' }),
        createResponse({ statusCode: '405', schema: createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
      ],
    })

    await renderOperation(node, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: zodGeneratorLegacy.Operation,
      plugin,
      options: defaultOptions,
      resolver: wrappedResolver,
    })

    await matchFiles(fabric.files, 'legacy — addPet — name transformer')
  })
})
