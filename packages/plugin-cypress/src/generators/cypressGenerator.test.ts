/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import type { Config } from '@kubb/core'
import { ast } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperation } from '#mocks'
import { resolverCypress } from '../resolvers/resolverCypress.ts'
import type { PluginCypress } from '../types.ts'
import { cypressGenerator } from './cypressGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [], parsers: [], adapter: createMockedAdapter() }

const defaultOptions: PluginCypress['resolvedOptions'] = {
  output: { path: '.' },
  exclude: [],
  include: undefined,
  override: [],
  baseURL: undefined,
  group: undefined,
  dataReturnType: 'data',
  paramsCasing: 'camelcase',
  paramsType: 'inline',
  pathParamsType: 'inline',
  resolver: resolverCypress,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: undefined } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

describe('cypressGenerator — Operation', () => {
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
      name: 'updatePet',
      node: ast.createOperation({
        operationId: 'updatePet',
        method: 'PUT',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
        requestBody: { schema: ast.createSchema({ type: 'object', properties: [] }) },
        responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Updated pet' })],
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
  ] as const satisfies Array<{ name: string; node: ast.OperationNode }>

  test.each(operations)('$name', async (props) => {
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options: defaultOptions, resolver: resolverCypress })
    const driver = createMockedPluginDriver({ name: props.name, plugin: mockedTsPlugin })

    await renderGeneratorOperation(cypressGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverCypress,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})

describe('cypressGenerator — dataReturnType', () => {
  const node = ast.createOperation({
    operationId: 'getPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    parameters: [ast.createParameter({ name: 'limit', in: 'query', schema: ast.createSchema({ type: 'integer' }) })],
    responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'A paged array of pets' })],
  })

  test('data — returns res.body', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions, dataReturnType: 'data' }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({ name: 'dataReturnType data', plugin: mockedTsPlugin })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'dataReturnType data')
  })

  test('full — returns entire Chainable', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions, dataReturnType: 'full' }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({ name: 'dataReturnType full', plugin: mockedTsPlugin })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'dataReturnType full')
  })
})

describe('cypressGenerator — paramsType', () => {
  const node = ast.createOperation({
    operationId: 'updatePet',
    method: 'PUT',
    path: '/pets/{petId}',
    tags: ['pets'],
    parameters: [
      ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true }),
      ast.createParameter({ name: 'status', in: 'query', schema: ast.createSchema({ type: 'string' }) }),
    ],
    requestBody: { schema: ast.createSchema({ type: 'object', properties: [] }) },
    responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Updated pet' })],
  })

  test('inline — separate arguments per param group', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions, paramsType: 'inline' }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({ name: 'paramsType inline', plugin: mockedTsPlugin })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'paramsType inline')
  })

  test('object — all params merged into single object', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions, paramsType: 'object' }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({ name: 'paramsType object', plugin: mockedTsPlugin })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'paramsType object')
  })
})

describe('cypressGenerator — pathParamsType', () => {
  const node = ast.createOperation({
    operationId: 'showPetById',
    method: 'GET',
    path: '/pets/{petId}',
    tags: ['pets'],
    parameters: [
      ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true }),
      ast.createParameter({ name: 'limit', in: 'query', schema: ast.createSchema({ type: 'integer' }) }),
    ],
    responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Expected response' })],
  })

  test('inline — each path param as individual argument', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions, paramsType: 'inline', pathParamsType: 'inline' }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({ name: 'pathParamsType inline', plugin: mockedTsPlugin })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'pathParamsType inline')
  })

  test('object — path params grouped into destructured object', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions, paramsType: 'inline', pathParamsType: 'object' }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({ name: 'pathParamsType object', plugin: mockedTsPlugin })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'pathParamsType object')
  })
})

describe('cypressGenerator — paramsCasing', () => {
  const node = ast.createOperation({
    operationId: 'getPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    parameters: [ast.createParameter({ name: 'page_size', in: 'query', schema: ast.createSchema({ type: 'integer' }) })],
    responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'A paged array of pets' })],
  })

  test('camelcase — query param name is camelCased', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions, paramsCasing: 'camelcase' }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({ name: 'paramsCasing camelcase', plugin: mockedTsPlugin })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'paramsCasing camelcase')
  })

  test('undefined — query param name is unchanged', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions, paramsCasing: undefined }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({ name: 'paramsCasing undefined', plugin: mockedTsPlugin })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'paramsCasing undefined')
  })
})

describe('cypressGenerator — paramsCasing headers', () => {
  const nodeWithHeaders = ast.createOperation({
    operationId: 'getPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    parameters: [
      ast.createParameter({ name: 'page_size', in: 'query', schema: ast.createSchema({ type: 'integer' }) }),
      ast.createParameter({ name: 'x-api-key', in: 'header', schema: ast.createSchema({ type: 'string' }), required: true }),
    ],
    responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'A paged array of pets' })],
  })

  test('camelcase — header and query param names are camelCased and remapped', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions, paramsCasing: 'camelcase' }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({ name: 'paramsCasing camelcase headers', plugin: mockedTsPlugin })

    await renderGeneratorOperation(cypressGenerator, nodeWithHeaders, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'paramsCasing camelcase headers')
  })
})

describe('cypressGenerator — baseURL', () => {
  const node = ast.createOperation({
    operationId: 'getPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    parameters: [ast.createParameter({ name: 'limit', in: 'query', schema: ast.createSchema({ type: 'integer' }) })],
    responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'A paged array of pets' })],
  })

  test('static string — prepended to url', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions, baseURL: 'https://api.example.com' }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({ name: 'baseURL static', plugin: mockedTsPlugin })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'baseURL static')
  })

  test('template string — emitted as template literal', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions, baseURL: '${123456}' }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({ name: 'baseURL template', plugin: mockedTsPlugin })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'baseURL template')
  })
})

describe('cypressGenerator — transformers', () => {
  test('schema visitor — filters to required properties only', async () => {
    const transformer: ast.Visitor = {
      schema(node) {
        if ('properties' in node) {
          return { ...node, properties: node.properties.filter((p) => p.required) }
        }
        return undefined
      },
    }

    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options: defaultOptions, resolver: resolverCypress, transformer })
    const driver = createMockedPluginDriver({ name: 'transformers schema visitor', plugin: mockedTsPlugin })

    const node = ast.createOperation({
      operationId: 'createPets',
      method: 'POST',
      path: '/pets',
      tags: ['pets'],
      requestBody: { schema: ast.createSchema({ type: 'object', properties: [] }) },
      responses: [ast.createResponse({ statusCode: '201', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Null response' })],
    })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'transformers schema visitor')
  })
})
