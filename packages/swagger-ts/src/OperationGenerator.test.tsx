import { matchFiles, mockedPluginManager } from '@kubb/core/mocks'

import { OperationGenerator } from './OperationGenerator.tsx'

import type { Plugin } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'
import type { GetOperationGeneratorOptions } from '@kubb/plugin-oas'
import { parseFromConfig } from '@kubb/plugin-oas/utils'
import type { PluginTs } from './types.ts'

describe('OperationGenerator', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/swagger-ts/mocks/petStore.yaml' },
  })
  test('[GET] /pets with optionalType `questionToken`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      usedEnumNames: {},
      transformers: {},
      oasType: false,
      unknownType: 'any',
      override: [],
    }

    const og = new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginTs>,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    const operation = oas.operation('/pets', 'get')
    const operationShowById = oas.operation('/pets/{petId}', 'get')

    const files = (await og.operation(operation, options)) as KubbFile.File[]
    const getShowByIdFiles = (await og.operation(operationShowById, options)) as KubbFile.File[]

    await matchFiles(files)
    await matchFiles(getShowByIdFiles)
  })

  test('[POST] /pets 201', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      usedEnumNames: {},
      transformers: {},
      oasType: false,
      unknownType: 'any',
      override: [],
    }

    const og = await new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginTs>,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    const operation = oas.operation('/pets', 'post')
    const files = (await og.operation(operation, options)) as KubbFile.File[]

    await matchFiles(files)
  })

  test('[DELETE] /pet/{petId} with unknownType `any`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      usedEnumNames: {},
      transformers: {},
      oasType: false,
      unknownType: 'any',
      override: [],
    }

    const og = await new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginTs>,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    const operation = oas.operation('/pet/{petId}', 'delete')
    const files = (await og.operation(operation, options)) as KubbFile.File[]

    await matchFiles(files)
  })
  test('[DELETE] /pet/{petId} with unknownType `unknown`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      usedEnumNames: {},
      transformers: {},
      oasType: false,
      unknownType: 'unknown',
      override: [],
    }

    const og = await new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginTs>,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    const operation = oas.operation('/pet/{petId}', 'delete')
    const files = (await og.operation(operation, options)) as KubbFile.File[]

    await matchFiles(files)
  })
})
