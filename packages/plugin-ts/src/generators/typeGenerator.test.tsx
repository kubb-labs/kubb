import path from 'node:path'
import { createOperation, createParameter, createResponse, createSchema } from '@kubb/ast'
import type { EnumSchemaNode, OperationNode } from '@kubb/ast/types'
import type { Config } from '@kubb/core'
import { renderOperation, renderSchema } from '@kubb/core'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, expect, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles } from '#mocks'
import { resolverTs, resolverTsLegacy } from '../resolvers'
import type { PluginTs } from '../types.ts'
import { typeGenerator } from './typeGenerator.tsx'
import { typeGeneratorLegacy } from './typeGeneratorLegacy.tsx'

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
        requestBody: {
          description: 'Pet to add',
          schema: createSchema({
            type: 'object',
            properties: [],
          }),
        },
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
        path: '/pets/:petId',
        tags: ['pets'],
        parameters: [createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'string' }), required: true })],
        responses: [
          createResponse({
            statusCode: '204',
            description: 'No content',
            schema: createSchema({
              type: 'void',
            }),
          }),
        ],
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
      name: 'noTagsOperation — GET with no tags (Bug 4 regression)',
      node: createOperation({
        operationId: 'get_enterprise_configurations_id_v2025.0',
        method: 'GET',
        path: '/enterprise_configurations/:enterprise_id',
        tags: [],
        parameters: [createParameter({ name: 'enterprise_id', in: 'path', schema: createSchema({ type: 'string' }), required: true })],
        responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Enterprise config' })],
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
  ] as const satisfies Array<{ name: string; node: OperationNode; options?: Partial<PluginTs['resolvedOptions']> }>

  const defaultOptions: PluginTs['resolvedOptions'] = {
    enumType: 'asConst',
    enumKeyCasing: 'none',
    optionalType: 'questionToken',
    arrayType: 'array',
    syntaxType: 'type',
    override: [],
    paramsCasing: undefined,
    output: { path: '.' },
    group: undefined,
    resolver: resolverTs,
    compatibilityPreset: 'default',
    transformers: [],
  }

  test.each(testData)('$name', async (props) => {
    const options: PluginTs['resolvedOptions'] = {
      ...defaultOptions,
      ...('options' in props ? props.options : {}),
    }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })
    const mockedPluginDriver = createMockedPluginDriver({ name: props.name })

    await renderOperation(props.node, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      driver: mockedPluginDriver,
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
    optionalType: 'questionToken',
    arrayType: 'array',
    syntaxType: 'type',
    override: [],
    paramsCasing: undefined,
    output: { path: '.' },
    group: undefined,
    resolver: resolverTs,
    compatibilityPreset: 'default',
    transformers: [],
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

  test.each([
    { group: { type: 'tag' as const }, expectedBaseName: 'ListPets.ts', expectedDir: 'petsController' },
    { group: undefined, expectedBaseName: 'ListPets.ts', expectedDir: undefined },
  ])('group=$group.type — file path is computed correctly', async ({ group, expectedBaseName, expectedDir }) => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, group }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })
    const driverConfig = { root: '.', output: { path: 'test' } } as Config
    const mockedPluginDriver = createMockedPluginDriver({ name: 'listPets', config: driverConfig })

    await renderOperation(node, {
      config: driverConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver: mockedPluginDriver,
      Component: typeGenerator.Operation,
      plugin,
      mode: 'split',
      options,
    })

    const file = fabric.files.find((f) => f.baseName === expectedBaseName)
    expect(file).toBeDefined()
    const root = path.resolve(driverConfig.root, driverConfig.output.path)
    const expectedPath = expectedDir ? path.resolve(root, expectedDir, expectedBaseName) : path.resolve(root, expectedBaseName)
    expect(file!.path).toBe(expectedPath)
  })

  test('group=tag with empty tags falls back to default (Bug 4 regression)', async () => {
    const noTagNode = createOperation({
      operationId: 'getConfig',
      method: 'GET',
      path: '/config',
      tags: [],
      responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Config' })],
    })
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, group: { type: 'tag' } }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })
    const driverConfig = { root: '.', output: { path: 'test' } } as Config
    const mockedPluginDriver = createMockedPluginDriver({ name: 'getConfig', config: driverConfig })

    await renderOperation(noTagNode, {
      config: driverConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver: mockedPluginDriver,
      Component: typeGenerator.Operation,
      plugin,
      mode: 'split',
      options,
    })

    const file = fabric.files.find((f) => f.baseName === 'GetConfig.ts')
    expect(file).toBeDefined()
    const root = path.resolve(driverConfig.root, driverConfig.output.path)
    expect(file!.path).toBe(path.resolve(root, 'defaultController', 'GetConfig.ts'))
  })
})

