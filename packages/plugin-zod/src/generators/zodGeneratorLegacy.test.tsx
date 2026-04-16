import type { Config } from '@kubb/core'
import { ast } from '@kubb/core'
import { describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperation, renderGeneratorSchema } from '#mocks'
import { resolverZodLegacy } from '../resolvers/resolverZodLegacy.ts'
import type { PluginZod } from '../types.ts'
import { zodGeneratorLegacy } from './zodGeneratorLegacy.tsx'

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

describe('zodGeneratorLegacy — Schema', () => {
  test('legacy — enum schema', async () => {
    const enumSchema = ast.createSchema({
      type: 'enum',
      name: 'petStatus',
      primitive: 'string',
      enumValues: ['available', 'pending', 'sold'],
    })
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver: resolverZodLegacy })
    const driver = createMockedPluginDriver({ name: 'legacy — enum schema' })

    await renderGeneratorSchema(zodGeneratorLegacy, enumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverZodLegacy,
    })

    await matchFiles(driver.fileManager.files, 'legacy — enum schema')
  })

  test('legacy — object schema', async () => {
    const objectSchema = ast.createSchema({
      type: 'object',
      primitive: 'object',
      name: 'Pet',
      properties: [
        ast.createProperty({ name: 'id', required: true, schema: ast.createSchema({ type: 'integer' }) }),
        ast.createProperty({ name: 'name', required: true, schema: ast.createSchema({ type: 'string' }) }),
        ast.createProperty({ name: 'status', schema: ast.createSchema({ type: 'string', optional: true }) }),
      ],
    })
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver: resolverZodLegacy })
    const driver = createMockedPluginDriver({ name: 'legacy — object schema' })

    await renderGeneratorSchema(zodGeneratorLegacy, objectSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverZodLegacy,
    })

    await matchFiles(driver.fileManager.files, 'legacy — object schema')
  })
})

describe('zodGeneratorLegacy — Operation', () => {
  const operations = [
    {
      name: 'legacy — listPets — GET with query param',
      node: ast.createOperation({
        operationId: 'listPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [ast.createParameter({ name: 'limit', in: 'query', schema: ast.createSchema({ type: 'integer' }) })],
        responses: [
          ast.createResponse({
            statusCode: '200',
            schema: ast.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'A paged array of pets',
          }),
          ast.createResponse({
            statusCode: 'default',
            schema: ast.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Unexpected error',
          }),
        ],
      }),
    },
    {
      name: 'legacy — addPet — POST with request body',
      node: ast.createOperation({
        operationId: 'addPet',
        method: 'POST',
        path: '/pet',
        tags: ['pet'],
        requestBody: { schema: ast.createSchema({ type: 'object', primitive: 'object', properties: [] }) },
        responses: [
          ast.createResponse({
            statusCode: '200',
            schema: ast.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Successful operation',
          }),
          ast.createResponse({
            statusCode: '405',
            schema: ast.createSchema({ type: 'object', primitive: 'object', properties: [] }),
            description: 'Invalid input',
          }),
        ],
      }),
    },
    {
      name: 'legacy — deletePet — DELETE with response enum array',
      node: ast.createOperation({
        operationId: 'deletePet',
        method: 'DELETE',
        path: '/pet/{petId}',
        tags: ['pet'],
        parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
        responses: [
          ast.createResponse({
            statusCode: '200',
            schema: ast.createSchema({
              type: 'array',
              items: [ast.createSchema({ type: 'enum', primitive: 'string', enumValues: ['TYPE1', 'TYPE2', 'TYPE3'] })],
            }),
            description: 'Successful deletion',
          }),
        ],
      }),
    },
    {
      name: 'legacy — createPets — POST with header param enum',
      node: ast.createOperation({
        operationId: 'createPets',
        method: 'POST',
        path: '/pets',
        tags: ['pets'],
        parameters: [
          ast.createParameter({
            name: 'X-EXAMPLE',
            in: 'header',
            required: true,
            schema: ast.createSchema({ type: 'enum', primitive: 'string', enumValues: ['ONE', 'TWO', 'THREE'] }),
          }),
        ],
        responses: [ast.createResponse({ statusCode: '201', schema: ast.createSchema({ type: 'void' }), description: 'Null response' })],
      }),
    },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode }>

  test.each(operations)('$name', async (props) => {
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver: resolverZodLegacy })
    const driver = createMockedPluginDriver({ name: props.name })

    await renderGeneratorOperation(zodGeneratorLegacy, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverZodLegacy,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })

  test('legacy — custom resolver — name transformer adds Zod suffix', async () => {
    const wrappedResolver: typeof resolverZodLegacy = {
      ...resolverZodLegacy,
      resolveSchemaName(name) {
        return `${resolverZodLegacy.resolveSchemaName(name)}Zod`
      },
    }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options: defaultOptions, resolver: wrappedResolver })
    const driver = createMockedPluginDriver({ name: 'legacy — addPet — name transformer' })

    const node = ast.createOperation({
      operationId: 'addPet',
      method: 'POST',
      path: '/pet',
      tags: ['pet'],
      requestBody: { schema: ast.createSchema({ type: 'object', primitive: 'object', properties: [] }) },
      responses: [
        ast.createResponse({
          statusCode: '200',
          schema: ast.createSchema({ type: 'object', primitive: 'object', properties: [] }),
          description: 'Successful operation',
        }),
        ast.createResponse({
          statusCode: '405',
          schema: ast.createSchema({ type: 'object', primitive: 'object', properties: [] }),
          description: 'Invalid input',
        }),
      ],
    })

    await renderGeneratorOperation(zodGeneratorLegacy, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: wrappedResolver,
    })

    await matchFiles(driver.fileManager.files, 'legacy — addPet — name transformer')
  })
})

