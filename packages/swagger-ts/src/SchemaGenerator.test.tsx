import path from 'node:path'
import { SchemaGenerator } from './SchemaGenerator.tsx'

import type { Plugin } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'

import { parse } from '@kubb/oas/parser'
import type { PluginTs } from './types'

import { mockedPluginManager } from '@kubb/core/mocks'

import type { GetSchemaGeneratorOptions } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App } from '@kubb/react'
import { createRootServer } from '@kubb/react/server'
import { Schema } from './components/Schema.tsx'

describe('TypeScript SchemaGenerator', async () => {
  const testData = [
    {
      name: 'PetQuestionToken',
      input: '../mocks/petStore.yaml',
      path: 'Pet',
      options: {
        optionalType: 'questionToken',
      },
    },
    {
      name: 'PetUndefined',
      input: '../mocks/petStore.yaml',
      path: 'Pet',
      options: {
        optionalType: 'undefined',
      },
    },
    {
      name: 'PetQuestionTokenAndUndefined',
      input: '../mocks/petStore.yaml',
      path: 'Pet',
      options: {
        optionalType: 'questionTokenAndUndefined',
      },
    },
    {
      name: 'Pets',
      input: '../mocks/petStore.yaml',
      path: 'Pets',
      options: {
        optionalType: 'questionToken',
      },
    },
    {
      name: 'PetsStoreRef',
      input: '../mocks/petStoreRef.yaml',
      path: 'Pets',
      options: {
        optionalType: 'questionToken',
      },
    },
    {
      name: 'PetsStoreDiscriminator',
      input: '../mocks/discriminator.yaml',
      path: 'Petstore',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'CatTypeAsConst',
      input: '../mocks/discriminator.yaml',
      path: 'Cat',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'DogTypeAsConst',
      input: '../mocks/discriminator.yaml',
      path: 'Dog',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'NullConstNull',
      input: '../mocks/discriminator.yaml',
      path: 'NullConst',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'StringValueConst',
      input: '../mocks/discriminator.yaml',
      path: 'StringValueConst',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'NumberValueConst',
      input: '../mocks/discriminator.yaml',
      path: 'NumberValueConst',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'MixedValueTypeConst',
      input: '../mocks/discriminator.yaml',
      path: 'MixedValueTypeConst',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumVarNamesType',
      input: '../mocks/enums.yaml',
      path: 'enumVarNames.Type',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumNamesType',
      input: '../mocks/enums.yaml',
      path: 'enumNames.Type',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumItems',
      input: '../mocks/enums.yaml',
      path: 'enum.Items',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumString',
      input: '../mocks/enums.yaml',
      path: 'enum.String',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumNullableMember',
      input: '../mocks/enums.yaml',
      path: 'enum.NullableMember',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumNullableType',
      input: '../mocks/enums.yaml',
      path: 'enum.NullableType',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumAllOf',
      input: '../mocks/enums.yaml',
      path: 'enum.AllOf',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumInObject',
      input: '../mocks/enums.yaml',
      path: 'enum.InObject',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumArray',
      input: '../mocks/enums_2.0.yaml',
      path: 'enum.Array',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumNames',
      input: '../mocks/enums.yaml',
      path: 'enumNames.Type',
      options: {
        enumType: 'enum',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumNamesPascalConst',
      input: '../mocks/enums.yaml',
      path: 'enumNames.Type',
      options: {
        enumType: 'asPascalConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumNamesConst',
      input: '../mocks/enums.yaml',
      path: 'enumNames.Type',
      options: {
        enumType: 'constEnum',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumNamesLiteral',
      input: '../mocks/enums.yaml',
      path: 'enumNames.Type',
      options: {
        enumType: 'literal',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'Body_upload_file_api_assets_post',
      input: '../mocks/typeAssertions.yaml',
      path: 'Body_upload_file_api_assets_post',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'Plain_file',
      input: '../mocks/typeAssertions.yaml',
      path: 'Plain_file',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'Plain_dateString',
      input: '../mocks/typeAssertions.yaml',
      path: 'Plain_date',
      options: {
        enumType: 'asConst',
        dateType: 'string',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'Plain_dateDate',
      input: '../mocks/typeAssertions.yaml',
      path: 'Plain_date',
      options: {
        enumType: 'asConst',
        dateType: 'date',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'Plain_timeDate',
      input: '../mocks/typeAssertions.yaml',
      path: 'Plain_time',
      options: {
        enumType: 'asConst',
        dateType: 'date',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'Plain_email',
      input: '../mocks/typeAssertions.yaml',
      path: 'Plain_email',
      options: {
        enumType: 'asConst',
        dateType: 'date',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'Plain_uuid',
      input: '../mocks/typeAssertions.yaml',
      path: 'Plain_uuid',
      options: {
        enumType: 'asConst',
        dateType: 'date',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'Nullable',
      input: '../mocks/typeAssertions.yaml',
      path: 'Nullable',
      options: {
        optionalType: 'questionToken',
      },
    },
  ] as const satisfies Array<{ input: string; name: string; path: string; options: Partial<GetSchemaGeneratorOptions<SchemaGenerator>> }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))
    const schemas = oas.getDefinition().components?.schemas
    const schema = schemas?.[props.path]

    const options: GetSchemaGeneratorOptions<SchemaGenerator> = {
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: 'enum',
      dateType: 'string',
      transformers: {},
      oasType: false,
      unknownType: 'any',
      override: [],
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginTs>
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
