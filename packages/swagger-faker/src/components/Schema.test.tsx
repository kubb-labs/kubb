import { schemas } from '../../../plugin-oas/mocks/schemas.ts'

import type { Plugin } from '@kubb/core'
import { mockedPluginManager } from '@kubb/core/mocks'
import type { GetOperationGeneratorOptions } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App, createRoot } from '@kubb/react'
import type { OperationGenerator } from '../OperationGenerator.tsx'
import type { PluginFaker } from '../types.ts'
import { Schema } from './Schema.tsx'

describe('<Schema/> ', () => {
  const options: GetOperationGeneratorOptions<OperationGenerator> = {
    dateType: 'date',
    seed: undefined,
    transformers: {},
    unknownType: 'any',
    mapper: {},
    override: [],
    dateParser: undefined,
    regexGenerator: 'faker',
    extName: undefined,
  }

  const plugin = { options } as Plugin<PluginFaker>

  test.each(schemas.full)('$name', ({ schema, name }) => {
    const Component = () => {
      return (
        <App plugin={plugin} pluginManager={mockedPluginManager} mode="split">
          <Oas.Schema name={name} value={undefined} tree={schema}>
            <Schema.File />
          </Oas.Schema>
        </App>
      )
    }

    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatchSnapshot()
  })
})
