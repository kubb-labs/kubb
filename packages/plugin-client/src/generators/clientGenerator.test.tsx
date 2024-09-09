import { createMockedPluginManager, matchFiles } from '@kubb/core/mocks'

import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas/parser'
import { OperationGenerator } from '@kubb/plugin-oas'
import type { PluginClient } from '../types.ts'
import { clientGenerator } from './clientGenerator.tsx'

describe('clientGenerator operation', async () => {
  const testData = [
    {
      name: 'findByTags',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {},
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
      name: 'findByTagsFull',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        dataReturnType: 'full',
      },
    },
    {
      name: 'findByTagsWithZodFull',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        parser: 'zod',
        dataReturnType: 'full',
      },
    },
    {
      name: 'importPath',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        importPath: 'axios',
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
      name: 'deletePet',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{petId}',
      method: 'delete',
      options: {},
    },
    {
      name: 'deletePetObject',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{petId}',
      method: 'delete',
      options: {
        pathParamsType: 'object',
      },
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginClient['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginClient['resolvedOptions'] = {
      dataReturnType: 'data',
      pathParamsType: 'inline',
      importPath: '@kubb/plugin-client/client',
      baseURL: '',
      parser: 'client',
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginClient>
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
    await instance.build(clientGenerator)

    const operation = oas.operation(props.path, props.method)
    const files = await clientGenerator.operation?.({
      operation,
      options,
      instance,
    })

    await matchFiles(files)
  })
})
