import { createOperation, createParameter, createResponse, createSchema } from '@kubb/ast'
import type { EnumSchemaNode, OperationNode } from '@kubb/ast/types'
import type { Config } from '@kubb/core'
import { renderOperation, renderSchema } from '@kubb/core'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles } from '#mocks'
import { resolverTsLegacy } from '../resolvers/resolverTsLegacy.ts'
import type { PluginTs } from '../types.ts'
import { typeGeneratorLegacy } from './typeGeneratorLegacy.tsx'

describe('typeGeneratorLegacy — Operation', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const legacyOptions: PluginTs['resolvedOptions'] = {
    enumType: 'asConst',
    enumTypeSuffix: 'Key',
    enumKeyCasing: 'none',
    optionalType: 'questionToken',
    arrayType: 'array',
    syntaxType: 'type',
    paramsCasing: undefined,
    output: { path: '.' },
    group: undefined,
    resolver: resolverTsLegacy,
    transformers: [],
  }

  const testData = [
    {
      name: 'legacy — showPetById — GET with path param only',
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
      options: legacyOptions,
    })

    await matchFiles(fabric.files, props.name)
  })

  test('legacy — createPets with header param enum and name transformer — no Type infix in enum name', async () => {
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
      options,
    })

    await matchFiles(fabric.files, 'legacy — addPet POST with name transformer')
  })
})

describe('typeGeneratorLegacy — Schema (enum)', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const enumSchemaNode = createSchema({
    type: 'enum',
    name: 'petStatus',
    primitive: 'string',
    enumValues: ['available', 'pending', 'sold'],
  }) as EnumSchemaNode

  const defaultSchemaOptions: PluginTs['resolvedOptions'] = {
    enumType: 'asConst',
    enumTypeSuffix: 'Key',
    enumKeyCasing: 'none',
    optionalType: 'questionToken',
    arrayType: 'array',
    syntaxType: 'type',
    paramsCasing: undefined,
    output: { path: '.' },
    group: undefined,
    resolver: resolverTsLegacy,
    transformers: [],
  }

  test('enumTypeSuffix=Key (default) — asConst type alias uses Key suffix', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultSchemaOptions, enumTypeSuffix: 'Key' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })
    const mockedPluginDriver = createMockedPluginDriver({ name: 'legacy — petStatus enumTypeSuffix Key' })

    await renderSchema(enumSchemaNode, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      driver: mockedPluginDriver,
      Component: typeGeneratorLegacy.Schema,
      plugin,
      options,
    })

    await matchFiles(fabric.files, 'legacy — petStatus enumTypeSuffix Key')
  })

  test('enumTypeSuffix=Value — asConst type alias uses custom suffix', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultSchemaOptions, enumTypeSuffix: 'Value' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })
    const mockedPluginDriver = createMockedPluginDriver({ name: 'legacy — petStatus enumTypeSuffix Value' })

    await renderSchema(enumSchemaNode, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      driver: mockedPluginDriver,
      Component: typeGeneratorLegacy.Schema,
      plugin,
      options,
    })

    await matchFiles(fabric.files, 'legacy — petStatus enumTypeSuffix Value')
  })

  test('enumTypeSuffix empty string — asConst type alias has no suffix', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultSchemaOptions, enumTypeSuffix: '' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })
    const mockedPluginDriver = createMockedPluginDriver({ name: 'legacy — petStatus enumTypeSuffix empty' })

    await renderSchema(enumSchemaNode, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      driver: mockedPluginDriver,
      Component: typeGeneratorLegacy.Schema,
      plugin,
      options,
    })

    await matchFiles(fabric.files, 'legacy — petStatus enumTypeSuffix empty')
  })
})
