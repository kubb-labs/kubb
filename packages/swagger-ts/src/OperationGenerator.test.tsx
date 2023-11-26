import { OasManager } from '@kubb/swagger'

import { OperationGenerator } from './OperationGenerator.tsx'

import type { PluginManager } from '@kubb/core'
import type { KubbPlugin } from '@kubb/core'
import type { GetOperationGeneratorOptions } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

const mockedPluginManager = { resolveName: ({ name }) => name, resolvePath: ({ baseName }) => baseName } as PluginManager

describe('OperationGenerator', async () => {
  const oas = await OasManager.parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/swagger-ts/mocks/petStore.yaml' },
  })
  test('[GET] should generate with optionalType `questionToken`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      usedEnumNames: {},
      transformers: {},
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        exclude: [],
        include: undefined,
        pluginManager: mockedPluginManager,
        plugin: {} as KubbPlugin<PluginOptions>,
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
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      usedEnumNames: {},
      transformers: {},
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        exclude: [],
        include: undefined,
        pluginManager: mockedPluginManager,
        plugin: {} as KubbPlugin<PluginOptions>,
        contentType: undefined,
        override: undefined,
      },
    )
    const operation = oas.operation('/pets', 'post')
    const files = await og.post(operation, og.getSchemas(operation), options)

    expect(files).toMatchSnapshot()
  })
})
