import { matchFiles, mockedPluginManager } from '@kubb/core/mocks'

import type { Plugin } from '@kubb/core'
import { OperationGenerator } from '@kubb/plugin-oas'
import { parseFromConfig } from '@kubb/plugin-oas/utils'
import { axiosGenerator } from '../generators/axiosGenerator.tsx'
import type { PluginClient } from '../types.ts'
import { Operations } from './Operations.tsx'

describe('<Operations/>', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/plugin-client/mocks/petStore.yaml' },
  })

  const options: PluginClient['resolvedOptions'] = {
    dataReturnType: 'data',
    pathParamsType: 'object',
    templates: {
      operations: Operations,
    },
    client: {
      importPath: '@kubb/plugin-client/client',
      methods: ['get', 'post', 'put'],
    },
    baseURL: '',
    extName: undefined,
  }
  const plugin = { options } as Plugin<PluginClient>
  const og = new OperationGenerator<PluginClient>(options as any, {
    oas,
    exclude: [],
    include: undefined,
    pluginManager: mockedPluginManager,
    plugin,
    contentType: undefined,
    override: undefined,
    mode: 'split',
  })

  test('showPetById', async () => {
    const operation = oas.operation('/pets/{pet_id}', 'get')

    const files = await axiosGenerator.operations?.({
      operations: [operation],
      operationsByMethod: {},
      options,
      instance: og,
    })

    await matchFiles(files)
  })
})
