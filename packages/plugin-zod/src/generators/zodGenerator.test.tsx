import { matchFiles, mockedPluginManager } from '@kubb/core/mocks'

import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas/parser'
import { OperationGenerator, SchemaGenerator } from '@kubb/plugin-oas'
import { getSchemas } from '@kubb/plugin-oas/utils'
import type { PluginZod } from '../types.ts'
import { zodGenerator } from './zodGenerator.tsx'

describe('zodGenerator schema', async () => {
  const testData = [
    {
      name: 'Pet',
      input: '../../mocks/petStore.yaml',
      options: {},
    },
    {
      name: 'Pets',
      input: '../../mocks/petStore.yaml',
      options: {
        typedSchema: true,
      },
    },
    {
      name: 'Pet',
      input: '../../mocks/petStore.yaml',
      options: {},
    },
    {
      name: 'Pet',
      input: '../../mocks/petStore.yaml',
      options: {
        coercion: true,
      },
    },
    {
      name: 'PetTupleObject',
      input: '../../mocks/petStore.yaml',

      options: {},
    },
    {
      name: 'OptionalPet',
      input: '../../mocks/petStore.yaml',
      options: {
        typed: true,
      },
    },
    {
      name: 'OptionalPet',
      input: '../../mocks/petStore.yaml',
      options: {
        typed: true,
      },
    },
    {
      name: 'PetArray',
      input: '../../mocks/petStore.yaml',
      options: {},
    },
    {
      name: 'Order',
      input: '../../mocks/petStore.yaml',
      options: {},
    },
    {
      name: 'Order',
      input: '../../mocks/petStore.yaml',
      options: {
        dateType: 'string',
      },
    },
    {
      name: 'Order',
      input: '../../mocks/petStore.yaml',
      options: {
        dateType: false,
      },
    },
    {
      name: 'UuidSchema',
      input: '../../mocks/constCases.yaml',
      options: {},
    },
    {
      name: 'NullableString',
      input: '../../mocks/constCases.yaml',
      options: {},
    },
    {
      name: 'NullableStringWithAnyOf',
      input: '../../mocks/constCases.yaml',
      options: {},
    },
    {
      name: 'NullableStringUuid',
      input: '../../mocks/constCases.yaml',
      options: {},
    },
    {
      name: 'StringValueConst',
      input: '../../mocks/constCases.yaml',
      options: {},
    },
    {
      name: 'NumberValueConst',
      input: '../../mocks/constCases.yaml',
      options: {},
    },
    {
      name: 'MixedValueTypeConst',
      input: '../../mocks/constCases.yaml',
      options: {},
    },
    {
      name: 'enumVarNames.Type',
      input: '../../mocks/enums.yaml',

      options: {},
    },
    {
      name: 'enumNames.Type',
      input: '../../mocks/enums.yaml',
      options: {},
    },
    {
      name: 'enumNullable',
      input: '../../mocks/enums3_1.yaml',
      options: {},
    },
    {
      name: 'Example',
      input: '../../mocks/recursive.yaml',
      options: {},
    },
    {
      name: 'test',
      input: '../../mocks/anyof.yaml',
      options: {},
    },
    {
      name: 'test',
      input: '../../mocks/oneof.yaml',
      options: {},
    },
    {
      name: 'Example',
      input: '../../mocks/lazy.yaml',
      options: {},
    },
  ] as const satisfies Array<{
    input: string
    name: string
    options: Partial<PluginZod['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginZod['resolvedOptions'] = {
      dateType: 'date',
      transformers: {},
      typed: false,
      typedSchema: false,
      unknownType: 'any',
      mapper: {},
      importPath: 'zod',
      coercion: false,
      operations: false,
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginZod>
    const instance = new SchemaGenerator(options, {
      oas,
      pluginManager: mockedPluginManager,
      plugin,
      contentType: 'application/json',
      include: undefined,
      override: undefined,
      mode: 'split',
      output: './gen',
    })
    await instance.build(zodGenerator)

    const schemas = getSchemas({ oas })
    const name = props.name
    const schema = schemas[name]!
    const tree = instance.parse({ schema, name })

    const files = await zodGenerator.schema?.({
      schema,
      name,
      tree,
      options,
      instance,
    })

    await matchFiles(files)
  })
})

describe('zodGenerator operation', async () => {
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
      name: 'createPet with unknownType any',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'post',
      options: {
        unknownType: 'any',
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
    options: Partial<PluginZod['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginZod['resolvedOptions'] = {
      dateType: 'date',
      transformers: {},
      typed: false,
      typedSchema: false,
      unknownType: 'any',
      mapper: {},
      importPath: 'zod',
      coercion: false,
      operations: false,
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginZod>
    const instance = new OperationGenerator(options, {
      oas,
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
      exclude: [],
    })
    const operation = oas.operation(props.path, props.method)
    const files = await zodGenerator.operation?.({
      operation,
      options,
      instance,
    })

    await matchFiles(files)
  })
})