describe('zodGeneratorLegacy — paramsCasing', () => {
  const operationWithMixedParams = ast.createOperation({
    operationId: 'createPets',
    method: 'POST',
    path: '/pets/{pet_id}',
    tags: ['pets'],
    parameters: [
      ast.createParameter({ name: 'pet_id', in: 'path', required: true, schema: ast.createSchema({ type: 'string' }) }),
      ast.createParameter({
        name: 'X-EXAMPLE',
        in: 'header',
        required: true,
        schema: ast.createSchema({ type: 'enum', primitive: 'string', enumValues: ['ONE', 'TWO', 'THREE'] }),
      }),
      ast.createParameter({ name: 'include_deleted', in: 'query', schema: ast.createSchema({ type: 'boolean' }) }),
    ],
    responses: [ast.createResponse({ statusCode: '201', schema: ast.createSchema({ type: 'void' }), description: 'Null response' })],
  })

  test('paramsCasing undefined — param names kept as-is', async () => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, paramsCasing: undefined }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver: resolverZodLegacy })
    const driver = createMockedPluginDriver({ name: 'legacy — paramsCasing undefined' })

    await renderGeneratorOperation(zodGeneratorLegacy, operationWithMixedParams, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverZodLegacy,
    })

    await matchFiles(driver.fileManager.files, 'legacy — paramsCasing undefined')
  })

  test('paramsCasing camelcase — param names converted to camelCase in property keys', async () => {
    const options: PluginZod['resolvedOptions'] = { ...defaultOptions, paramsCasing: 'camelcase' }
    const plugin = createMockedPlugin<PluginZod>({ name: 'plugin-zod', options, resolver: resolverZodLegacy })
    const driver = createMockedPluginDriver({ name: 'legacy — paramsCasing camelcase' })

    await renderGeneratorOperation(zodGeneratorLegacy, operationWithMixedParams, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverZodLegacy,
    })

    await matchFiles(driver.fileManager.files, 'legacy — paramsCasing camelcase')
  })
})
