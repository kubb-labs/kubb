import { FileManager } from '@kubb/core'
import { mockedPluginManager } from '@kubb/core/mocks'
import { OasManager } from '@kubb/swagger'

import CustomClientTemplate from '../mocks/CustomClientTemplate.tsx'
import { Client } from './components/Client.tsx'
import { Operations } from './components/Operations.tsx'
import { OperationGenerator } from './OperationGenerator.tsx'

import type { KubbFile } from '@kubb/core'
import type { Plugin } from '@kubb/core'
import type { GetOperationGeneratorOptions } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

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

    const og = await new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: { options } as Plugin<PluginOptions>,
      contentType: undefined,
      override: undefined,
    })
    const operation = oas.operation('/pets/{pet_id}', 'get')
    const files = (await og.operation(operation, options)) as KubbFile.File[]

    files.forEach((file) => {
      expect(FileManager.getSource(file)).toMatchSnapshot()
    })
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

    const og = await new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: { options } as Plugin<PluginOptions>,
      contentType: undefined,
      override: undefined,
    })
    const operation = oas.operation('/pets/{pet_id}', 'get')
    const files = (await og.operation(operation, options)) as KubbFile.File[]

    files.forEach((file) => {
      expect(FileManager.getSource(file)).toMatchSnapshot()
    })
  })

  test('[GET] should generate with templates', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dataReturnType: 'data',
      pathParamsType: 'object',
      templates: {
        operations: Operations.templates,
        client: {
          default: CustomClientTemplate,
          root: Client.templates.root,
        },
      },
      client: {
        importPath: '@kubb/swagger-client/client',
      },
    }

    const og = await new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin: { options } as Plugin<PluginOptions>,
      contentType: undefined,
      override: undefined,
    })
    const operation = oas.operation('/pets/{pet_id}', 'get')
    const files = (await og.operation(operation, options)) as KubbFile.File[]

    files.forEach((file) => {
      expect(FileManager.getSource(file)).toMatchSnapshot()
    })
  })
})
