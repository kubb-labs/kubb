import path from 'node:path'
import type { Plugin, PluginManager } from '@kubb/core'
import { createReactFabric } from '@kubb/react'
import { OperationGenerator } from './OperationGenerator.ts'
import { parseFromConfig } from './utils/parseFromConfig.ts'

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
