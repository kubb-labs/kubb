import path from 'node:path'

import { mockedPluginManager } from '@kubb/core/mocks'
import { OasManager } from '@kubb/swagger'

import { SchemaGenerator } from './SchemaGenerator.tsx'

import type { Plugin, PluginManager } from '@kubb/core'
import type { Oas, OasTypes, SchemaObject } from '@kubb/swagger/oas'
import type { PluginOptions } from './types.ts'

describe('SchemaGenerator petStore', async () => {
  const petStorePath = path.resolve(__dirname, '../mocks/petStore.yaml')
  const oas = await new OasManager().parse(petStorePath)

  test('generate type for Pet with optionalType `questionToken`', async () => {
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: 'enum',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Pet', schemas?.Pet as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate type for Pet with optionalType `undefined`', async () => {
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'undefined',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Pet', schemas?.Pet as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate type for Pet with optionalType `questionTokenAndUndefined`', async () => {
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionTokenAndUndefined',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Pet', schemas?.Pet as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate type for nullable fields', async () => {
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas: {} as Oas,
      pluginManager: { resolveName: ({ name }) => name, resolvePath: ({ baseName }) => baseName } as PluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })

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
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Pets', schemas?.Pets as SchemaObject)

    expect(node).toMatchSnapshot()
  })
})

describe('SchemaGenerator petStoreRef', async () => {
  const petStoreRefPath = path.resolve(__dirname, '../mocks/petStoreRef.yaml')
  const oas = await new OasManager().parse(petStoreRefPath)

  test('generate type for Pets', async () => {
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Pets', schemas?.Pets as SchemaObject)

    expect(node).toMatchSnapshot()
  })
})

describe('SchemaGenerator discriminator', async () => {
  const discriminatorPath = path.resolve(__dirname, '../mocks/discriminator.yaml')
  const oas = await new OasManager().parse(discriminatorPath)

  test('PetStore defined as array with type union', async () => {
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Petstore', schemas?.Petstore as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('Cat.type defined as const', async () => {
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Cat', schemas?.Cat as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('Dog.type defined as const', async () => {
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Dog', schemas?.Dog as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('NullConst correctly produces "null"', async () => {
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })
    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('NullConst', schemas?.NullConst as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('StringValueConst const correctly produces "foobar"', async () => {
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('StringValueConst', schemas?.StringValueConst as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('NumberValueConst const correctly produces `42`', async () => {
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('NumberValueConst', schemas?.NumberValueConst as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('MixedValueTypeConst ignores type constraint in favor of const constraint', async () => {
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('MixedValueTypeConst', schemas?.MixedValueTypeConst as SchemaObject)

    expect(node).toMatchSnapshot()
  })
})

describe('SchemaGenerator enums', async () => {
  const schemaPath = path.resolve(__dirname, '../mocks/enums.yaml')
  const oas = await new OasManager().parse(schemaPath)
  const defaultGenerator = new SchemaGenerator({
    usedEnumNames: {},
    enumType: 'asConst',
    enumSuffix: '',
    dateType: 'string',
    optionalType: 'questionToken',
    transformers: {},
    oasType: false,
    unknownType: 'any',
  }, {
    oas,
    pluginManager: mockedPluginManager,
    plugin: {} as Plugin<PluginOptions>,
    contentType: undefined,
    include: undefined,
  })

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
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'enum',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })

    const node = generator.buildSource('enumNames', schemas?.['enumNames.Type'] as OasTypes.SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate with enumtype asPascalConst', async () => {
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'asPascalConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })

    const node = generator.buildSource('enumNames', schemas?.['enumNames.Type'] as OasTypes.SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate with enumtype constEnum', async () => {
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'constEnum',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })

    const node = generator.buildSource('enumNames', schemas?.['enumNames.Type'] as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate with enumtype literal', async () => {
    const generator = new SchemaGenerator({
      usedEnumNames: {},
      enumType: 'literal',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
    })

    const node = generator.buildSource('enumNames', schemas?.['enumNames.Type'] as SchemaObject)

    expect(node).toMatchSnapshot()
  })
})
