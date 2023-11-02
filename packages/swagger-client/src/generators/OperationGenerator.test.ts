import { OasManager } from '@kubb/swagger'

import { format } from '../../mocks/format.ts'
import { OperationGenerator } from './OperationGenerator.ts'

import type { KubbPlugin, PluginContext, PluginManager } from '@kubb/core'
import type { GetOperationGeneratorOptions } from '@kubb/swagger'

describe('OperationGenerator', () => {
  const resolvePath = () => './pets.ts'
  const resolveName: PluginContext['resolveName'] = ({ name }) => name

  test('[GET] should generate code based on a pathParamsType `inline`', async () => {
    const oas = await OasManager.parseFromConfig({
      root: './',
      output: { path: 'test', clean: true },
      input: { path: 'packages/swagger-client/mocks/petStore.yaml' },
    })

    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dataReturnType: 'data',
      pathParamsType: 'inline',
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        skipBy: [],
        pluginManager: { resolvePath, resolveName } as unknown as PluginManager,
        plugin: {} as KubbPlugin,
        contentType: undefined,
      },
    )
    const operation = oas.operation('/pets/{pet_id}', 'get')

    const get = await og.get(operation, og.getSchemas(operation), {} as typeof og.options)

    expect(await format(get?.source)).toMatchSnapshot()
  })

  test('[GET] should generate code based on a pathParamsType `object`', async () => {
    const oas = await OasManager.parseFromConfig({
      root: './',
      output: { path: 'test', clean: true },
      input: { path: 'packages/swagger-client/mocks/petStore.yaml' },
    })

    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dataReturnType: 'data',
      pathParamsType: 'object',
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        skipBy: [],
        pluginManager: { resolvePath, resolveName } as unknown as PluginManager,
        plugin: {} as KubbPlugin,
        contentType: undefined,
      },
    )
    const operation = oas.operation('/pets/{pet_id}', 'get')

    const get = await og.get(operation, og.getSchemas(operation), options)

    expect(await format(get?.source)).toMatchSnapshot()
  })
})
