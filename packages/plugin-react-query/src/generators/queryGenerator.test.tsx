import { createMockedPluginManager, matchFiles } from '@kubb/core/mocks'

import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas/parser'
import { OperationGenerator } from '@kubb/plugin-oas'
import type { PluginReactQuery } from '../types.ts'
import { queryGenerator } from './queryGenerator.tsx'

describe('queryGenerator operation', async () => {
  const testData = [
    {
      name: 'findByTags',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {},
    },
    {
      name: 'findByTagsPathParamsObject',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        pathParamsType: 'object',
      },
    },
    {
      name: 'findByTagsWithZod',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        parser: 'zod',
      },
    },
    {
      name: 'findByTagsWithCustomQueryKey',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        query: {
          methods: ['get'],
          importPath: '@tanstack/react-query',
          key: (key) => ['test', ...key],
        },
      },
    },
    {
      name: 'clientGetImportPath',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        client: {
          dataReturnType: 'data',
          importPath: 'axios',
        },
      },
    },
    {
      name: 'clientDataReturnTypeFull',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        client: {
          dataReturnType: 'full',
          importPath: '@kubb/plugin-client/client',
        },
      },
    },
    {
      name: 'postAsQuery',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{petId}',
      method: 'post',
      options: {
        query: {
          importPath: 'custom-query',
          methods: ['post'],
          key: (key) => key,
        },
      },
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginReactQuery['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginReactQuery['resolvedOptions'] = {
      client: {
        dataReturnType: 'data',
        importPath: '@kubb/plugin-client/client',
      },
      parser: 'zod',
      baseURL: undefined,
      pathParamsType: 'inline',
      query: {
        importPath: '@tanstack/react-query',
        key: (key) => key,
        methods: ['get'],
      },
      mutation: {
        methods: ['post'],
        importPath: '@tanstack/react-query',
      },
      suspense: false,
      infinite: false,
      output: {
        path: '.',
      },
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginReactQuery>
    const instance = new OperationGenerator(options, {
      oas,
      include: undefined,
      pluginManager: createMockedPluginManager(props.name),
      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
      exclude: [],
    })
    await instance.build(queryGenerator)

    const operation = oas.operation(props.path, props.method)
    const files = await queryGenerator.operation?.({
      operation,
      options,
      instance,
    })

    await matchFiles(files)
  })
})
