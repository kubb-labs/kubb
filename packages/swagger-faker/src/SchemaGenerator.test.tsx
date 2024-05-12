import path from 'node:path'
import { SchemaGenerator } from './SchemaGenerator.tsx'

import type { Plugin } from '@kubb/core'
import { parse } from '@kubb/oas/parser'
import { App } from '@kubb/react'
import type { PluginFaker } from './types'

import { mockedPluginManager } from '@kubb/core/mocks'

import type { SchemaObject } from '@kubb/oas'
import type { GetSchemaGeneratorOptions } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { createRootServer } from '@kubb/react/server'
import { Schema } from './components/Schema.tsx'

describe('Faker SchemaGenerator enums', async () => {
  const oas = await parse(path.resolve(__dirname, '../mocks/petStore.yaml'))

  const options: GetSchemaGeneratorOptions<SchemaGenerator> = {
    dateType: 'date',
    seed: undefined,
    transformers: {},
    unknownType: 'any',
    mapper: {},
    override: [],
  }
  const plugin = { options } as Plugin<PluginFaker>
  const generator = new SchemaGenerator(options, {
    oas,
    include: undefined,
    pluginManager: mockedPluginManager,
    plugin,
    contentType: undefined,
    override: undefined,
    mode: 'split',
  })
  const schemas = oas.getDefinition().components?.schemas

  const testData = [
    {
      name: 'enumVarNames',
      schema: schemas?.['enumVarNames.Type'] as SchemaObject,
    },
    {
      name: 'enumNames',
      schema: schemas?.['enumNames.Type'] as SchemaObject,
    },
  ] as const satisfies Array<{ name: string; schema: SchemaObject }>

  test.each(testData)('$name', async ({ name, schema }) => {
    const tree = generator.parse({ schema, name })

    const Component = () => {
      return (
        <App plugin={plugin} pluginManager={mockedPluginManager} mode="split">
          <Oas.Schema name={name} value={undefined} tree={tree}>
            <Schema.File />
          </Oas.Schema>
        </App>
      )
    }
    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />)

    expect(output).toMatchSnapshot()
  })
})
