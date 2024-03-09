import { mockedPluginManager } from '@kubb/core/mocks'
import { createRootServer } from '@kubb/react/server'
import { OasManager } from '@kubb/swagger'

import { OperationGenerator } from '../OperationGenerator.tsx'
import { Client } from './Client.tsx'

import type { Plugin } from '@kubb/core'
import type { AppContextProps } from '@kubb/react'
import type { GetOperationGeneratorOptions } from '@kubb/swagger'
import type { PluginOptions } from '../types.ts'
import { Oas } from '@kubb/swagger/components'

describe('<Client/>', async () => {
  const oas = await OasManager.parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/swagger-client/mocks/petStore.yaml' },
  })

  const options: GetOperationGeneratorOptions<OperationGenerator> = {
    dataReturnType: 'data',
    pathParamsType: 'object',
    templates: {
      client: Client.templates,
    },
    client: {
      importPath: '@kubb/swagger-client/client',
    },
  }
  const plugin = { options } as Plugin<PluginOptions>
  const og = await new OperationGenerator(
    options,
    {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin,
      contentType: undefined,
      override: undefined,
    },
  )

  test('showPetById', async () => {
    const operation = oas.operation('/pets/{pet_id}', 'get')
    const schemas = og.getSchemas(operation)
    const context: AppContextProps<PluginOptions['appMeta']> = { meta: { pluginManager: mockedPluginManager, plugin } }

    const Component = () => {
      return (
        <Oas oas={oas}>
          <Oas.Operation schemas={schemas} operation={operation}>
            <Client.File />
          </Oas.Operation>
        </Oas>
      )
    }

    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />, context)

    expect(output).toMatchFileSnapshot('./__snapshots__/Client/showPetById.ts')
  })
})
