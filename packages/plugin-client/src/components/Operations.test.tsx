import { mockedPluginManager } from '@kubb/core/mocks'
import { createRootServer } from '@kubb/react/server'
import { Oas } from '@kubb/plugin-oas/components'

import { OperationGenerator } from '../OperationGenerator.tsx'

import type { Plugin } from '@kubb/core'
import { App } from '@kubb/react'
import type { GetOperationGeneratorOptions } from '@kubb/plugin-oas'
import { parseFromConfig } from '@kubb/plugin-oas/utils'
import type { PluginClient } from '../types.ts'
import { operationsParser } from '../parsers/operationsParser.tsx'

describe('<Operations/>', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/plugin-client/mocks/petStore.yaml' },
  })

  const options: GetOperationGeneratorOptions<OperationGenerator> = {
    dataReturnType: 'data',
    pathParamsType: 'object',
    parsers: ['operations'],
    client: {
      importPath: '@kubb/plugin-client/client',
    },
    baseURL: '',
    extName: undefined,
  }
  const plugin = { options } as Plugin<PluginClient>
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
    const parser = operationsParser

    const Component = () => {
      return (
        <App plugin={plugin} pluginManager={mockedPluginManager} mode="split">
          <Oas oas={oas} operations={[operation]} generator={og}>
            <Oas.Operation operation={operation}>
              <parser.templates.Operations operationsByMethod={{}} operations={[operation]} options={options} />
            </Oas.Operation>
          </Oas>
        </App>
      )
    }

    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />)

    expect(output).toMatchFileSnapshot('./__snapshots__/Operations/showPetById.ts')
  })
})
