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
import type { PluginTanstackQuery } from './types.ts'

describe('OperationGenerator', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/swagger-tanstack-query/mocks/petStore.yaml' },
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
        framework: 'react',
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
          importPath: '@kubb/swagger-client/client',
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
        extName: undefined
      },
      method: 'get',
      operation: oas.operation('/pet/{petId}', 'get'),
    },
    {
      name: 'pathParamsTypeObject',
      options: {
        framework: 'react',
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
          importPath: '@kubb/swagger-client/client',
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
        extName: undefined
      },
      method: 'get',
      operation: oas.operation('/pet/{petId}', 'get'),
    },
    {
      name: 'queryOptions',
      options: {
        framework: 'react',
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
          importPath: '@kubb/swagger-client/client',
        },
        parser: undefined,
        query: false,
        queryOptions: {
          methods: ['get'],
        },
        mutate: false,
        extName: undefined
      },
      method: 'get',
      operation: oas.operation('/pet/{petId}', 'get'),
    },
    {
      name: 'queryWithoutQueryOptions',
      options: {
        framework: 'react',
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
          importPath: '@kubb/swagger-client/client',
        },
        parser: undefined,
        query: {
          methods: ['get'],
          queryKey: (key: unknown[]) => key,
        },
        queryOptions: false,
        mutate: false,
        extName: undefined
      },
      method: 'get',
      operation: oas.operation('/pet/{petId}', 'get'),
    },
    {
      name: 'variablesTypeMutate',
      options: {
        framework: 'react',
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
          importPath: '@kubb/swagger-client/client',
        },
        parser: undefined,
        query: false,
        queryOptions: false,
        mutate: {
          variablesType: 'mutate',
          methods: ['delete'],
        },
        extName: undefined
      },
      method: 'delete',
      operation: oas.operation('/pet/{petId}', 'delete'),
    },
    {
      name: 'mutateAsQuery',
      options: {
        framework: 'react',
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
          importPath: '@kubb/swagger-client/client',
        },
        parser: undefined,
        query: {
          methods: ['post'],
          queryKey: (key: unknown[]) => key,
        },
        queryOptions: {},
        mutate: false,
        extName: undefined
      },
      method: 'post',
      operation: oas.operation('/pet/{petId}', 'post'),
    },
    {
      name: 'upload',
      options: {
        framework: 'react',
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
          importPath: '@kubb/swagger-client/client',
        },
        parser: undefined,
        query: {
          methods: ['post'],
          queryKey: (key: unknown[]) => key,
        },
        queryOptions: {},
        mutate: false,
        extName: undefined
      },
      method: 'post',
      operation: oas.operation('/upload', 'post'),
    },
    {
      name: 'uploadMutation',
      options: {
        framework: 'react',
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
          importPath: '@kubb/swagger-client/client',
        },
        parser: undefined,
        mutate: {
          methods: ['post'],
          variablesType: 'mutate',
        },
        extName: undefined,
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
      plugin: { options } as Plugin<PluginTanstackQuery>,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })

    const files = (await og.operation(operation, options)) as KubbFile.File[]

    for (const file of files) {
      const source = await FileManager.getSource(file)

      expect(source).toMatchFileSnapshot(`./__snapshots__/${name}/${file.baseName}`)
    }
  })
})
