import { mockedPluginManager } from '@kubb/core/mocks'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { createRootServer } from '@kubb/react/server'
import { Oas } from '@kubb/plugin-oas/components'

import { OperationGenerator } from '../OperationGenerator.tsx'

import type { Plugin, ResolveNameParams } from '@kubb/core'
import { App } from '@kubb/react'
import type { GetOperationGeneratorOptions } from '@kubb/plugin-oas'
import { parseFromConfig } from '@kubb/plugin-oas/utils'
import type { PluginSwr } from '../types.ts'
import { mutationParser } from '../parsers'

describe('<Mutation/>', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/plugin-swr/mocks/petStore.yaml' },
  })
  mockedPluginManager.resolveName = ({ type, name }: ResolveNameParams) => {
    if (type === 'file' || type === 'function') {
      return camelCase(`use ${name}`)
    }

    if (type === 'type') {
      return pascalCase(name)
    }
    return name
  }

  const options: GetOperationGeneratorOptions<OperationGenerator> = {
    dataReturnType: 'data',
    parsers: ['mutation'],
    mutate: {
      methods: ['post'],
    },
    query: {
      methods: [],
    },
    client: {
      importPath: '@kubb/plugin-client/client',
    },
    parser: undefined,
    extName: undefined,
  }

  const plugin = { options } as Plugin<PluginSwr>
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

  test('pets', async () => {
    const operation = oas.operation('/pets', 'post')
    const parser = mutationParser

    const Component = () => {
      return (
        <App plugin={plugin} pluginManager={mockedPluginManager} mode="split">
          <Oas oas={oas} operations={[operation]} generator={og}>
            <Oas.Operation operation={operation}>
              <parser.templates.Operation operation={operation} options={options} />
            </Oas.Operation>
          </Oas>
        </App>
      )
    }
    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />)

    expect(output).toMatchFileSnapshot('./__snapshots__/Mutation/Pets.ts')
  })
})