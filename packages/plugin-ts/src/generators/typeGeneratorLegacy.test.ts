import type { Config } from '@kubb/core'
import { ast } from '@kubb/core'
import { describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperation, renderGeneratorSchema } from '#mocks'
import { resolverTsLegacy } from '../resolvers/resolverTsLegacy.ts'
import type { PluginTs } from '../types.ts'
import { typeGeneratorLegacy } from './typeGeneratorLegacy.tsx'

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

describe('typeGeneratorLegacy — Operation', () => {
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
          ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'A paged array of pets' }),
          ast.createResponse({ statusCode: 'default', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Unexpected error' }),
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
        requestBody: { schema: ast.createSchema({ type: 'object', properties: [] }) },
        responses: [
          ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Successful operation' }),
          ast.createResponse({ statusCode: '405', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
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
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options: defaultOptions, resolver: resolverTsLegacy })
    const driver = createMockedPluginDriver({ name: props.name })

    await renderGeneratorOperation(typeGeneratorLegacy, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverTsLegacy,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })

  test('legacy — custom resolver — name transformer adds Type suffix', async () => {
    const wrappedResolver: typeof resolverTsLegacy = {
      ...resolverTsLegacy,
      default(name, type) {
        return `${resolverTsLegacy.default(name, type)}Type`
      },
    }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options: defaultOptions, resolver: wrappedResolver })
    const driver = createMockedPluginDriver({ name: 'legacy — addPet — name transformer' })

    const node = ast.createOperation({
      operationId: 'addPet',
      method: 'POST',
      path: '/pet',
      tags: ['pet'],
      requestBody: { schema: ast.createSchema({ type: 'object', properties: [] }) },
      responses: [
        ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Successful operation' }),
        ast.createResponse({ statusCode: '405', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
      ],
    })

    await renderGeneratorOperation(typeGeneratorLegacy, node, {
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

describe('typeGeneratorLegacy — enumTypeSuffix', () => {
  const enumSchema = ast.createSchema({
    type: 'enum',
    name: 'petStatus',
    primitive: 'string',
    enumValues: ['available', 'pending', 'sold'],
  })

  test('enumTypeSuffix Key (default)', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enumTypeSuffix: 'Key' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTsLegacy })
    const driver = createMockedPluginDriver({ name: 'legacy — enumTypeSuffix Key' })

    await renderGeneratorSchema(typeGeneratorLegacy, enumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTsLegacy,
    })

    await matchFiles(driver.fileManager.files, 'legacy — enumTypeSuffix Key')
  })

  test('enumTypeSuffix Value', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enumTypeSuffix: 'Value' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTsLegacy })
    const driver = createMockedPluginDriver({ name: 'legacy — enumTypeSuffix Value' })

    await renderGeneratorSchema(typeGeneratorLegacy, enumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTsLegacy,
    })

    await matchFiles(driver.fileManager.files, 'legacy — enumTypeSuffix Value')
  })

  test('enumTypeSuffix empty string', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enumTypeSuffix: '' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTsLegacy })
    const driver = createMockedPluginDriver({ name: 'legacy — enumTypeSuffix empty' })

    await renderGeneratorSchema(typeGeneratorLegacy, enumSchema, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverTsLegacy,
    })

    await matchFiles(driver.fileManager.files, 'legacy — enumTypeSuffix empty')
  })
})
