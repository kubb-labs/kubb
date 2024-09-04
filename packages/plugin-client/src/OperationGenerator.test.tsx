import { matchFiles, mockedPluginManager } from '@kubb/core/mocks'

import type { Plugin } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'
import type { GetOperationGeneratorOptions } from '@kubb/plugin-oas'
import { OperationGenerator } from '@kubb/plugin-oas'

import { parseFromConfig } from '@kubb/plugin-oas/utils'
import type { PluginClient } from './types.ts'

describe('OperationGenerator', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/plugin-client/mocks/petStore.yaml' },
  })

  test('[GET] should generate with pathParamsType `inline`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dataReturnType: 'data',
      pathParamsType: 'inline',
      importPath: '@kubb/plugin-client/client',
      baseURL: '',
      extName: undefined,
    }

    const og = new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: { options } as Plugin<PluginClient>,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    const operation = oas.operation('/pets/{pet_id}', 'get')
    const files = (await og.operation(operation, options)) as KubbFile.File[]

    await matchFiles(files)
  })

  test('[GET] should generate with pathParamsType `object`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dataReturnType: 'data',
      pathParamsType: 'object',
      importPath: '@kubb/plugin-client/client',
      baseURL: '',
      extName: undefined,
    }

    const og = new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: { options } as Plugin<PluginClient>,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    const operation = oas.operation('/pets/{pet_id}', 'get')
    const files = (await og.operation(operation, options)) as KubbFile.File[]

    await matchFiles(files)
  })

  test('[GET] should generate with templates', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dataReturnType: 'data',
      pathParamsType: 'object',
      importPath: '@kubb/plugin-client/client',
      baseURL: '',
      extName: undefined,
    }

    const og = new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: { options } as Plugin<PluginClient>,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    const operation = oas.operation('/pets/{pet_id}', 'get')
    const files = (await og.operation(operation, options)) as KubbFile.File[]

    await matchFiles(files)
  })
})
