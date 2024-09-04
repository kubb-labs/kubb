import { matchFiles, mockedPluginManager } from '@kubb/core/mocks'

import type { Plugin } from '@kubb/core'
import { OperationGenerator } from '@kubb/plugin-oas'
import { parseFromConfig } from '@kubb/plugin-oas/utils'

import { mockGenerator } from '../generators/mockGenerator.tsx'
import type { PluginMsw } from '../types.ts'

describe('<Mock/>', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/plugin-msw/mocks/petStore.yaml' },
  })

  const options: PluginMsw['resolvedOptions'] = {
    dataReturnType: 'data',
    pathParamsType: 'object',
    baseURL: '',
  }
  const plugin = { options } as Plugin<PluginMsw>
  const og = new OperationGenerator<PluginMsw>(options as any, {
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
    const operation = oas.operation('/pets/{petId}', 'get')
    const files = await mockGenerator.operation?.({
      operation,
      options,
      instance: og,
    })

    await matchFiles(files)
  })

  test('pets', async () => {
    const operation = oas.operation('/pets', 'post')
    const files = await mockGenerator.operation?.({
      operation,
      options,
      instance: og,
    })

    await matchFiles(files)
  })
})
