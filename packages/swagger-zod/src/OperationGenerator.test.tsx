import { matchFiles, mockedPluginManager } from '@kubb/core/mocks'

import { OperationGenerator } from './OperationGenerator.tsx'

import type { Plugin } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'
import type { GetOperationGeneratorOptions } from '@kubb/plugin-oas'
import { parseFromConfig } from '@kubb/plugin-oas/utils'
import { Operations } from './components/Operations.tsx'
import type { PluginZod } from './types.ts'

describe('OperationGenerator', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/swagger-zod/mocks/petStore.yaml' },
  })
  test('[GET] should generate', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dateType: 'date',
      transformers: {},
      typed: false,
      exclude: undefined,
      include: undefined,
      override: undefined,
      unknownType: 'any',
      templates: {
        operations: Operations.templates,
      },
      mapper: {},
    }

    const og = await new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginZod>,
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

  test('[POST] should generate', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dateType: 'date',
      transformers: {},
      typed: false,
      exclude: undefined,
      include: undefined,
      override: undefined,
      unknownType: 'any',
      templates: {
        operations: Operations.templates,
      },
      mapper: {},
    }

    const og = await new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginZod>,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    const operation = oas.operation('/pets', 'post')
    const files = (await og.operation(operation, options)) as KubbFile.File[]

    await matchFiles(files)
  })

  test('[DELETE] should generate with unknownType `any`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dateType: 'date',
      transformers: {},
      typed: false,
      exclude: undefined,
      include: undefined,
      override: undefined,
      unknownType: 'any',
      templates: {
        operations: Operations.templates,
      },
      mapper: {},
    }

    const og = await new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginZod>,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    const operation = oas.operation('/pet/{petId}', 'delete')
    const files = (await og.operation(operation, options)) as KubbFile.File[]

    await matchFiles(files)
  })

  test('[DELETE] should generate with unknownType `unknown`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dateType: 'date',
      transformers: {},
      typed: false,
      exclude: undefined,
      include: undefined,
      override: undefined,
      unknownType: 'unknown',
      templates: {
        operations: Operations.templates,
      },
      mapper: {},
    }

    const og = await new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginZod>,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    const operation = oas.operation('/pet/{petId}', 'delete')
    const files = await og.operation(operation, options)

    expect(files).toMatchSnapshot()
  })
})
