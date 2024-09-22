import { OperationGenerator } from './OperationGenerator.ts'
import { parseFromConfig } from './utils/parseFromConfig.ts'

import type { FileMetaBase, PluginManager } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'

import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { Operation } from '@kubb/oas'
import type { OperationMethodResult } from './OperationGenerator.ts'
import type { Resolver } from './types.ts'

class DummyOperationGenerator extends OperationGenerator {
  operation(): OperationMethodResult<FileMetaBase> {
    return Promise.resolve(null)
  }
  resolve(_operation: Operation): Resolver {
    return {
      baseName: 'baseName.ts',
      path: 'models/baseName/ts/baseName.ts',
      name: 'baseName',
    }
  }

  all(): Promise<KubbFile.File | null> {
    return Promise.resolve(null)
  }

  get(operation: Operation): Promise<KubbFile.File | null> {
    return new Promise((resolve) => {
      const baseName: `${string}.ts` = `${operation.getOperationId()}.ts`
      resolve({ baseName, path: baseName, source: '' })
    })
  }

  post(operation: Operation): Promise<KubbFile.File | null> {
    return new Promise((resolve) => {
      const baseName: `${string}.ts` = `${operation.getOperationId()}.ts`
      resolve({ baseName, path: baseName, source: '' })
    })
  }
  patch(_operation: Operation): Promise<KubbFile.File | null> {
    return new Promise((resolve) => {
      resolve(null)
    })
  }

  put(_operation: Operation): Promise<KubbFile.File | null> {
    return new Promise((resolve) => {
      resolve(null)
    })
  }

  delete(_operation: Operation): Promise<KubbFile.File | null> {
    return new Promise((resolve) => {
      resolve(null)
    })
  }
}

describe('OperationGenerator core', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: path.join(__dirname, '../mocks/petStore.yaml') },
  })

  test('if pathParams return undefined when there are no params in path', async () => {
    const og = new DummyOperationGenerator(
      {},
      {
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
    const og = new DummyOperationGenerator(
      {},
      {
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

    const files = await og.build()

    expect(files).toMatchSnapshot()
  })

  test('if exclude is filtered out for operationId', async () => {
    const og = new DummyOperationGenerator(
      {},
      {
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

    const files = await og.build()

    expect(files).toMatchSnapshot()
  })

  test('if exclude is filtered out for path', async () => {
    const og = new DummyOperationGenerator(
      {},
      {
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

    const files = await og.build()

    expect(files).toMatchSnapshot()
  })

  test('if exclude is filtered out for method', async () => {
    const og = new DummyOperationGenerator(
      {},
      {
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

    const files = await og.build()

    expect(files).toMatchSnapshot()
  })

  test('if exclude is filtered out for path and operationId', async () => {
    const og = new DummyOperationGenerator(
      {},
      {
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

    const files = await og.build()

    expect(files).toMatchSnapshot()
  })
})

describe('OperationGenerator include', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: path.join(__dirname, '../mocks/petStore.yaml') },
  })

  test('if include is only selecting tag', async () => {
    const og = new DummyOperationGenerator(
      {},
      {
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

    const files = await og.build()

    expect(files).toMatchSnapshot()
  })

  test('if include is only selecting for operationId', async () => {
    const og = new DummyOperationGenerator(
      {},
      {
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

    const files = await og.build()

    expect(files).toMatchSnapshot()
  })

  test('if include is only selecting for path', async () => {
    const og = new DummyOperationGenerator(
      {},
      {
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

    const files = await og.build()

    expect(files).toMatchSnapshot()
  })

  test('if include is only selecting for method', async () => {
    const og = new DummyOperationGenerator(
      {},
      {
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

    const files = await og.build()

    expect(files).toMatchSnapshot()
  })

  test('if include is only selecting path and operationId', async () => {
    const og = new DummyOperationGenerator(
      {},
      {
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

    const files = await og.build()

    expect(files).toMatchSnapshot()
  })
})

describe('OperationGenerator include and exclude', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: path.join(__dirname, '../mocks/petStore.yaml') },
  })

  test('if include is only selecting path and exclude is removing the GET calls', async () => {
    const og = new DummyOperationGenerator(
      {},
      {
        oas,
        include: [
          {
            type: 'path',
            pattern: /\pets$/,
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

    const files = await og.build()

    expect(files).toMatchSnapshot()
  })
})
