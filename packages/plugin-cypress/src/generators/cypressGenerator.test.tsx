/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */
import { createOperation, createParameter, createResponse, createSchema } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { Config } from '@kubb/core'
import { renderOperation } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles } from '#mocks'
import { resolverCypress } from '../resolvers/resolverCypress.ts'
import type { PluginCypress } from '../types.ts'
import { cypressGenerator } from './cypressGenerator.tsx'

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: undefined } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

describe('cypressGenerator operation', async () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const testData = [
    {
      name: 'showPetById',
      node: createOperation({
        operationId: 'showPetById',
        method: 'GET',
        path: '/pets/:petId',
        tags: ['pets'],
        parameters: [
          createParameter({
            name: 'petId',
            in: 'path',
            schema: createSchema({ type: 'string' }),
            required: true,
          }),
        ],
        responses: [
          createResponse({
            statusCode: '200',
            schema: createSchema({ type: 'object', properties: [] }),
            description: 'Expected response',
          }),
        ],
      }),
    },
    {
      name: 'getPets',
      node: createOperation({
        operationId: 'getPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [
          createParameter({
            name: 'limit',
            in: 'query',
            schema: createSchema({ type: 'integer' }),
          }),
        ],
        responses: [
          createResponse({
            statusCode: '200',
            schema: createSchema({ type: 'object', properties: [] }),
            description: 'A paged array of pets',
          }),
        ],
      }),
    },
    {
      name: 'getPetsWithTemplateString',
      node: createOperation({
        operationId: 'getPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [
          createParameter({
            name: 'limit',
            in: 'query',
            schema: createSchema({ type: 'integer' }),
          }),
        ],
        responses: [
          createResponse({
            statusCode: '200',
            schema: createSchema({ type: 'object', properties: [] }),
            description: 'A paged array of pets',
          }),
        ],
      }),
      options: {
        baseURL: '${123456}',
      },
    },
    {
      name: 'createPet',
      node: createOperation({
        operationId: 'createPets',
        method: 'POST',
        path: '/pets',
        tags: ['pets'],
        requestBody: {
          description: 'Pet to add',
          schema: createSchema({ type: 'object', properties: [] }),
        },
        responses: [
          createResponse({
            statusCode: '201',
            schema: createSchema({ type: 'object', properties: [] }),
            description: 'Null response',
          }),
        ],
      }),
    },
    {
      name: 'updatePet',
      node: createOperation({
        operationId: 'updatePet',
        method: 'PUT',
        path: '/pets/:petId',
        tags: ['pets'],
        parameters: [
          createParameter({
            name: 'petId',
            in: 'path',
            schema: createSchema({ type: 'string' }),
            required: true,
          }),
        ],
        requestBody: {
          schema: createSchema({ type: 'object', properties: [] }),
        },
        responses: [
          createResponse({
            statusCode: '200',
            schema: createSchema({ type: 'object', properties: [] }),
            description: 'Updated pet',
          }),
        ],
      }),
    },
    {
      name: 'deletePet',
      node: createOperation({
        operationId: 'deletePet',
        method: 'DELETE',
        path: '/pets/:petId',
        tags: ['pets'],
        parameters: [
          createParameter({
            name: 'petId',
            in: 'path',
            schema: createSchema({ type: 'string' }),
            required: true,
          }),
        ],
        responses: [
          createResponse({
            statusCode: '204',
            description: 'No content',
            schema: createSchema({ type: 'void' }),
          }),
        ],
      }),
    },
  ] as const satisfies Array<{
    name: string
    node: OperationNode
    options?: Partial<PluginCypress['resolvedOptions']>
  }>

  const defaultOptions: PluginCypress['resolvedOptions'] = {
    output: {
      path: '.',
    },
    baseURL: undefined,
    group: undefined,
    dataReturnType: 'data',
    paramsCasing: 'camelcase',
    paramsType: 'inline',
    pathParamsType: 'inline',
    resolver: resolverCypress,
    transformers: [],
  }

  test.each(testData)('$name', async (props) => {
    const options: PluginCypress['resolvedOptions'] = {
      ...defaultOptions,
      ...('options' in props ? props.options : {}),
    }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })

    const mockedPluginDriver = createMockedPluginDriver({ name: props.name, plugin: mockedTsPlugin })

    await renderOperation(props.node, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      adapter: createMockedAdapter(),
      driver: mockedPluginDriver,
      Component: cypressGenerator.Operation,
      plugin,
      options,
      resolver: resolverCypress,
    })

    await matchFiles(fabric.files, props.name)
  })
})
