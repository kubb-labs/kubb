import path from 'node:path'

import { mockedPluginManager } from '@kubb/core/mocks'
import { parse } from '@kubb/oas/parser'

import { SchemaGenerator } from './SchemaGenerator.tsx'

import type { Plugin, PluginManager } from '@kubb/core'
import type { Oas, OasTypes, SchemaObject } from '@kubb/oas'
import type { PluginOptions } from './types.ts'

describe('TypeScript SchemaGenerator petStore', async () => {
  const petStorePath = path.resolve(__dirname, '../mocks/petStore.yaml')
  const oas = await parse(petStorePath)

  test('generate type for Pet with optionalType `questionToken`', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'asConst',
        enumSuffix: 'enum',
        dateType: 'string',
        optionalType: 'questionToken',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Pet', schemas?.Pet as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate type for Pet with optionalType `undefined`', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'asConst',
        enumSuffix: '',
        dateType: 'string',
        optionalType: 'undefined',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Pet', schemas?.Pet as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate type for Pet with optionalType `questionTokenAndUndefined`', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'asConst',
        enumSuffix: '',
        dateType: 'string',
        optionalType: 'questionTokenAndUndefined',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Pet', schemas?.Pet as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate type for nullable fields', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'asConst',
        enumSuffix: '',
        dateType: 'string',
        optionalType: 'questionToken',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas: {} as Oas,
        pluginManager: {
          resolveName: ({ name }) => name,
          resolvePath: ({ baseName }) => baseName,
        } as PluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schema: OasTypes.SchemaObject = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
          nullable: true,
        },
      },
    }

    const node = generator.buildSource('Test', schema)

    expect(node).toMatchSnapshot()
  })

  test('generate type for Pets', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'asConst',
        enumSuffix: '',
        dateType: 'string',
        optionalType: 'questionToken',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Pets', schemas?.Pets as SchemaObject)

    expect(node).toMatchSnapshot()
  })
})

describe('SchemaGenerator petStoreRef', async () => {
  const petStoreRefPath = path.resolve(__dirname, '../mocks/petStoreRef.yaml')
  const oas = await parse(petStoreRefPath)

  test('generate type for Pets', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'asConst',
        enumSuffix: '',
        dateType: 'string',
        optionalType: 'questionToken',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Pets', schemas?.Pets as SchemaObject)

    expect(node).toMatchSnapshot()
  })
})

