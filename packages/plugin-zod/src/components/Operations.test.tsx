import { mockedPluginManager } from '@kubb/core/mocks'
import { Oas } from '@kubb/plugin-oas/components'
import { createRootServer } from '@kubb/react/server'

import { Operations } from './Operations.tsx'

import path from 'node:path'
import type { Plugin } from '@kubb/core'
import { parse } from '@kubb/oas/parser'
import { type GetOperationGeneratorOptions, OperationGenerator } from '@kubb/plugin-oas'
import { App } from '@kubb/react'
import type { PluginZod } from '../types.ts'

describe('<Operations/>', async () => {
  const oas = await parse(path.resolve(__dirname, '../../mocks/petStore.yaml'))
  const options: GetOperationGeneratorOptions<OperationGenerator> = {
    dateType: 'date',
    transformers: {},
    typed: false,
    typedSchema: false,
    exclude: undefined,
    include: undefined,
    override: undefined,
    unknownType: 'any',
    templates: {
      operations: Operations.templates,
    },
    mapper: {},
    importPath: 'zod',
    coercion: false,
    extName: undefined,
  }
  const plugin = { options } as Plugin<PluginZod>
  const generator = new OperationGenerator(options, {
    oas,
    include: undefined,
    pluginManager: mockedPluginManager,
    plugin,
    contentType: undefined,
    override: undefined,
    mode: 'split',
    exclude: [],
  })

  test('operations', async () => {
    const operations = [oas.operation('/pets/{pet_id}', 'get'), oas.operation('/pets', 'get'), oas.operation('/pets', 'post')]

    const Component = () => {
      return (
        <App plugin={plugin} pluginManager={mockedPluginManager} mode="split">
          <Oas oas={oas} operations={operations} generator={generator}>
            <Operations.File />
          </Oas>
        </App>
      )
    }

    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />)

    expect(output).toMatchFileSnapshot('./__snapshots__/operations.ts')
  })
})
