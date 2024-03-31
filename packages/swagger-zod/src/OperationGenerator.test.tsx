import { FileManager } from '@kubb/core'
import { mockedPluginManager } from '@kubb/core/mocks'
import { OasManager } from '@kubb/swagger'

import { OperationGenerator } from './OperationGenerator.tsx'

import type { Plugin } from '@kubb/core'
import type { GetOperationGeneratorOptions } from '@kubb/swagger'
import type { KubbFile } from 'packages/core/dist/index'
import { Operations } from './components/Operations.tsx'
import type { PluginOptions } from './types.ts'
import { zodKeywordMapper } from './zodParser.tsx'

describe('OperationGenerator', async () => {
  const oas = await OasManager.parseFromConfig({
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
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      override: undefined,
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
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      override: undefined,
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
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      override: undefined,
    })
    const operation = oas.operation('/pet/{petId}', 'delete')
    const files = (await og.operation(operation, options)) as KubbFile.File[]

    files.forEach((file) => {
      expect(FileManager.getSource(file)).toMatchSnapshot()
    })
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
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      override: undefined,
    })
    const operation = oas.operation('/pet/{petId}', 'delete')
    const files = await og.operation(operation, options)

    expect(files).toMatchSnapshot()
  })
})
