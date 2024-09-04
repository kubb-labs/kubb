import { matchFiles, mockedPluginManager } from '@kubb/core/mocks'

import type { Plugin } from '@kubb/core'
import { OperationGenerator } from '@kubb/plugin-oas'
import { parseFromConfig } from '@kubb/plugin-oas/utils'

import { clientGenerator } from '../generators/clientGenerator.tsx'
import type { PluginClient } from '../types.ts'
import { Client } from './Client.tsx'

describe('<Client/>', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/plugin-client/mocks/petStore.yaml' },
  })

  const options: PluginClient['resolvedOptions'] = {
    dataReturnType: 'data',
    pathParamsType: 'object',
    importPath: '@kubb/plugin-client/client',
    template: Client,
    baseURL: '',
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
    const files = await clientGenerator.operation?.({
      operation,
      options,
      instance: og,
    })

    await matchFiles(files)
  })
})
