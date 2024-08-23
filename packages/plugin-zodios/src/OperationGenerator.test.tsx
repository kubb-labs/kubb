import { mockedPluginManager } from '@kubb/core/mocks'

import { OperationGenerator } from './OperationGenerator.tsx'

import type { Plugin } from '@kubb/core'
import type { GetOperationGeneratorOptions } from '@kubb/plugin-oas'
import { parseFromConfig } from '@kubb/plugin-oas/utils'
import type { PluginZodios } from './types.ts'
import { Oas } from '@kubb/plugin-oas/components'
import { App } from '@kubb/react'
import { createRootServer } from '@kubb/react/server'
import { Definitions } from './components/Definitions.tsx'

describe('OperationGenerator', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: {
      path: 'test',
      clean: true,
    },
    input: { path: 'packages/plugin-zodios/mocks/petStore.yaml' },
  })

  test('includes an alias property when includeOperationIdAsAlias is true', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      baseURL: '',
      includeOperationIdAsAlias: true,
      name: 'example',
      extName: undefined,
    }
    const plugin = { options } as Plugin<PluginZodios>

    const generator = new OperationGenerator(options, {
      oas,
      exclude: [],
      include: [{ type: 'operationId', pattern: 'listPets' }],
      pluginManager: mockedPluginManager,
      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })

    // Need to build to set the operationsByMethod
    generator.build()

    const operation = oas.operation('/pets', 'get')

    const Component = () => {
      return (
        <App plugin={plugin} pluginManager={mockedPluginManager} mode="split">
          <Oas oas={oas} operations={[operation]} generator={generator}>
            <Oas.Operation operation={operation}>
              <Definitions.File operationsByMethod={generator.operationsByMethod} {...options} />
            </Oas.Operation>
          </Oas>
        </App>
      )
    }
    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />)

    expect(output).toMatchSnapshot()
  })

  test('does not include an alias property when includeOperationIdAsAlias is false', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      baseURL: '',
      includeOperationIdAsAlias: false,
      name: 'example',
      extName: undefined,
    }
    const plugin = { options } as Plugin<PluginZodios>

    const generator = new OperationGenerator(options, {
      oas,
      exclude: [],
      include: [{ type: 'operationId', pattern: 'listPets' }],
      pluginManager: mockedPluginManager,
      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
    })

    // Need to build to set the operationsByMethod
    generator.build()

    const operation = oas.operation('/pets', 'get')

    const Component = () => {
      return (
        <App plugin={plugin} pluginManager={mockedPluginManager} mode="split">
          <Oas oas={oas} operations={[operation]} generator={generator}>
            <Oas.Operation operation={operation}>
              <Definitions.File operationsByMethod={generator.operationsByMethod} {...options} />
            </Oas.Operation>
          </Oas>
        </App>
      )
    }
    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />)

    expect(output).toMatchSnapshot()
  })
})
