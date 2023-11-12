import { OasManager } from '@kubb/swagger'

import { format } from '../mocks/format.ts'
import { OperationGenerator } from './OperationGenerator.tsx'

import type { KubbPlugin, PluginContext, PluginManager } from '@kubb/core'
import type { GetOperationGeneratorOptions } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

describe('OperationGenerator', () => {
  const resolvePath = () => './pets.ts'
  const resolveName: PluginContext['resolveName'] = ({ name }) => name

  test('[GET] should generate code based on a pathParamsType `inline`', async () => {
    const config = {
      root: './',
      output: { path: 'test', clean: true },
      input: { path: 'packages/swagger-client/mocks/petStore.yaml' },
    }
    const oas = await OasManager.parseFromConfig(config)

    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dataReturnType: 'data',
      pathParamsType: 'inline',
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        exclude: [],
        include: undefined,
        pluginManager: { resolvePath, resolveName, config } as unknown as PluginManager,
        plugin: { options } as KubbPlugin<PluginOptions>,
        contentType: undefined,
      },
    )
    const operation = oas.operation('/pets/{pet_id}', 'get')

    const files = await og.get(operation, og.getSchemas(operation), options)

    if (files && Array.isArray(files)) {
      expect(await format(files[0]?.source)).toMatchSnapshot()
    }
  })

  test('[GET] should generate code based on a pathParamsType `object`', async () => {
    const config = {
      root: './',
      output: { path: 'test', clean: true },
      input: { path: 'packages/swagger-client/mocks/petStore.yaml' },
    }
    const oas = await OasManager.parseFromConfig(config)

    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dataReturnType: 'data',
      pathParamsType: 'object',
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        exclude: [],
        include: undefined,
        pluginManager: { resolvePath, resolveName, config } as unknown as PluginManager,
        plugin: { options } as KubbPlugin<PluginOptions>,
        contentType: undefined,
      },
    )
    const operation = oas.operation('/pets/{pet_id}', 'get')

    const files = await og.get(operation, og.getSchemas(operation), options)

    if (files && Array.isArray(files)) {
      expect(await format(files[0]?.source)).toMatchSnapshot()
    }
  })
})
