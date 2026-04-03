/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */
import { createOperation, createParameter, createResponse, createSchema } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { Config } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperation } from '#mocks'
import { resolverMcp } from '../resolvers/resolverMcp.ts'
import type { PluginMcp } from '../types.ts'
import { mcpGenerator } from './mcpGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [] }

const defaultOptions: PluginMcp['resolvedOptions'] = {
  output: { path: '.' },
  client: {
    client: 'axios',
    baseURL: '',
    dataReturnType: 'data',
  },
  paramsCasing: undefined,
  group: undefined,
  resolver: resolverMcp,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: undefined } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

describe('mcpGenerator — Operation', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const operations = [
    {
      name: 'showPetById',
      node: createOperation({
        operationId: 'showPetById',
        method: 'GET',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'string' }), required: true })],
        responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Expected response' })],
      }),
    },
    {
      name: 'getPets',
      node: createOperation({
        operationId: 'getPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [createParameter({ name: 'limit', in: 'query', schema: createSchema({ type: 'integer' }) })],
        responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'A paged array of pets' })],
      }),
    },
    {
      name: 'getPetsTemplateString',
      node: createOperation({
        operationId: 'getPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [createParameter({ name: 'limit', in: 'query', schema: createSchema({ type: 'integer' }) })],
        responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'A paged array of pets' })],
      }),
      options: {
        client: {
          baseURL: '${123456}',
        },
      },
    },
    {
      name: 'createPet',
      node: createOperation({
        operationId: 'createPets',
        method: 'POST',
        path: '/pets',
        tags: ['pets'],
        requestBody: { description: 'Pet to add', schema: createSchema({ type: 'object', properties: [] }) },
        responses: [createResponse({ statusCode: '201', schema: createSchema({ type: 'object', properties: [] }), description: 'Null response' })],
      }),
    },
    {
      name: 'deletePet',
      node: createOperation({
        operationId: 'deletePet',
        method: 'DELETE',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'string' }), required: true })],
        responses: [createResponse({ statusCode: '204', description: 'No content', schema: createSchema({ type: 'void' }) })],
      }),
    },
  ] as const satisfies Array<{ name: string; node: OperationNode; options?: Partial<PluginMcp['resolvedOptions']> }>

  test.each(operations)('$name', async (props) => {
    const options: PluginMcp['resolvedOptions'] = {
      ...defaultOptions,
      ...('options' in props ? props.options : {}),
    }
    const plugin = createMockedPlugin<PluginMcp>({ name: 'plugin-mcp', options, resolver: resolverMcp })
    const driver = createMockedPluginDriver({ name: props.name, plugin: mockedTsPlugin })

    await renderGeneratorOperation(mcpGenerator, props.node, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverMcp,
    })

    await matchFiles(fabric.files, props.name)
  })
})