describe('typeGenerator v2 — Schema (enum)', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  /**
   * Raw YAML key name with a dot (e.g. `enumNames.Type`) — the kind of name that comes
   * straight from the OAS adapter for top-level schemas and is NOT a valid TS identifier.
   * This is the exact scenario that the constEnum bug was triggered by.
   */
  const enumSchemaNode = createSchema({
    type: 'enum',
    name: 'enumNames.Type',
    primitive: 'string',
    enumValues: ['available', 'pending', 'sold'],
  }) as EnumSchemaNode

  const defaultSchemaOptions: PluginTs['resolvedOptions'] = {
    enumType: 'asConst',
    enumKeyCasing: 'none',
    optionalType: 'questionToken',
    arrayType: 'array',
    syntaxType: 'type',
    override: [],
    paramsCasing: undefined,
    output: { path: '.' },
    group: undefined,
    resolver: resolverTs,
    compatibilityPreset: 'default',
    transformers: [],
  }

  const enumTypes = ['asConst', 'asPascalConst', 'constEnum', 'enum', 'literal', 'inlineLiteral'] as const

  test.each(enumTypes.map((et) => ({ enumType: et })))('enumType=$enumType — top-level enum with dotted name', async ({ enumType }) => {
    const options: PluginTs['resolvedOptions'] = { ...defaultSchemaOptions, enumType }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })
    const mockedPluginDriver = createMockedPluginDriver({ name: `enumNames.Type — ${enumType}` })

    await renderSchema(enumSchemaNode, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      driver: mockedPluginDriver,
      Component: typeGenerator.Schema,
      plugin,
      mode: 'split',
      options,
    })

    await matchFiles(fabric.files, `enumNames.Type — ${enumType}`)
  })
})

