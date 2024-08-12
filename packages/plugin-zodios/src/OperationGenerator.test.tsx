import { matchFiles, mockedPluginManager } from '@kubb/core/mocks'

import { OperationGenerator } from './OperationGenerator.tsx'

import type { Plugin } from '@kubb/core'
import type { GetOperationGeneratorOptions } from '@kubb/plugin-oas'
import { parseFromConfig } from '@kubb/plugin-oas/utils'
import type { PluginZodios } from './types.ts'

import type * as KubbFile from '@kubb/fs/types'

describe('OperationGenerator', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: {
      path: 'test',
      clean: true,
    },
    input: { path: 'packages/plugin-zodios/mocks/petStore.yaml' },
  })

  test('includes an alias property when includeOperationIdAsAlias is true', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      baseURL: '',
      parsers: ['definitions'],
      includeOperationIdAsAlias: true,
      name: 'example',
      extName: undefined,
    }
    const plugin = { options } as Plugin<PluginZodios>

    const og = new OperationGenerator(options, {
      oas,
      exclude: [],
      include: [{ type: 'operationId', pattern: 'listPets' }],
      pluginManager: mockedPluginManager,
      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    await og.build()

    const operation = oas.operation('/pets', 'get')

    const files = (await og.all([operation], og.operationsByMethod)) as KubbFile.File[]

    await matchFiles(files)
  })

  test('does not include an alias property when includeOperationIdAsAlias is false', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      baseURL: '',
      parsers: ['definitions'],
      includeOperationIdAsAlias: false,
      name: 'example',
      extName: undefined,
    }
    const plugin = { options } as Plugin<PluginZodios>

    const og = new OperationGenerator(options, {
      oas,
      exclude: [],
      include: [{ type: 'operationId', pattern: 'listPets' }],
      pluginManager: mockedPluginManager,
      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    await og.build()

    const operation = oas.operation('/pets', 'get')
    const files = (await og.all([operation], og.operationsByMethod)) as KubbFile.File[]

    await matchFiles(files)
  })
})
