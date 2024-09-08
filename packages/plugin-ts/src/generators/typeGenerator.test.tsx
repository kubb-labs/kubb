import { createMockedPluginManager, matchFiles, mockedPluginManager } from '@kubb/core/mocks'

import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas/parser'
import { OperationGenerator, SchemaGenerator } from '@kubb/plugin-oas'
import { getSchemas } from '@kubb/plugin-oas/utils'
import ts, { factory } from 'typescript'
import type { PluginTs } from '../types.ts'
import { typeGenerator } from './typeGenerator.tsx'

describe('typeGenerator schema', async () => {
  const testData = [
    {
      name: 'PetQuestionToken',
      input: '../../mocks/petStore.yaml',
      path: 'Pet',
      options: {
        optionalType: 'questionToken',
      },
    },
    {
      name: 'PetUndefined',
      input: '../../mocks/petStore.yaml',
      path: 'Pet',
      options: {
        optionalType: 'undefined',
      },
    },
    {
      name: 'PetMapper',
      input: '../../mocks/petStore.yaml',
      path: 'Pet',
      options: {
        mapper: {
          category: factory.createPropertySignature(
            undefined,
            factory.createIdentifier('category'),
            factory.createToken(ts.SyntaxKind.QuestionToken),
            factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          ),
        },
      },
    },
    {
      name: 'PetQuestionTokenAndUndefined',
      input: '../../mocks/petStore.yaml',
      path: 'Pet',
      options: {
        optionalType: 'questionTokenAndUndefined',
      },
    },
    {
      name: 'Pets',
      input: '../../mocks/petStore.yaml',
      path: 'Pets',
      options: {
        optionalType: 'questionToken',
      },
    },
    {
      name: 'PetsStoreRef',
      input: '../../mocks/petStoreRef.yaml',
      path: 'Pets',
      options: {
        optionalType: 'questionToken',
      },
    },
    {
      name: 'PetsStoreDiscriminator',
      input: '../../mocks/discriminator.yaml',
      path: 'Petstore',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'CatTypeAsConst',
      input: '../../mocks/discriminator.yaml',
      path: 'Cat',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'DogTypeAsConst',
      input: '../../mocks/discriminator.yaml',
      path: 'Dog',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'NullConstNull',
      input: '../../mocks/discriminator.yaml',
      path: 'NullConst',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'StringValueConst',
      input: '../../mocks/discriminator.yaml',
      path: 'StringValueConst',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'NumberValueConst',
      input: '../../mocks/discriminator.yaml',
      path: 'NumberValueConst',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'MixedValueTypeConst',
      input: '../../mocks/discriminator.yaml',
      path: 'MixedValueTypeConst',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumVarNamesType',
      input: '../../mocks/enums.yaml',
      path: 'enumVarNames.Type',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumNamesType',
      input: '../../mocks/enums.yaml',
      path: 'enumNames.Type',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumItems',
      input: '../../mocks/enums.yaml',
      path: 'enum.Items',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumString',
      input: '../../mocks/enums.yaml',
      path: 'enum.String',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumNullableMember',
      input: '../../mocks/enums.yaml',
      path: 'enum.NullableMember',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumNullableType',
      input: '../../mocks/enums.yaml',
      path: 'enum.NullableType',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumAllOf',
      input: '../../mocks/enums.yaml',
      path: 'enum.AllOf',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumInObject',
      input: '../../mocks/enums.yaml',
      path: 'enum.InObject',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumArray',
      input: '../../mocks/enums_2.0.yaml',
      path: 'enum.Array',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumNames',
      input: '../../mocks/enums.yaml',
      path: 'enumNames.Type',
      options: {
        enumType: 'enum',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumNamesPascalConst',
      input: '../../mocks/enums.yaml',
      path: 'enumNames.Type',
      options: {
        enumType: 'asPascalConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumNamesConst',
      input: '../../mocks/enums.yaml',
      path: 'enumNames.Type',
      options: {
        enumType: 'constEnum',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'EnumNamesLiteral',
      input: '../../mocks/enums.yaml',
      path: 'enumNames.Type',
      options: {
        enumType: 'literal',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'Body_upload_file_api_assets_post',
      input: '../../mocks/typeAssertions.yaml',
      path: 'Body_upload_file_api_assets_post',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'Plain_file',
      input: '../../mocks/typeAssertions.yaml',
      path: 'Plain_file',
      options: {
        enumType: 'asConst',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'Plain_dateString',
      input: '../../mocks/typeAssertions.yaml',
      path: 'Plain_date',
      options: {
        enumType: 'asConst',
        dateType: 'string',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'Plain_dateDate',
      input: '../../mocks/typeAssertions.yaml',
      path: 'Plain_date',
      options: {
        enumType: 'asConst',
        dateType: 'date',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'Plain_timeDate',
      input: '../../mocks/typeAssertions.yaml',
      path: 'Plain_time',
      options: {
        enumType: 'asConst',
        dateType: 'date',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'Plain_email',
      input: '../../mocks/typeAssertions.yaml',
      path: 'Plain_email',
      options: {
        enumType: 'asConst',
        dateType: 'date',
        optionalType: 'questionToken',
      },
    },
    {
      name: 'Plain_uuid',
      input: '../../mocks/typeAssertions.yaml',
      path: 'Plain_uuid',
      options: {
        enumType: 'asConst',
        dateType: 'date',
        optionalType: 'questionToken',
      },
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    options: Partial<PluginTs['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginTs['resolvedOptions'] = {
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: 'enum',
      dateType: 'string',
      transformers: {},
      oasType: false,
      unknownType: 'any',
      optionalType: 'questionToken',
      override: [],
      mapper: {},
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginTs>
    const instance = new SchemaGenerator(options, {
      oas,
      pluginManager: createMockedPluginManager(props.name),
      plugin,
      contentType: 'application/json',
      include: undefined,
      override: undefined,
      mode: 'split',
      output: './gen',
    })
    await instance.build(typeGenerator)

    const schemas = getSchemas({ oas })
    const name = props.path
    const schema = schemas[name]!
    const tree = instance.parse({ schema, name })

    const files = await typeGenerator.schema?.({
      schema: {
        name,
        tree,
        value: schema,
      },
      options,
      instance,
    })

    await matchFiles(files)
  })
})

describe('typeGenerator operation', async () => {
  const testData = [
    {
      name: 'showPetById',
      input: '../../mocks/petStore.yaml',
      path: '/pets/{petId}',
      method: 'get',
      options: {},
    },
    {
      name: 'getPets',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'get',
      options: {},
    },
    {
      name: 'createPet',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'post',
      options: {},
    },
    {
      name: 'createPet with unknownType unknown',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'post',
      options: {
        unknownType: 'unknown',
      },
    },
    {
      name: 'deletePet',
      input: '../../mocks/petStore.yaml',
      path: '/pets/{petId}',
      method: 'delete',
      options: {},
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginTs['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginTs['resolvedOptions'] = {
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      usedEnumNames: {},
      transformers: {},
      oasType: false,
      unknownType: 'any',
      override: [],
      mapper: {},
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginTs>
    const instance = new OperationGenerator(options, {
      oas,
      include: undefined,
      pluginManager: createMockedPluginManager(props.name),
      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
      exclude: [],
    })
    const operation = oas.operation(props.path, props.method)
    const files = await typeGenerator.operation?.({
      operation,
      options,
      instance,
    })

    await matchFiles(files)
  })
})
