import path from 'node:path'
import type { ZodOpenAPIMetadata } from '@asteasolutions/zod-to-openapi'
import type { Plugin } from '@kubb/core'
import { createMockedPluginManager, matchFiles } from '@kubb/core/mocks'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
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
      name: 'OrderDateTypeString',
      path: 'Order',
      input: '../../mocks/petStore.yaml',
      options: {
        dateType: 'string',
      },
    },
    {
      name: 'Toy',
      path: 'Toy',
      input: '../../mocks/petStore.yaml',
      options: {},
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
      name: 'enumBooleanLiteral',
      path: 'enumBooleanLiteral',
      input: '../../mocks/enums3_1.yaml',
      options: {},
    },
    {
      name: 'enumSingleLiteral',
      path: 'enumSingleLiteral',
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
    {
      name: 'discriminator',
      path: 'Advanced',
      input: '../../mocks/discriminator.yaml',
      options: {},
    },
    {
      name: 'coercion',
      path: 'Pet',
      input: '../../mocks/petStore.yaml',
      options: {
        coercion: true,
      },
    },
    {
      name: 'coercion-strings',
      path: 'Pet',
      input: '../../mocks/petStore.yaml',
      options: {
        coercion: { strings: true },
      },
    },
    {
      name: 'coercion-numbers',
      path: 'Pet',
      input: '../../mocks/petStore.yaml',
      options: {
        coercion: { numbers: true },
      },
    },
    {
      name: 'coercion-dates',
      path: 'Pet',
      input: '../../mocks/petStore.yaml',
      options: {
        coercion: { dates: true },
      },
    },
    {
      name: 'Nullable',
      input: '../../mocks/nullable.yaml',
      path: 'Nullable',
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
      output: {
        path: '.',
      },
      group: undefined,
      wrapOutput: undefined,
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
    const tree = instance.parse({ schemaObject: schema, name })

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
    {
      name: 'query-all-defaulted',
      input: '../../mocks/queryRequiredDefault.yaml',
      method: 'get',
      path: '/thing',
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
      output: {
        path: '.',
      },
      group: undefined,
      wrapOutput: undefined,
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

  describe('wrapOutput', () => {
    test.each(testData)('$name', async (props) => {
      const oas = await parse(path.resolve(__dirname, props.input))

      const options: PluginZod['resolvedOptions'] = {
        dateType: 'date',
        transformers: {},
        typed: false,
        inferred: false,
        unknownType: 'any',
        mapper: {},
        importPath: '@hono/zod-openapi',
        coercion: false,
        operations: false,
        override: [],
        output: {
          path: '.',
        },
        group: undefined,
        wrapOutput: ({ output, schema }) => {
          const metadata: ZodOpenAPIMetadata = {}

          if (schema.example) {
            metadata.example = schema.example
          }

          if (schema.examples) {
            if (Array.isArray(schema.examples)) {
              metadata.examples = schema.examples
            } else if (typeof schema.examples === 'object') {
              metadata.examples = Object.entries(schema.examples).map(([key, value]) => ({
                [key]: value,
              }))
            }
          }
          if (Object.keys(metadata).length > 0) {
            return `${output}.openapi(${JSON.stringify(metadata)})`
          }
          return undefined
        },
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
      let files = await zodGenerator.operation?.({
        operation,
        options,
        instance,
      })
      files = files?.map((file) => {
        const [operation, extension] = file.path.split('.')
        file.path = `${operation}_wrapOutput.${extension}`
        return file
      })

      await matchFiles(files)
    })

    test('wraps the entire output', async () => {
      const entry = {
        name: 'createPet with unknownType unknown',
        input: '../../mocks/petStore.yaml',
        path: '/pets',
        method: 'post',
        options: {
          unknownType: 'unknown',
        },
      } as const satisfies {
        input: string
        name: string
        path: string
        method: HttpMethod
        options: Partial<PluginZod['resolvedOptions']>
      }

      const oas = await parse(path.resolve(__dirname, '../../mocks/petStore.yaml'))

      const options: PluginZod['resolvedOptions'] = {
        dateType: 'date',
        transformers: {},
        typed: false,
        inferred: false,
        mapper: {},
        importPath: '@hono/zod-openapi',
        coercion: false,
        operations: false,
        override: [],
        output: {
          path: '.',
        },
        group: undefined,
        wrapOutput: ({ output, schema }) => {
          const metadata: ZodOpenAPIMetadata = {}

          if (schema.example) {
            metadata.example = schema.example
          }

          if (schema.examples) {
            if (Array.isArray(schema.examples)) {
              metadata.examples = schema.examples
            } else if (typeof schema.examples === 'object') {
              metadata.examples = Object.entries(schema.examples).map(([key, value]) => ({
                [key]: value,
              }))
            }
          }
          if (Object.keys(metadata).length > 0) {
            return `extendApi(${output}, ${JSON.stringify(metadata)})`
          }
          return undefined
        },
        ...entry.options,
      }
      const plugin = { options } as Plugin<PluginZod>
      const instance = new OperationGenerator(options, {
        oas,
        include: undefined,
        pluginManager: createMockedPluginManager(entry.name),
        plugin,
        contentType: undefined,
        override: undefined,
        mode: 'split',
        exclude: [],
      })
      const operation = oas.operation(entry.path, entry.method)
      let files = await zodGenerator.operation?.({
        operation,
        options,
        instance,
      })
      files = files?.map((file) => {
        const [operation, extension] = file.path.split('.')
        file.path = `${operation}_wrapOutput_entire_.${extension}`
        return file
      })

      await matchFiles(files)
    })
  })
})
