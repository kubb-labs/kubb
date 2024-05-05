import { mockedPluginManager } from '@kubb/core/mocks'
import { createRootServer } from '@kubb/react/server'
import { Oas } from '@kubb/swagger/components'

import { OperationGenerator } from '../OperationGenerator.tsx'
import { Client } from './Client.tsx'

import type { Plugin } from '@kubb/core'
import { App } from '@kubb/react'
import type { GetOperationGeneratorOptions } from '@kubb/swagger'
import { parseFromConfig } from '@kubb/swagger/utils'
import type { PluginOptions } from '../types.ts'

describe('<Client/>', async () => {
  const oas = await parseFromConfig({
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
  const og = await new OperationGenerator(options, {
    oas,
    exclude: [],
    include: undefined,
    pluginManager: mockedPluginManager,
    plugin,
    contentType: undefined,
    override: undefined,
    mode: 'split',
  })

  test('showPetById', async () => {
    const operation = oas.operation('/pets/{pet_id}', 'get')

    const Component = () => {
      return (
        <App plugin={plugin} pluginManager={mockedPluginManager} mode="split">
          <Oas oas={oas} operations={[operation]} generator={this}>
            <Oas.Operation operation={operation}>
              <Client.File />
            </Oas.Operation>
          </Oas>
        </App>
      )
    }

    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />)

    expect(output).toMatchFileSnapshot('./__snapshots__/Client/showPetById.ts')
  })
})
