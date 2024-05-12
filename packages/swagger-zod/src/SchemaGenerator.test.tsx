import path from 'node:path'
import { SchemaGenerator } from './SchemaGenerator.tsx'

import type { Plugin } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'
import { parse } from '@kubb/oas/parser'
import { App } from '@kubb/react'
import type { PluginZod } from './types'

import { mockedPluginManager } from '@kubb/core/mocks'

import type { GetSchemaGeneratorOptions } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { createRootServer } from '@kubb/react/server'
import { Operations } from './components'
import { Schema } from './components/Schema.tsx'

describe('Zod SchemaGenerator', async () => {
  const testData = [
    {
      name: 'Pet',
      input: '../mocks/petStore.yaml',
      path: 'Pet',
      options: {},
    },
    {
      name: 'Pets',
      input: '../mocks/petStore.yaml',
      path: 'Pets',
      options: {},
    },
    {
      name: 'OptionalPet',
      input: '../mocks/petStore.yaml',
      path: 'OptionalPet',
      options: {
        typed: true,
      },
    },
    {
      name: 'OptionalPet typed',
      input: '../mocks/petStore.yaml',
      path: 'OptionalPet',
      options: {
        typed: true,
      },
    },
    {
      name: 'PetArray',
      input: '../mocks/petStore.yaml',
      path: 'PetArray',
      options: {},
    },
    {
      name: 'Order dateType date',
      input: '../mocks/petStore.yaml',
      path: 'Order',
      options: {},
    },
    {
      name: 'Order dateType string',
      input: '../mocks/petStore.yaml',
      path: 'Order',
      options: {
        dateType: 'string',
      },
    },
    {
      name: 'Order dateType false',
      input: '../mocks/petStore.yaml',
      path: 'Order',
      options: {
        dateType: false,
      },
    },
    {
      name: 'UuidSchema',
      input: '../mocks/constCases.yaml',
      path: 'UuidSchema',
      options: {},
    },
    {
      name: 'NullableString',
      input: '../mocks/constCases.yaml',
      path: 'NullableString',
      options: {},
    },
    {
      name: 'NullableStringWithAnyOf',
      input: '../mocks/constCases.yaml',
      path: 'NullableStringWithAnyOf',
      options: {},
    },
    {
      name: 'NullableStringUuid',
      input: '../mocks/constCases.yaml',
      path: 'NullableStringUuid',
      options: {},
    },
    {
      name: 'NullConst',
      input: '../mocks/constCases.yaml',
      path: 'NullableStringUuid',
      options: {},
    },
    {
      name: 'StringValueConst',
      input: '../mocks/constCases.yaml',
      path: 'StringValueConst',
      options: {},
    },
    {
      name: 'NumberValueConst',
      input: '../mocks/constCases.yaml',
      path: 'NumberValueConst',
      options: {},
    },
    {
      name: 'MixedValueTypeConst',
      input: '../mocks/constCases.yaml',
      path: 'MixedValueTypeConst',
      options: {},
    },
    {
      name: 'enumVarNames',
      input: '../mocks/enums.yaml',
      path: 'enumVarNames.Type',

      options: {},
    },
    {
      name: 'enumNames',
      input: '../mocks/enums.yaml',
      path: 'enumNames.Type',
      options: {},
    },
    {
      name: 'enumNullable 3.1',
      input: '../mocks/enums3_1.yaml',
      path: 'enumNullable',
      options: {},
    },
    {
      name: 'recursive',
      input: '../mocks/recursive.yaml',
      path: 'Example',
      options: {},
    },
    {
      name: 'anyof',
      input: '../mocks/anyof.yaml',
      path: 'test',
      options: {},
    },
    {
      name: 'lazy',
      input: '../mocks/lazy.yaml',
      path: 'Example',
      options: {},
    },
  ] as const satisfies Array<{ input: string; name: string; path: string; options: Partial<GetSchemaGeneratorOptions<SchemaGenerator>> }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))
    const schemas = oas.getDefinition().components?.schemas
    const schema = schemas?.[props.path]

    const options: GetSchemaGeneratorOptions<SchemaGenerator> = {
      dateType: 'date',
      transformers: {},
      typed: false,
      exclude: undefined,
      include: undefined,
      override: undefined,
      unknownType: 'any',
      templates: {
        operations: Operations.templates,
      },
      mapper: {},
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginZod>
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
