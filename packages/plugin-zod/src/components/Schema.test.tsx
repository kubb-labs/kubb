import { schemas } from '../../../plugin-oas/mocks/schemas.ts'

import type { Plugin } from '@kubb/core'
import { mockedPluginManager } from '@kubb/core/mocks'
import type { GetOperationGeneratorOptions, OperationGenerator } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App, createRoot } from '@kubb/react'
import type { PluginZod } from '../types.ts'
import { Operations } from './Operations.tsx'
import { Schema } from './Schema.tsx'

describe('<Schema/> ', () => {
  const options: GetOperationGeneratorOptions<OperationGenerator> = {
    dateType: 'string',
    include: undefined,
    transformers: {},
    unknownType: 'any',
    exclude: undefined,
    override: undefined,
    typed: false,
    typedSchema: false,
    templates: {
      operations: Operations.templates,
    },
    mapper: {},
    importPath: 'zod',
    coercion: false,
    extName: undefined,
  }

  const plugin = { options } as Plugin<PluginZod>

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