describe('typeGenerator v2 — Operation — legacy', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const legacyOptions: PluginTs['resolvedOptions'] = {
    enumType: 'asConst',
    enumKeyCasing: 'none',
    optionalType: 'questionToken',
    arrayType: 'array',
    syntaxType: 'type',
    override: [],
    paramsCasing: undefined,
    output: { path: '.' },
    group: undefined,
    resolver: resolverTsLegacy,
    compatibilityPreset: 'kubbV4',
    transformers: [],
  }

  const testData = [
    {
      name: 'legacy — findPetsByStatus with query param enum',
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
      name: 'legacy — deletePet with response enum array',
      node: createOperation({
        operationId: 'deletePet',
        method: 'DELETE',
        path: '/pet/:petId',
        tags: ['pet'],
        parameters: [createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'string' }), required: true })],
        responses: [
          createResponse({
            statusCode: '200',
            schema: createSchema({
              type: 'array',
              items: [createSchema({ type: 'enum', primitive: 'string', enumValues: ['TYPE1', 'TYPE2', 'TYPE3'] })],
            }),
            description: 'Successful deletion',
          }),
        ],
      }),
    },
    {
      name: 'legacy — listPets basic GET',
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
      name: 'legacy — updatePetWithForm POST with query params and path params',
      node: createOperation({
        operationId: 'updatePetWithForm',
        method: 'POST',
        path: '/pet/:petId',
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
      name: 'legacy — uploadFile POST with query params and request body',
      node: createOperation({
        operationId: 'uploadFile',
        method: 'POST',
        path: '/pet/:petId/uploadImage',
        tags: ['pet'],
        parameters: [
          createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'integer' }), required: true }),
          createParameter({ name: 'additionalMetadata', in: 'query', schema: createSchema({ type: 'string' }) }),
        ],
        requestBody: { schema: createSchema({ type: 'string', format: 'binary' }) },
        responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
      }),
    },
  ] as const satisfies Array<{ name: string; node: OperationNode }>

  test.each(testData)('$name', async (props) => {
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options: legacyOptions })
    const mockedPluginDriver = createMockedPluginDriver({ name: props.name })

    await renderOperation(props.node, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      driver: mockedPluginDriver,
      Component: typeGeneratorLegacy.Operation,
      plugin,
      mode: 'split',
      options: legacyOptions,
    })

    await matchFiles(fabric.files, props.name)
  })

  test('legacy — createPets with header param enum and name transformer — no Type infix in enum name', async () => {
    // Wrap the resolver's default() so every resolved name goes through a custom transform.
    const wrappedResolver: typeof resolverTsLegacy = {
      ...resolverTsLegacy,
      default(name, type) {
        const resolved = resolverTsLegacy.default(name, type)
        return `${resolved}Type`
      },
    }

    const options: PluginTs['resolvedOptions'] = {
      ...legacyOptions,
      resolver: wrappedResolver,
    }

    const node = createOperation({
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
    })

    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })
    const mockedPluginDriver = createMockedPluginDriver({ name: 'legacy createPets header param enum transformer' })

    await renderOperation(node, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      driver: mockedPluginDriver,
      Component: typeGeneratorLegacy.Operation,
      plugin,
      mode: 'split',
      options,
    })

    await matchFiles(fabric.files, 'legacy — createPets with header param enum and name transformer')
  })

  test('legacy — listPets GET with name transformer — Query suffix after Type', async () => {
    const wrappedResolver: typeof resolverTsLegacy = {
      ...resolverTsLegacy,
      default(name, type) {
        const resolved = resolverTsLegacy.default(name, type)
        return `${resolved}Type`
      },
    }

    const options: PluginTs['resolvedOptions'] = {
      ...legacyOptions,
      resolver: wrappedResolver,
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

    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })
    const mockedPluginDriver = createMockedPluginDriver({ name: 'legacy listPets GET name transformer' })

    await renderOperation(node, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      driver: mockedPluginDriver,
      Component: typeGeneratorLegacy.Operation,
      plugin,
      mode: 'split',
      options,
    })

    await matchFiles(fabric.files, 'legacy — listPets GET with name transformer')
  })

  test('legacy — addPet POST with name transformer — Mutation suffix after Type', async () => {
    const wrappedResolver: typeof resolverTsLegacy = {
      ...resolverTsLegacy,
      default(name, type) {
        const resolved = resolverTsLegacy.default(name, type)
        return `${resolved}Type`
      },
    }

    const options: PluginTs['resolvedOptions'] = {
      ...legacyOptions,
      resolver: wrappedResolver,
    }

    const node = createOperation({
      operationId: 'addPet',
      method: 'POST',
      path: '/pet',
      tags: ['pet'],
      requestBody: {
        schema: createSchema({ type: 'object', properties: [] }),
      },
      responses: [
        createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Successful operation' }),
        createResponse({ statusCode: '405', schema: createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
      ],
    })

    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })
    const mockedPluginDriver = createMockedPluginDriver({ name: 'legacy addPet POST name transformer' })

    await renderOperation(node, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      driver: mockedPluginDriver,
      Component: typeGeneratorLegacy.Operation,
      plugin,
      mode: 'split',
      options,
    })

    await matchFiles(fabric.files, 'legacy — addPet POST with name transformer')
  })
})
