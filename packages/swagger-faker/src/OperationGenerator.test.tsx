import { mockedPluginManager } from '@kubb/core/mocks'
import { OasManager } from '@kubb/swagger'

import { OperationGenerator } from './OperationGenerator.tsx'

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
      mapper: {},
      seed: undefined,
      transformers: {},
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

    const files = await og.get(operation, og.getSchemas(operation), options)
    const getShowByIdFiles = await og.get(operationShowById, og.getSchemas(operationShowById), options)

    expect(files).toMatchSnapshot()
    expect(getShowByIdFiles).toMatchSnapshot()
  })

  test('[GET] should generate with seed `[222]`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dateType: 'date',
      mapper: {},
      seed: [222],
      transformers: {},
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

    const files = await og.get(operation, og.getSchemas(operation), options)
    const getShowByIdFiles = await og.get(operationShowById, og.getSchemas(operationShowById), options)

    expect(files).toMatchSnapshot()
    expect(getShowByIdFiles).toMatchSnapshot()
  })

  test('[POST] should generate', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dateType: 'date',
      mapper: {},
      seed: undefined,
      transformers: {},
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
    const files = await og.post(operation, og.getSchemas(operation), options)

    expect(files).toMatchSnapshot()
  })

  test('[DELETE] should generate with unknownType `any`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dateType: 'date',
      mapper: {},
      seed: undefined,
      transformers: {},
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
    const files = await og.post(operation, og.getSchemas(operation), options)

    expect(files).toMatchSnapshot()
  })
})
