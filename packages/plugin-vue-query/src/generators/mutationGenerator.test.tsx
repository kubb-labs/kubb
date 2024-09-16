import { createMockedPluginManager, matchFiles } from '@kubb/core/mocks'

import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas/parser'
import { OperationGenerator } from '@kubb/plugin-oas'
import type { PluginVueQuery } from '../types.ts'
import { mutationGenerator } from './mutationGenerator.tsx'

describe('mutationGenerator operation', async () => {
  const testData = [
    {
      name: 'getAsMutation',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        mutation: {
          importPath: 'custom-swr/mutation',
          methods: ['get'],
        },
      },
    },
    {
      name: 'clientPostImportPath',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{petId}',
      method: 'post',
      options: {
        client: {
          dataReturnType: 'data',
          importPath: 'axios',
        },
      },
    },
    {
      name: 'updatePetById',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{petId}',
      method: 'post',
      options: {},
    },
    {
      name: 'updatePetByIdPathParamsObject',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{petId}',
      method: 'post',
      options: {
        pathParamsType: 'object',
      },
    },
    {
      name: 'deletePet',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{petId}',
      method: 'delete',
      options: {},
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginVueQuery['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginVueQuery['resolvedOptions'] = {
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
      infinite: false,
      output: {
        path: '.',
      },
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginVueQuery>
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
    await instance.build(mutationGenerator)

    const operation = oas.operation(props.path, props.method)
    const files = await mutationGenerator.operation?.({
      operation,
      options,
      instance,
    })

    await matchFiles(files)
  })
})