describe('SchemaGenerator discriminator', async () => {
  const discriminatorPath = path.resolve(__dirname, '../mocks/discriminator.yaml')
  const oas = await parse(discriminatorPath)

  test('PetStore defined as array with type union', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'asConst',
        enumSuffix: '',
        dateType: 'string',
        optionalType: 'questionToken',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Petstore', schemas?.Petstore as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('Cat.type defined as const', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'asConst',
        enumSuffix: '',
        dateType: 'string',
        optionalType: 'questionToken',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Cat', schemas?.Cat as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('Dog.type defined as const', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'asConst',
        enumSuffix: '',
        dateType: 'string',
        optionalType: 'questionToken',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Dog', schemas?.Dog as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('NullConst correctly produces "null"', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'asConst',
        enumSuffix: '',
        dateType: 'string',
        optionalType: 'questionToken',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )
    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('NullConst', schemas?.NullConst as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('StringValueConst const correctly produces "foobar"', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'asConst',
        enumSuffix: '',
        dateType: 'string',
        optionalType: 'questionToken',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('StringValueConst', schemas?.StringValueConst as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('NumberValueConst const correctly produces `42`', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'asConst',
        enumSuffix: '',
        dateType: 'string',
        optionalType: 'questionToken',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('NumberValueConst', schemas?.NumberValueConst as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('MixedValueTypeConst ignores type constraint in favor of const constraint', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'asConst',
        enumSuffix: '',
        dateType: 'string',
        optionalType: 'questionToken',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('MixedValueTypeConst', schemas?.MixedValueTypeConst as SchemaObject)

    expect(node).toMatchSnapshot()
  })
})

describe('SchemaGenerator enums', async () => {
  const schemaPath = path.resolve(__dirname, '../mocks/enums.yaml')
  const oas = await parse(schemaPath)
  const defaultGenerator = new SchemaGenerator(
    {
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
      override: [],
    },
    {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      mediaType: undefined,
      include: undefined,
      mode: 'split',
      override: [],
    },
  )

  const schemas = oas.getDefinition().components?.schemas

  test('generate x-enum-varnames Type', async () => {
    const node = defaultGenerator.buildSource('enumVarNames', schemas?.['enumVarNames.Type'] as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate x-enumNames Type', async () => {
    const node = defaultGenerator.buildSource('enumNames', schemas?.['enumNames.Type'] as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate enum Items', async () => {
    const node = defaultGenerator.buildSource('enumItems', schemas?.['enum.Items'] as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate enum String', async () => {
    const node = defaultGenerator.buildSource('enumString', schemas?.['enum.String'] as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate enum AllOf', async () => {
    const node = defaultGenerator.buildSource('enumObject', schemas?.['enum.AllOf'] as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate enum InObject', async () => {
    const node = defaultGenerator.buildSource('enumObject', schemas?.['enum.InObject'] as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate enum Array', async () => {
    const node = defaultGenerator.buildSource('enumArray', schemas?.['enum.Array'] as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate with enumtype enum', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'enum',
        enumSuffix: '',
        dateType: 'string',
        optionalType: 'questionToken',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const node = generator.buildSource('enumNames', schemas?.['enumNames.Type'] as OasTypes.SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate with enumtype asPascalConst', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'asPascalConst',
        enumSuffix: '',
        dateType: 'string',
        optionalType: 'questionToken',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const node = generator.buildSource('enumNames', schemas?.['enumNames.Type'] as OasTypes.SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate with enumtype constEnum', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'constEnum',
        enumSuffix: '',
        dateType: 'string',
        optionalType: 'questionToken',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const node = generator.buildSource('enumNames', schemas?.['enumNames.Type'] as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate with enumtype literal', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'literal',
        enumSuffix: '',
        dateType: 'string',
        optionalType: 'questionToken',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const node = generator.buildSource('enumNames', schemas?.['enumNames.Type'] as SchemaObject)

    expect(node).toMatchSnapshot()
  })
})

describe('TypeGenerator type assertions', async () => {
  const schemaPath = path.resolve(__dirname, '../mocks/typeAssertions.yaml')
  const oas = await parse(schemaPath)

  const defaultGenerator = new SchemaGenerator(
    {
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
      override: [],
    },
    {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      mediaType: undefined,
      include: undefined,
      mode: 'split',
      override: [],
    },
  )

  const schemas = oas.getDefinition().components?.schemas

  test('generates file property with `File` type', async () => {
    const node = defaultGenerator.buildSource('Body_upload_file_api_assets_post', schemas?.Body_upload_file_api_assets_post as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generates Plain_File types correctly', async () => {
    const node = defaultGenerator.buildSource('Plain_file', schemas?.Plain_file as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generates Date type correctly when dateType = string', async () => {
    const node = defaultGenerator.buildSource('Plain_date', schemas?.Plain_date as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generates Date type correctly when dateType = date', async () => {
    const generator = new SchemaGenerator(
      {
        usedEnumNames: {},
        enumType: 'asConst',
        enumSuffix: '',
        dateType: 'date',
        optionalType: 'questionToken',
        transformers: {},
        oasType: false,
        unknownType: 'any',
        override: [],
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        mediaType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )
    const node = defaultGenerator.buildSource('Plain_date', schemas?.Plain_date as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generates Time type correctly', async () => {
    const node = defaultGenerator.buildSource('Plain_time', schemas?.Plain_time as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generates Email type correctly', async () => {
    const node = defaultGenerator.buildSource('Plain_email', schemas?.Plain_email as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generates UUID type correctly', async () => {
    const node = defaultGenerator.buildSource('Plain_uuid', schemas?.Plain_uuid as SchemaObject)

    expect(node).toMatchSnapshot()
  })
})
