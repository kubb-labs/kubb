import { createMockedPluginManager, matchFiles, mockedPluginManager } from '@kubb/core/mocks'

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
      path: 'Pet',
      input: '../../mocks/petStore.yaml',
      options: {},
    },
    {
      name: 'Pets',
      path: 'Pets',
      input: '../../mocks/petStore.yaml',
      options: {
        typed: true,
      },
    },
    {
      name: 'PetCoercion',
      path: 'Pet',
      input: '../../mocks/petStore.yaml',
      options: {
        coercion: true,
      },
    },
    {
      name: 'PetWithMapper',
      input: '../../mocks/petStore.yaml',
      path: 'Pet',
      options: {
        mapper: {
          name: 'z.string().email()',
        },
      },
    },
    {
      name: 'PetTupleObject',
      path: 'PetTupleObject',
      input: '../../mocks/petStore.yaml',
      options: {},
    },
    {
      name: 'OptionalPetInfer',
      path: 'OptionalPet',
      input: '../../mocks/petStore.yaml',
      options: {
        inferred: true,
      },
    },
    {
      name: 'OptionalPetTyped',
      path: 'OptionalPet',
      input: '../../mocks/petStore.yaml',
      options: {
        typed: true,
      },
    },
    {
      name: 'PetArray',
      path: 'PetArray',
      input: '../../mocks/petStore.yaml',
      options: {},
    },
    {
      name: 'Order',
      path: 'Order',
      input: '../../mocks/petStore.yaml',
      options: {},
    },
    {
      name: 'OrderDateTyestring',
      path: 'Order',
      input: '../../mocks/petStore.yaml',
      options: {
        dateType: 'string',
      },
    },
    {
      name: 'OrderDateTypeFalse',
      path: 'Order',
      input: '../../mocks/petStore.yaml',
      options: {
        dateType: false,
      },
    },
    {
      name: 'UuidSchema',
      path: 'UuidSchema',
      input: '../../mocks/constCases.yaml',
      options: {},
    },
    {
      name: 'NullableString',
      path: 'NullableString',
      input: '../../mocks/constCases.yaml',
      options: {},
    },
    {
      name: 'NullableStringWithAnyOf',
      path: 'NullableStringWithAnyOf',
      input: '../../mocks/constCases.yaml',
      options: {},
    },
    {
      name: 'NullableStringUuid',
      path: 'NullableStringUuid',
      input: '../../mocks/constCases.yaml',
      options: {},
    },
    {
      name: 'StringValueConst',
      path: 'StringValueConst',
      input: '../../mocks/constCases.yaml',
      options: {},
    },
    {
      name: 'NumberValueConst',
      path: 'NumberValueConst',
      input: '../../mocks/constCases.yaml',
      options: {},
    },
    {
      name: 'MixedValueTypeConst',
      path: 'MixedValueTypeConst',
      input: '../../mocks/constCases.yaml',
      options: {},
    },
    {
      name: 'enumVarNames.Type',
      path: 'enumVarNames.Type',
      input: '../../mocks/enums.yaml',
      options: {},
    },
    {
      name: 'enumNames.Type',
      path: 'enumNames.Type',
      input: '../../mocks/enums.yaml',
      options: {},
    },
    {
      name: 'enumNullable',
      path: 'enumNullable',
      input: '../../mocks/enums3_1.yaml',
      options: {},
    },
    {
      name: 'Recursive',
      path: 'Example',
      input: '../../mocks/recursive.yaml',
      options: {},
    },
    {
      name: 'anyof',
      path: 'test',
      input: '../../mocks/anyof.yaml',
      options: {},
    },
    {
      name: 'oneof',
      path: 'test',
      input: '../../mocks/oneof.yaml',
      options: {},
    },
    {
      name: 'Example',
      path: 'Example',
      input: '../../mocks/lazy.yaml',
      options: {},
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    options: Partial<PluginZod['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginZod['resolvedOptions'] = {
      dateType: 'date',
      transformers: {},
      inferred: false,
      typed: false,
      unknownType: 'any',
      mapper: {},
      importPath: 'zod',
      coercion: false,
      operations: false,
      override: [],
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginZod>
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
    await instance.build(zodGenerator)

    const schemas = getSchemas({ oas })
    const name = props.path
    const schema = schemas[name]!
    const tree = instance.parse({ schema, name })

    const files = await zodGenerator.schema?.({
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
    options: Partial<PluginZod['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginZod['resolvedOptions'] = {
      dateType: 'date',
      transformers: {},
      typed: false,
      inferred: false,
      unknownType: 'any',
      mapper: {},
      importPath: 'zod',
      coercion: false,
      operations: false,
      override: [],
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginZod>
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
    const files = await zodGenerator.operation?.({
      operation,
      options,
      instance,
    })

    await matchFiles(files)
  })
})
