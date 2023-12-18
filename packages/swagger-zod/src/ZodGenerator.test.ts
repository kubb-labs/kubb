import path from 'node:path'

import { mockedPluginManager } from '@kubb/core/mocks'
import { OasManager } from '@kubb/swagger'

import { ZodGenerator } from './ZodGenerator.ts'

import type { OasTypes } from '@kubb/swagger/oas'

describe('ZodGenerator simple', async () => {
  const petStorePath = path.resolve(__dirname, '../mocks/petStore.yaml')
  const oas = await new OasManager().parse(petStorePath)

  test('generate schema for Pet', async () => {
    const generator = new ZodGenerator({
      exclude: undefined,
      include: undefined,
      override: undefined,
      transformers: {},
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pet as OasTypes.SchemaObject, baseName: 'Pet' })

    expect(node).toMatchSnapshot()
  })
})

describe('ZodGenerator with const', async () => {
  const discriminatorPath = path.resolve(__dirname, '../mocks/constCases.yaml')
  const oas = await new OasManager().parse(discriminatorPath)
  const generator = new ZodGenerator({
    exclude: undefined,
    include: undefined,
    override: undefined,
    transformers: {},
  }, {
    oas,
    pluginManager: mockedPluginManager,
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

describe('ZodGenerator lazy import', async () => {
  const petStorePath = path.resolve(__dirname, '../mocks/lazy.yaml')
  const oas = await new OasManager().parse(petStorePath)

  test('generate schema for Example', async () => {
    const generator = new ZodGenerator({
      exclude: undefined,
      include: undefined,
      override: undefined,
      transformers: {},
    }, {
      oas,
      pluginManager: mockedPluginManager,
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
    exclude: undefined,
    include: undefined,
    override: undefined,
    transformers: {},
  }, {
    oas,
    pluginManager: mockedPluginManager,
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