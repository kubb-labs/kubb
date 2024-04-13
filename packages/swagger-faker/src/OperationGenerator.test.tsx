import { FileManager } from '@kubb/core'
import { mockedPluginManager } from '@kubb/core/mocks'
import { OasManager } from '@kubb/swagger'

import { OperationGenerator } from './OperationGenerator.tsx'

import type { KubbFile } from '@kubb/core'
import type { Plugin } from '@kubb/core'
import type { GetOperationGeneratorOptions } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

describe('OperationGenerator', async () => {
  const oas = await OasManager.parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/swagger-faker/mocks/petStore.yaml' },
  })
  test('[GET] should generate', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dateType: 'date',
      seed: undefined,
      transformers: {},
      unknownType: 'any',
      mapper: {},
      override: [],
    }

    const og = await new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    const operation = oas.operation('/pets', 'get')
    const operationShowById = oas.operation('/pets/{petId}', 'get')

    const files = (await og.operation(operation, options)) as KubbFile.File[]
    const getShowByIdFiles = (await og.operation(operationShowById, options)) as KubbFile.File[]

    files.forEach((file) => {
      expect(FileManager.getSource(file)).toMatchSnapshot()
    })

    getShowByIdFiles.forEach((file) => {
      expect(FileManager.getSource(file)).toMatchSnapshot()
    })
  })

  test('[GET] should generate with seed `[222]`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dateType: 'date',
      seed: [222],
      transformers: {},
      unknownType: 'any',
      mapper: {},
      override: [],
    }

    const og = await new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    const operation = oas.operation('/pets', 'get')
    const operationShowById = oas.operation('/pets/{petId}', 'get')

    const files = (await og.operation(operation, options)) as KubbFile.File[]
    const getShowByIdFiles = (await og.operation(operationShowById, options)) as KubbFile.File[]

    files.forEach((file) => {
      expect(FileManager.getSource(file)).toMatchSnapshot()
    })

    getShowByIdFiles.forEach((file) => {
      expect(FileManager.getSource(file)).toMatchSnapshot()
    })
  })

  test('[POST] should generate', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dateType: 'date',
      seed: undefined,
      transformers: {},
      unknownType: 'any',
      mapper: {},
      override: [],
    }

    const og = await new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    const operation = oas.operation('/pets', 'post')
    const files = (await og.operation(operation, options)) as KubbFile.File[]

    files.forEach((file) => {
      expect(FileManager.getSource(file)).toMatchSnapshot()
    })
  })

  test('[DELETE] should generate with unknownType `any`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dateType: 'date',
      seed: undefined,
      transformers: {},
      unknownType: 'any',
      mapper: {},
      override: [],
    }

    const og = await new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })
    const operation = oas.operation('/pet/{petId}', 'delete')
    const files = (await og.operation(operation, options)) as KubbFile.File[]

    files.forEach((file) => {
      expect(FileManager.getSource(file)).toMatchSnapshot()
    })
  })
})
