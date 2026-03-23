import { createOperation, createProperty, createResponse, createSchema } from '@kubb/ast'
import type { Visitor } from '@kubb/ast/types'
import type { Config } from '@kubb/core'
import { renderOperation, renderSchema } from '@kubb/core'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, it } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles } from '#mocks'
import { resolverTs } from '../resolvers/index.ts'
import type { PluginTs } from '../types.ts'
import { typeGenerator } from './typeGenerator.tsx'

describe('transformers — integration with typeGenerator Schema', () => {
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
    baseResolver: resolverTs,
    transformers: [],
  }

  it('renders schema without transformers', async () => {
    const node = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({
          name: 'name',
          schema: createSchema({ type: 'string' }),
          required: true,
        }),
      ],
    })

    const options: PluginTs['resolvedOptions'] = { ...defaultOptions }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })

    await renderSchema(node, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      driver: createMockedPluginDriver({ name: 'Pet' }),
      Component: typeGenerator.Schema,
      plugin,
      mode: 'split',
      options,
    })

    await matchFiles(fabric.files, 'schema-no-transformers')
  })

  it('renders schema with transformer that modifies description', async () => {
    const node = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({
          name: 'name',
          schema: createSchema({ type: 'string' }),
          required: true,
        }),
      ],
    })

    const visitor: Visitor = {
      schema(n) {
        if (n.name === 'Pet') {
          return { ...n, description: 'A transformed pet' }
        }
      },
    }

    const options: PluginTs['resolvedOptions'] = {
      ...defaultOptions,
      transformers: [visitor],
    }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })

    await renderSchema(node, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      driver: createMockedPluginDriver({ name: 'Pet-transformed' }),
      Component: typeGenerator.Schema,
      plugin,
      mode: 'split',
      options,
    })

    await matchFiles(fabric.files, 'schema-with-description-transformer')
  })
})

describe('transformers — property requiredness auto-sync', () => {
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
    baseResolver: resolverTs,
    transformers: [],
  }

  it('renders required properties when transformer sets required: true on specific parent', async () => {
    const node = createSchema({
      type: 'object',
      name: 'Address',
      properties: [
        createProperty({
          name: 'street',
          schema: createSchema({ type: 'string' }),
          required: false,
        }),
        createProperty({
          name: 'city',
          schema: createSchema({ type: 'string' }),
          required: false,
        }),
      ],
    })

    const visitor: Visitor = {
      property(prop, { parent }) {
        if (parent?.kind === 'Schema' && 'name' in parent && parent.name === 'Address') {
          return { ...prop, required: true }
        }
      },
    }

    const options: PluginTs['resolvedOptions'] = {
      ...defaultOptions,
      transformers: [visitor],
    }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })

    await renderSchema(node, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      driver: createMockedPluginDriver({ name: 'Address-required' }),
      Component: typeGenerator.Schema,
      plugin,
      mode: 'split',
      options,
    })

    await matchFiles(fabric.files, 'schema-property-required-transformer')
  })
})

describe('transformers — integration with typeGenerator Operation', () => {
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
    baseResolver: resolverTs,
    transformers: [],
  }

  it('renders operation with transformer that modifies response schema', async () => {
    const node = createOperation({
      operationId: 'listPets',
      method: 'GET',
      path: '/pets',
      tags: ['pets'],
      responses: [
        createResponse({
          statusCode: '200',
          schema: createSchema({
            type: 'object',
            properties: [
              createProperty({
                name: 'id',
                schema: createSchema({ type: 'integer' }),
                required: true,
              }),
            ],
          }),
          description: 'List of pets',
        }),
      ],
    })

    const visitor: Visitor = {
      schema(n) {
        if (n.type === 'object') {
          return { ...n, description: 'transformed response' }
        }
      },
    }

    const options: PluginTs['resolvedOptions'] = {
      ...defaultOptions,
      transformers: [visitor],
    }
    const plugin = createMockedPlugin<PluginTs>({ name: 'plugin-ts', options })

    await renderOperation(node, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      driver: createMockedPluginDriver({ name: 'listPets-with-transformer' }),
      Component: typeGenerator.Operation,
      plugin,
      mode: 'split',
      options,
    })

    await matchFiles(fabric.files, 'operation-with-transformer')
  })
})
