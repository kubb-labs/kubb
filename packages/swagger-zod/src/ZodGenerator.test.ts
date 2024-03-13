import path from 'node:path'

import { mockedPluginManager } from '@kubb/core/mocks'
import { OasManager } from '@kubb/swagger'

import { ZodGenerator } from './ZodGenerator.ts'

import type { Plugin } from '@kubb/core'
import type { OasTypes } from '@kubb/swagger/oas'
import type { PluginOptions } from './types.ts'

describe('ZodGenerator PetStore', async () => {
  const petStorePath = path.resolve(__dirname, '../mocks/petStore.yaml')
  const oas = await new OasManager().parse(petStorePath)

  test('generate schema for Pet', async () => {
    const generator = new ZodGenerator({
      mapper: {},
      transformers: {},
      dateType: 'string',
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pet as OasTypes.SchemaObject, baseName: 'Pet' })

    expect(node).toMatchSnapshot()
  })

  test('generate schema for Pets', async () => {
    const generator = new ZodGenerator({
      mapper: {},
      transformers: {},
      dateType: 'string',
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pets as OasTypes.SchemaObject, baseName: 'Pets' })

    expect(node).toMatchSnapshot()
  })

  test('generate schema for OptionalPet', async () => {
    const generator = new ZodGenerator({
      mapper: {},
      transformers: {},
      dateType: 'string',
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.OptionalPet as OasTypes.SchemaObject, baseName: 'OptionalPet' })

    expect(node).toMatchSnapshot()
  })

  test('generate schema for OptionalPet typed', async () => {
    const generator = new ZodGenerator({
      mapper: {},
      transformers: {},
      typed: true,
      dateType: 'string',
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.OptionalPet as OasTypes.SchemaObject, baseName: 'OptionalPet' })

    expect(node).toMatchSnapshot()
  })

  test('generate schema for PetArray', async () => {
    const generator = new ZodGenerator({
      mapper: {},
      transformers: {},
      dateType: 'string',
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.PetArray as OasTypes.SchemaObject, baseName: 'PetArray' })

    expect(node).toMatchSnapshot()
  })
})

describe('ZodGenerator constCases', async () => {
  const discriminatorPath = path.resolve(__dirname, '../mocks/constCases.yaml')
  const oas = await new OasManager().parse(discriminatorPath)
  const generator = new ZodGenerator({
    mapper: {},
    transformers: {},
    dateType: 'string',
    unknownType: 'any',
  }, {
    oas,
    pluginManager: mockedPluginManager,
    plugin: {} as Plugin<PluginOptions>,
  })
  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  const schemas = oas.getDefinition().components?.schemas!

  test('UuidSchema generates a string with uuid format constraint', async () => {
    const schema = schemas['UuidSchema'] as OasTypes.SchemaObject
    const node = generator.build({ schema, baseName: 'UuidSchema' })

    expect(node).toMatchSnapshot()
  })

  test('NullableString zodifies correctly', async () => {
    const schema = schemas?.['NullableString'] as OasTypes.SchemaObject
    const node = generator.build({ schema, baseName: 'NullableString' })

    expect(node).toMatchSnapshot()
  })

  test('NullableStringWithAnyOf results in union of string and null', async () => {
    const schema = schemas['NullableStringWithAnyOf'] as OasTypes.SchemaObject
    const node = generator.build({ schema, baseName: 'NullableStringWithAnyOf' })

    expect(node).toMatchSnapshot()
  })

  test('NullableStringUuid zodifies correctly to a uuid or null', async () => {
    const schema = schemas['NullableStringUuid'] as OasTypes.SchemaObject
    const node = generator.build({ schema, baseName: 'NullableStringUuid' })

    expect(node).toMatchSnapshot()
  })

  test('NullConst zodifies correctly', async () => {
    const schema = schemas['NullConst'] as OasTypes.SchemaObject
    const node = generator.build({ schema, baseName: 'NullConst' })

    expect(node).toMatchSnapshot()
  })

  test('StringValueConst correctly generates zod literal', async () => {
    const schema = schemas['StringValueConst'] as OasTypes.SchemaObject
    const node = generator.build({ schema, baseName: 'StringValueConst' })

    expect(node).toMatchSnapshot()
  })

  test('NumberValueConst correctly generates zod literal', async () => {
    const schema = schemas['NumberValueConst'] as OasTypes.SchemaObject
    const node = generator.build({ schema, baseName: 'NumberValueConst' })

    expect(node).toMatchSnapshot()
  })

  test('MixedValueTypeConst generates zod literal value correctly, overriding the type constraint', async () => {
    const schema = schemas['MixedValueTypeConst'] as OasTypes.SchemaObject
    const node = generator.build({ schema, baseName: 'MixedValueTypeConst' })

    expect(node).toMatchSnapshot()
  })
})

describe('ZodGenerator lazy', async () => {
  const petStorePath = path.resolve(__dirname, '../mocks/lazy.yaml')
  const oas = await new OasManager().parse(petStorePath)

  test('generate schema for Example', async () => {
    const generator = new ZodGenerator({
      mapper: {},
      transformers: {},
      dateType: 'string',
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Example as OasTypes.SchemaObject, baseName: 'Example' })

    expect(node).toMatchSnapshot()
  })
})

describe('ZodGenerator enums', async () => {
  const schemaPath = path.resolve(__dirname, '../mocks/enums.yaml')
  const oas = await new OasManager().parse(schemaPath)
  const generator = new ZodGenerator({
    mapper: {},
    transformers: {},
    dateType: 'string',
    unknownType: 'any',
  }, {
    oas,
    pluginManager: mockedPluginManager,
    plugin: {} as Plugin<PluginOptions>,
  })

  const schemas = oas.getDefinition().components?.schemas

  test('generate x-enum-varnames types', async () => {
    const node = generator.build({ schema: schemas?.['enumVarNames.Type'] as OasTypes.SchemaObject, baseName: 'enumVarNames' })

    expect(node).toMatchSnapshot()
  })

  test('generate x-enumNames types', async () => {
    const node = generator.build({ schema: schemas?.['enumNames.Type'] as OasTypes.SchemaObject, baseName: 'enumNames' })

    expect(node).toMatchSnapshot()
  })
})

describe('ZodGenerator recursive', async () => {
  const petStorePath = path.resolve(__dirname, '../mocks/recursive.yaml')
  const oas = await new OasManager().parse(petStorePath)

  test('generate schema for Example', async () => {
    const generator = new ZodGenerator({
      mapper: {},
      transformers: {},
      dateType: 'string',
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Example as OasTypes.SchemaObject, baseName: 'Example' })

    expect(node).toMatchSnapshot()
  })
})

describe('ZodGenerator anyof', async () => {
  const discriminatorPath = path.resolve(__dirname, '../mocks/anyof.yaml')
  const oas = await new OasManager().parse(discriminatorPath)
  const generator = new ZodGenerator({
    mapper: {},
    transformers: {},
    dateType: 'string',
    unknownType: 'any',
  }, {
    oas,
    pluginManager: mockedPluginManager,
    plugin: {} as Plugin<PluginOptions>,
  })
  // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
  const schemas = oas.getDefinition().components?.schemas!

  test('anyof with 2 objects', async () => {
    const schema = schemas['test'] as OasTypes.SchemaObject
    const node = generator.build({ schema, baseName: 'test' })

    expect(node).toMatchSnapshot()
  })
})
