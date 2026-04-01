import { createOperation, createParameter, createResponse, createSchema } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { Config } from '@kubb/core'
import { renderOperation, renderSchema } from '@kubb/core'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles } from '#mocks'
import { resolverTsLegacy } from '../resolvers/resolverTsLegacy.ts'
import type { PluginTs } from '../types.ts'
import { typeGeneratorLegacy } from './typeGeneratorLegacy.tsx'

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
  transformers: [],
}

describe('typeGeneratorLegacy — Operation', () => {
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
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options: defaultOptions, resolver: resolverTsLegacy })
    const driver = createMockedPluginDriver({ name: props.name })

    await renderOperation(props.node, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGeneratorLegacy.Operation,
      plugin,
      options: defaultOptions,
      resolver: resolverTsLegacy,
    })

    await matchFiles(fabric.files, props.name)
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
      Component: typeGeneratorLegacy.Operation,
      plugin,
      options: defaultOptions,
      resolver: wrappedResolver,
    })

    await matchFiles(fabric.files, 'legacy — addPet — name transformer')
  })
})

describe('typeGeneratorLegacy — enumTypeSuffix', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const enumSchema = createSchema({
    type: 'enum',
    name: 'petStatus',
    primitive: 'string',
    enumValues: ['available', 'pending', 'sold'],
  })

  test('enumTypeSuffix Key (default)', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enumTypeSuffix: 'Key' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTsLegacy })
    const driver = createMockedPluginDriver({ name: 'legacy — enumTypeSuffix Key' })

    await renderSchema(enumSchema, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGeneratorLegacy.Schema,
      plugin,
      options,
      resolver: resolverTsLegacy,
    })

    await matchFiles(fabric.files, 'legacy — enumTypeSuffix Key')
  })

  test('enumTypeSuffix Value', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enumTypeSuffix: 'Value' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTsLegacy })
    const driver = createMockedPluginDriver({ name: 'legacy — enumTypeSuffix Value' })

    await renderSchema(enumSchema, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGeneratorLegacy.Schema,
      plugin,
      options,
      resolver: resolverTsLegacy,
    })

    await matchFiles(fabric.files, 'legacy — enumTypeSuffix Value')
  })

  test('enumTypeSuffix empty string', async () => {
    const options: PluginTs['resolvedOptions'] = { ...defaultOptions, enumTypeSuffix: '' }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options, resolver: resolverTsLegacy })
    const driver = createMockedPluginDriver({ name: 'legacy — enumTypeSuffix empty' })

    await renderSchema(enumSchema, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: typeGeneratorLegacy.Schema,
      plugin,
      options,
      resolver: resolverTsLegacy,
    })

    await matchFiles(fabric.files, 'legacy — enumTypeSuffix empty')
  })
})
