import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin, PluginManager } from '@kubb/core'
import { parse, parseFromConfig } from '@kubb/oas'
import { createReactFabric } from '@kubb/react-fabric'
import { describe, expect, test } from 'vitest'
import { OperationGenerator } from './OperationGenerator.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('OperationGenerator core', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: path.join(__dirname, '../mocks/petStore.yaml') },
  })

  test('if pathParams return undefined when there are no params in path', async () => {
    const fabric = createReactFabric()

    const og = new OperationGenerator(
      {},
      {
        fabric,
        oas,
        contentType: undefined,
        pluginManager: undefined as unknown as PluginManager,
        plugin: {} as Plugin,
        exclude: [],
        include: undefined,
        override: undefined,
        mode: 'split',
      },
    )

    expect(og.getSchemas(oas.operation('/pets', 'get')).pathParams).toBeUndefined()
    expect(og.getSchemas(oas.operation('/pets', 'get')).queryParams).toBeDefined()
  })

  test('enforces required requestBody for oneOf schemas', async () => {
    const oasWithRequiredBody = await parse({
      openapi: '3.0.3',
      info: {
        title: 'test',
        version: '1.0.0',
      },
      paths: {
        '/orders': {
          post: {
            operationId: 'createOrder',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    oneOf: [
                      {
                        type: 'object',
                        required: ['manual'],
                        properties: {
                          manual: { type: 'string' },
                        },
                      },
                      {
                        type: 'object',
                        required: ['automated'],
                        properties: {
                          automated: { type: 'string' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'ok',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    const fabric = createReactFabric()
    const og = new OperationGenerator(
      {},
      {
        fabric,
        oas: oasWithRequiredBody,
        contentType: undefined,
        pluginManager: undefined as unknown as PluginManager,
        plugin: {} as Plugin,
        exclude: [],
        include: undefined,
        override: undefined,
        mode: 'split',
      },
    )

    const schemas = og.getSchemas(oasWithRequiredBody.operation('/orders', 'post'))
    expect(schemas.request?.schema.required).toStrictEqual(['__kubb_required_request_body__'])
  })
})

describe('OperationGenerator exclude', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: path.join(__dirname, '../mocks/petStore.yaml') },
  })
  test('if exclude is filtered out for tag', async () => {
    const fabric = createReactFabric()

    const og = new OperationGenerator(
      {},
      {
        fabric,
        oas,
        exclude: [
          {
            type: 'tag',
            pattern: 'pets',
          },
        ],
        include: undefined,
        pluginManager: undefined as unknown as PluginManager,
        plugin: {} as Plugin,
        contentType: undefined,
        override: undefined,
        mode: 'split',
      },
    )

    const operations = await og.getOperations()

    expect(operations.map((op) => op.path)).toMatchSnapshot()
  })

  test('if exclude is filtered out for operationId', async () => {
    const fabric = createReactFabric()

    const og = new OperationGenerator(
      {},
      {
        fabric,
        oas,
        exclude: [
          {
            type: 'operationId',
            pattern: 'listPets',
          },
        ],
        include: undefined,
        pluginManager: undefined as unknown as PluginManager,
        plugin: {} as Plugin,
        contentType: undefined,
        override: undefined,
        mode: 'split',
      },
    )

    const operations = await og.getOperations()

    expect(operations.map((op) => ({ path: op.path, method: op.method }))).toMatchSnapshot()
  })

  test('if exclude is filtered out for path', async () => {
    const fabric = createReactFabric()

    const og = new OperationGenerator(
      {},
      {
        fabric,
        oas,
        exclude: [
          {
            type: 'path',
            pattern: '/pets/{petId}',
          },
        ],
        include: undefined,
        pluginManager: undefined as unknown as PluginManager,
        plugin: {} as Plugin,
        contentType: undefined,
        override: undefined,
        mode: 'split',
      },
    )

    const operations = await og.getOperations()

    expect(operations.map((op) => ({ path: op.path, method: op.method }))).toMatchSnapshot()
  })

  test('if exclude is filtered out for method', async () => {
    const fabric = createReactFabric()

    const og = new OperationGenerator(
      {},
      {
        fabric,
        oas,
        exclude: [
          {
            type: 'method',
            pattern: 'get',
          },
        ],
        include: undefined,
        pluginManager: undefined as unknown as PluginManager,
        plugin: {} as Plugin,
        contentType: undefined,
        override: undefined,
        mode: 'split',
      },
    )

    const operations = await og.getOperations()

    expect(operations.map((op) => ({ path: op.path, method: op.method }))).toMatchSnapshot()
  })

  test('if exclude is filtered out for path and operationId', async () => {
    const fabric = createReactFabric()

    const og = new OperationGenerator(
      {},
      {
        fabric,
        oas,
        exclude: [
          {
            type: 'path',
            pattern: '/pets/{petId}',
          },
          {
            type: 'operationId',
            pattern: 'listPets',
          },
        ],
        include: undefined,
        pluginManager: undefined as unknown as PluginManager,
        plugin: {} as Plugin,
        contentType: undefined,
        override: undefined,
        mode: 'split',
      },
    )

    const operations = await og.getOperations()

    expect(operations.map((op) => ({ path: op.path, method: op.method }))).toMatchSnapshot()
  })
})

describe('OperationGenerator include', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: path.join(__dirname, '../mocks/petStore.yaml') },
  })

  test('if include is only selecting tag', async () => {
    const fabric = createReactFabric()

    const og = new OperationGenerator(
      {},
      {
        fabric,
        oas,
        include: [
          {
            type: 'tag',
            pattern: 'pets',
          },
        ],
        exclude: undefined,
        pluginManager: undefined as unknown as PluginManager,
        plugin: {} as Plugin,
        contentType: undefined,
        override: undefined,
        mode: 'split',
      },
    )

    const operations = await og.getOperations()

    expect(operations.map((op) => ({ path: op.path, method: op.method }))).toMatchSnapshot()
  })

  test('if include is only selecting for operationId', async () => {
    const fabric = createReactFabric()

    const og = new OperationGenerator(
      {},
      {
        fabric,
        oas,
        include: [
          {
            type: 'operationId',
            pattern: 'listPets',
          },
        ],
        exclude: undefined,
        pluginManager: undefined as unknown as PluginManager,
        plugin: {} as Plugin,
        contentType: undefined,
        override: undefined,
        mode: 'split',
      },
    )

    const operations = await og.getOperations()

    expect(operations.map((op) => ({ path: op.path, method: op.method }))).toMatchSnapshot()
  })

  test('if include is only selecting for path', async () => {
    const fabric = createReactFabric()

    const og = new OperationGenerator(
      {},
      {
        fabric,
        oas,
        include: [
          {
            type: 'path',
            pattern: '/pets/{petId}',
          },
        ],
        exclude: undefined,
        pluginManager: undefined as unknown as PluginManager,
        plugin: {} as Plugin,
        contentType: undefined,
        override: undefined,
        mode: 'split',
      },
    )

    const operations = await og.getOperations()

    expect(operations.map((op) => ({ path: op.path, method: op.method }))).toMatchSnapshot()
  })

  test('if include is only selecting for method', async () => {
    const fabric = createReactFabric()

    const og = new OperationGenerator(
      {},
      {
        fabric,
        oas,
        include: [
          {
            type: 'method',
            pattern: 'get',
          },
        ],
        exclude: undefined,
        pluginManager: undefined as unknown as PluginManager,
        plugin: {} as Plugin,
        contentType: undefined,
        override: undefined,
        mode: 'split',
      },
    )

    const operations = await og.getOperations()

    expect(operations.map((op) => ({ path: op.path, method: op.method }))).toMatchSnapshot()
  })

  test('if include is only selecting path and operationId', async () => {
    const fabric = createReactFabric()

    const og = new OperationGenerator(
      {},
      {
        fabric,
        oas,
        include: [
          {
            type: 'path',
            pattern: '/pets/{petId}',
          },
          {
            type: 'operationId',
            pattern: 'listPets',
          },
        ],
        exclude: undefined,
        pluginManager: undefined as unknown as PluginManager,
        plugin: {} as Plugin,
        contentType: undefined,
        override: undefined,
        mode: 'split',
      },
    )

    const operations = await og.getOperations()

    expect(operations.map((op) => ({ path: op.path, method: op.method }))).toMatchSnapshot()
  })
})

describe('OperationGenerator include and exclude', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: path.join(__dirname, '../mocks/petStore.yaml') },
  })

  test('if include is only selecting path and exclude is removing the GET calls', async () => {
    const fabric = createReactFabric()

    const og = new OperationGenerator(
      {},
      {
        fabric,
        oas,
        include: [
          {
            type: 'path',
            pattern: /pets$/,
          },
        ],
        exclude: [
          {
            type: 'method',
            pattern: 'post',
          },
        ],
        pluginManager: undefined as unknown as PluginManager,
        plugin: {} as Plugin,
        contentType: undefined,
        override: undefined,
        mode: 'split',
      },
    )

    const operations = await og.getOperations()

    expect(operations.map((op) => ({ path: op.path, method: op.method }))).toMatchSnapshot()
  })
})
