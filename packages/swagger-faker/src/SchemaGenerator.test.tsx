import path from 'node:path'
import { SchemaGenerator } from './SchemaGenerator.tsx'

import type { Plugin } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'
import { parse } from '@kubb/oas/parser'
import { App } from '@kubb/react'
import type { PluginFaker } from './types'

import { mockedPluginManager } from '@kubb/core/mocks'

import type { GetSchemaGeneratorOptions } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { createRootServer } from '@kubb/react/server'
import { Schema } from './components/Schema.tsx'

describe('Faker SchemaGenerator', async () => {
  const testData = [
    {
      name: 'Pet',
      input: '../mocks/petStore.yaml',
      path: 'Pet',
      options: {},
    },
    {
      name: 'PetWithParser',
      input: '../mocks/petStore.yaml',
      path: 'Pet',
      options: {
        dateType: 'string',
        dateParser: 'dayjs',
      },
    },
    {
      name: 'Pets',
      input: '../mocks/petStore.yaml',
      path: 'Pets',
      options: {},
    },
    {
      name: 'PetWithRandExp',
      input: '../mocks/petStore.yaml',
      path: 'Pet',
      options: {
        regexGenerator: 'randexp',
      },
    },
    {
      name: 'enumVarNames',
      input: '../mocks/petStore.yaml',
      path: 'enumVarNames.Type',
      options: {},
    },
    {
      name: 'enumNames',
      input: '../mocks/petStore.yaml',
      path: 'enumNames.Type',
      options: {},
    },
  ] as const satisfies Array<{ input: string; name: string; path: string; options: Partial<GetSchemaGeneratorOptions<SchemaGenerator>> }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))
    const schemas = oas.getDefinition().components?.schemas
    const schema = schemas?.[props.path]

    const options: GetSchemaGeneratorOptions<SchemaGenerator> = {
      dateType: 'date',
      seed: undefined,
      transformers: {},
      unknownType: 'any',
      mapper: {},
      override: [],
      dateParser: undefined,
      regexGenerator: 'faker',
      ...props.options,
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
    const tree = generator.parse({ schema, name: props.name })

    const Component = () => {
      return (
        <App plugin={plugin} pluginManager={mockedPluginManager} mode="split">
          <Oas.Schema name={camelCase(props.name)} value={undefined} tree={tree}>
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
