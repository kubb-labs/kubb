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
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        exclude: [],
        include: undefined,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        contentType: undefined,
        override: undefined,
      },
    )
    const operation = oas.operation('/pets', 'get')
    const operationShowById = oas.operation('/pets/{petId}', 'get')

    const files = await og.operation(operation, options) as KubbFile.File[]
    const getShowByIdFiles = await og.operation(operationShowById, options) as KubbFile.File[]

    files.forEach(file => {
      expect(FileManager.getSource(file)).toMatchSnapshot()
    })

    getShowByIdFiles.forEach(file => {
      expect(FileManager.getSource(file)).toMatchSnapshot()
    })
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
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        exclude: [],
        include: undefined,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        contentType: undefined,
        override: undefined,
      },
    )
    const operation = oas.operation('/pets', 'post')
    const files = await og.operation(operation, options) as KubbFile.File[]

    files.forEach(file => {
      expect(FileManager.getSource(file)).toMatchSnapshot()
    })
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
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        exclude: [],
        include: undefined,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        contentType: undefined,
        override: undefined,
      },
    )
    const operation = oas.operation('/pet/{petId}', 'delete')
    const files = await og.operation(operation, options) as KubbFile.File[]

    files.forEach(file => {
      expect(FileManager.getSource(file)).toMatchSnapshot()
    })
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
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        exclude: [],
        include: undefined,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        contentType: undefined,
        override: undefined,
      },
    )
    const operation = oas.operation('/pet/{petId}', 'delete')
    const files = await og.operation(operation, options) as KubbFile.File[]

    files.forEach(file => {
      expect(FileManager.getSource(file)).toMatchSnapshot()
    })
  })
})
