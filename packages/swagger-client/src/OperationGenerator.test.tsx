import { OasManager } from '@kubb/swagger'

import CustomClientTemplate from '../mocks/CustomClientTemplate.tsx'
import { Client } from './components/Client.tsx'
import { Operations } from './components/Operations.tsx'
import { OperationGenerator } from './OperationGenerator.tsx'

import type { KubbPlugin, PluginManager } from '@kubb/core'
import type { GetOperationGeneratorOptions } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

const mockedPluginManager = { resolveName: ({ name }) => name, resolvePath: ({ baseName }) => baseName } as PluginManager

describe('OperationGenerator', async () => {
  const oas = await OasManager.parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/swagger-client/mocks/petStore.yaml' },
  })

  test('[GET] should generate with pathParamsType `inline`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dataReturnType: 'data',
      pathParamsType: 'inline',
      templates: {
        operations: Operations.templates,
        client: Client.templates,
      },
      client: {
        importPath: '@kubb/swagger-client/client',
      },
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        exclude: [],
        include: undefined,
        pluginManager: mockedPluginManager,
        plugin: { options } as KubbPlugin<PluginOptions>,
        contentType: undefined,
        override: undefined,
      },
    )
    const operation = oas.operation('/pets/{pet_id}', 'get')
    const files = await og.get(operation, og.getSchemas(operation), options)

    expect(files).toMatchSnapshot()
  })

  test('[GET] should generate with pathParamsType `object`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dataReturnType: 'data',
      pathParamsType: 'object',
      templates: {
        operations: Operations.templates,
        client: Client.templates,
      },
      client: {
        importPath: '@kubb/swagger-client/client',
      },
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        exclude: [],
        include: undefined,
        pluginManager: mockedPluginManager,
        plugin: { options } as KubbPlugin<PluginOptions>,
        contentType: undefined,
        override: undefined,
      },
    )
    const operation = oas.operation('/pets/{pet_id}', 'get')
    const files = await og.get(operation, og.getSchemas(operation), options)

    expect(files).toMatchSnapshot()
  })

  test('[GET] should generate with templates', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dataReturnType: 'data',
      pathParamsType: 'object',
      templates: {
        operations: Operations.templates,
        client: {
          default: CustomClientTemplate,
        },
      },
      client: {
        importPath: '@kubb/swagger-client/client',
      },
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        exclude: [],
        include: undefined,
        pluginManager: mockedPluginManager,
        plugin: { options } as KubbPlugin<PluginOptions>,
        contentType: undefined,
        override: undefined,
      },
    )
    const operation = oas.operation('/pets/{pet_id}', 'get')
    const files = await og.get(operation, og.getSchemas(operation), options)

    expect(files).toMatchSnapshot()
  })
})
