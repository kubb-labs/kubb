import { FileManager } from '@kubb/core'
import { mockedPluginManager } from '@kubb/core/mocks'

import { OperationGenerator } from './OperationGenerator.tsx'
import { Query } from './components/Query.tsx'
import { QueryKey } from './components/QueryKey.tsx'
import { QueryOptions } from './components/QueryOptions.tsx'

import type { Plugin } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'
import type { Operation } from '@kubb/oas'
import type { GetOperationGeneratorOptions } from '@kubb/plugin-oas'
import { parseFromConfig } from '@kubb/plugin-oas/utils'
import type { PluginReactQuery } from './types.ts'
import { getSource } from '@kubb/core/src/FileManager.ts'

describe('OperationGenerator', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/plugin-tanstack-query/mocks/petStore.yaml' },
  })

  // TODO generic
  type Item = {
    name: string
    method: 'get' | 'delete' | 'post'
    operation: Operation
    options: GetOperationGeneratorOptions<OperationGenerator>
  }
  const items: Array<Item> = [
    {
      name: 'pathParamsTypeInline',
      options: {
        infinite: false,
        suspense: false,
        dataReturnType: 'data',
        pathParamsType: 'inline',
        templates: {
          query: Query.templates,
          queryKey: QueryKey.templates,
          queryOptions: QueryOptions.templates,
        },
        client: {
          importPath: '@kubb/plugin-client/client',
        },
        parser: undefined,
        query: {
          methods: ['get'],
          queryKey: (key: unknown[]) => key,
        },
        queryOptions: {
          methods: ['get'],
        },
        mutate: false,
      },
      method: 'get',
      operation: oas.operation('/pet/{petId}', 'get'),
    },
    {
      name: 'pathParamsTypeObject',
      options: {
        infinite: false,
        suspense: false,
        dataReturnType: 'data',
        pathParamsType: 'object',
        templates: {
          query: Query.templates,
          queryKey: QueryKey.templates,
          queryOptions: QueryOptions.templates,
        },
        client: {
          importPath: '@kubb/plugin-client/client',
        },
        parser: undefined,
        query: {
          methods: ['get'],
          queryKey: (key: unknown[]) => key,
        },
        queryOptions: {
          methods: ['get'],
        },
        mutate: false,
      },
      method: 'get',
      operation: oas.operation('/pet/{petId}', 'get'),
    },
    {
      name: 'queryOptions',
      options: {
        infinite: false,
        suspense: false,
        dataReturnType: 'data',
        pathParamsType: 'object',
        templates: {
          query: Query.templates,
          queryKey: QueryKey.templates,
          queryOptions: QueryOptions.templates,
        },
        client: {
          importPath: '@kubb/plugin-client/client',
        },
        parser: undefined,
        query: false,
        queryOptions: {
          methods: ['get'],
        },
        mutate: false,
      },
      method: 'get',
      operation: oas.operation('/pet/{petId}', 'get'),
    },
    {
      name: 'queryWithoutQueryOptions',
      options: {
        infinite: false,
        suspense: false,
        dataReturnType: 'data',
        pathParamsType: 'object',
        templates: {
          query: Query.templates,
          queryKey: QueryKey.templates,
          queryOptions: QueryOptions.templates,
        },
        client: {
          importPath: '@kubb/plugin-client/client',
        },
        parser: undefined,
        query: {
          methods: ['get'],
          queryKey: (key: unknown[]) => key,
        },
        queryOptions: false,
        mutate: false,
      },
      method: 'get',
      operation: oas.operation('/pet/{petId}', 'get'),
    },
    {
      name: 'variablesTypeMutate',
      options: {
        infinite: false,
        suspense: false,
        dataReturnType: 'data',
        pathParamsType: 'object',
        templates: {
          query: Query.templates,
          queryKey: QueryKey.templates,
          queryOptions: QueryOptions.templates,
        },
        client: {
          importPath: '@kubb/plugin-client/client',
        },
        parser: undefined,
        query: false,
        queryOptions: false,
        mutate: {
          variablesType: 'mutate',
          methods: ['delete'],
        },
      },
      method: 'delete',
      operation: oas.operation('/pet/{petId}', 'delete'),
    },
    {
      name: 'mutateAsQuery',
      options: {
        infinite: false,
        suspense: false,
        dataReturnType: 'data',
        pathParamsType: 'object',
        templates: {
          query: Query.templates,
          queryKey: QueryKey.templates,
          queryOptions: QueryOptions.templates,
        },
        client: {
          importPath: '@kubb/plugin-client/client',
        },
        parser: undefined,
        query: {
          methods: ['post'],
          queryKey: (key: unknown[]) => key,
        },
        queryOptions: {},
        mutate: false,
      },
      method: 'post',
      operation: oas.operation('/pet/{petId}', 'post'),
    },
    {
      name: 'upload',
      options: {
        infinite: false,
        suspense: false,
        dataReturnType: 'data',
        pathParamsType: 'object',
        templates: {
          query: Query.templates,
          queryKey: QueryKey.templates,
          queryOptions: QueryOptions.templates,
        },
        client: {
          importPath: '@kubb/plugin-client/client',
        },
        parser: undefined,
        query: {
          methods: ['post'],
          queryKey: (key: unknown[]) => key,
        },
        queryOptions: {},
        mutate: false,
      },
      method: 'post',
      operation: oas.operation('/upload', 'post'),
    },
    {
      name: 'uploadMutation',
      options: {
        infinite: false,
        suspense: false,
        dataReturnType: 'data',
        pathParamsType: 'object',
        templates: {
          query: Query.templates,
          queryKey: QueryKey.templates,
          queryOptions: QueryOptions.templates,
        },
        client: {
          importPath: '@kubb/plugin-client/client',
        },
        parser: undefined,
        mutate: {
          methods: ['post'],
          variablesType: 'mutate',
        },
        queryOptions: {},
        query: false,
      },
      method: 'post',
      operation: oas.operation('/upload', 'post'),
    },
  ]

  test.each(items)('$name', async ({ name, method, options, operation }) => {
    const og = new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: { options } as Plugin<PluginReactQuery>,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })

    const files = (await og.operation(operation, options)) as KubbFile.File[]

    for (const file of files) {
      const source = await getSource(file)

      expect(source).toMatchFileSnapshot(`./__snapshots__/${name}/${file.baseName}`)
    }
  })
})
