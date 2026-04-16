/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import type { Config } from '@kubb/core'
import { ast } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperation } from '#mocks'
import { resolverMcp } from '../resolvers/resolverMcp.ts'
import type { PluginMcp } from '../types.ts'
import { mcpGenerator } from './mcpGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [], parsers: [], adapter: createMockedAdapter() }

const defaultOptions: PluginMcp['resolvedOptions'] = {
  output: { path: '.' },
  exclude: [],
  include: undefined,
  override: [],
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
  const operations = [
    {
      name: 'showPetById',
      node: ast.createOperation({
        operationId: 'showPetById',
        method: 'GET',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
        responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Expected response' })],
      }),
    },
    {
      name: 'getPets',
      node: ast.createOperation({
        operationId: 'getPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [ast.createParameter({ name: 'limit', in: 'query', schema: ast.createSchema({ type: 'integer' }) })],
        responses: [
          ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'A paged array of pets' }),
        ],
      }),
    },
    {
      name: 'getPetsTemplateString',
      node: ast.createOperation({
        operationId: 'getPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [ast.createParameter({ name: 'limit', in: 'query', schema: ast.createSchema({ type: 'integer' }) })],
        responses: [
          ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'A paged array of pets' }),
        ],
      }),
      options: {
        client: {
          baseURL: '${123456}',
        },
      },
    },
    {
      name: 'createPet',
      node: ast.createOperation({
        operationId: 'createPets',
        method: 'POST',
        path: '/pets',
        tags: ['pets'],
        requestBody: { description: 'Pet to add', schema: ast.createSchema({ type: 'object', properties: [] }) },
        responses: [ast.createResponse({ statusCode: '201', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Null response' })],
      }),
    },
    {
      name: 'deletePet',
      node: ast.createOperation({
        operationId: 'deletePet',
        method: 'DELETE',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
        responses: [ast.createResponse({ statusCode: '204', description: 'No content', schema: ast.createSchema({ type: 'void' }) })],
      }),
    },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options?: Partial<PluginMcp['resolvedOptions']> }>

  test.each(operations)('$name', async (props) => {
    const options: PluginMcp['resolvedOptions'] = {
      ...defaultOptions,
      ...('options' in props ? props.options : {}),
    }
    const plugin = createMockedPlugin<PluginMcp>({ name: 'plugin-mcp', options, resolver: resolverMcp })
    const driver = createMockedPluginDriver({ name: props.name, plugin: mockedTsPlugin })

    await renderGeneratorOperation(mcpGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverMcp,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})
