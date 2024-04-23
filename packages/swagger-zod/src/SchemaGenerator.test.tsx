import path from 'node:path'

import { mockedPluginManager } from '@kubb/core/mocks'

import { SchemaGenerator } from './SchemaGenerator.tsx'

import type { Plugin } from '@kubb/core'
import type { SchemaObject } from '@kubb/oas'
import { parse } from '@kubb/oas/parser'
import { Operations } from './components/Operations.tsx'
import type { PluginOptions } from './types.ts'

describe('Zod SchemaGenerator PetStore', async () => {
  const petStorePath = path.resolve(__dirname, '../mocks/petStore.yaml')
  const oas = await parse(petStorePath)

  test('generate schema for Pet', async () => {
    const generator = new SchemaGenerator(
      {
        dateType: 'string',
        include: undefined,
        transformers: {},
        unknownType: 'any',
        exclude: undefined,
        override: undefined,
        typed: false,
        templates: {
          operations: Operations.templates,
        },
        mapper: {},
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        contentType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Pet', schemas?.Pet as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate schema for Pet with dateType false', async () => {
    const generator = new SchemaGenerator(
      {
        dateType: false,
        include: undefined,
        transformers: {},
        unknownType: 'any',
        exclude: undefined,
        override: undefined,
        typed: false,
        templates: {
          operations: Operations.templates,
        },
        mapper: {},
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        contentType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Pet', schemas?.Pet as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate schema for Pets', async () => {
    const generator = new SchemaGenerator(
      {
        transformers: {},
        dateType: 'string',
        unknownType: 'any',
        exclude: undefined,
        override: undefined,
        typed: false,
        include: undefined,
        templates: {
          operations: Operations.templates,
        },
        mapper: {},
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        contentType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Pets', schemas?.Pets as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate schema for OptionalPet', async () => {
    const generator = new SchemaGenerator(
      {
        transformers: {},
        dateType: 'string',
        unknownType: 'any',
        exclude: undefined,
        override: undefined,
        typed: false,
        include: undefined,
        templates: {
          operations: Operations.templates,
        },
        mapper: {},
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        contentType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('OptionalPet', schemas?.OptionalPet as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate schema for OptionalPet typed', async () => {
    const generator = new SchemaGenerator(
      {
        transformers: {},
        typed: true,
        dateType: 'string',
        unknownType: 'any',
        exclude: undefined,
        override: undefined,
        include: undefined,
        templates: {
          operations: Operations.templates,
        },
        mapper: {},
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        contentType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('OptionalPet', schemas?.OptionalPet as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate schema for PetArray', async () => {
    const generator = new SchemaGenerator(
      {
        transformers: {},
        dateType: 'string',
        unknownType: 'any',
        exclude: undefined,
        override: undefined,
        typed: false,
        include: undefined,
        templates: {
          operations: Operations.templates,
        },
        mapper: {},
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        contentType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('PetArray', schemas?.PetArray as SchemaObject)

    expect(node).toMatchSnapshot()
  })
})

describe('ZodGenerator constCases', async () => {
  const discriminatorPath = path.resolve(__dirname, '../mocks/constCases.yaml')
  const oas = await parse(discriminatorPath)
  const generator = new SchemaGenerator(
    {
      transformers: {},
      dateType: 'string',
      unknownType: 'any',
      exclude: undefined,
      override: undefined,
      typed: false,
      include: undefined,
      templates: {
        operations: Operations.templates,
      },
      mapper: {},
    },
    {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
      mode: 'split',
      override: [],
    },
  )

  const schemas = oas.getDefinition().components?.schemas!

  test('UuidSchema generates a string with uuid format constraint', async () => {
    const schema = schemas['UuidSchema'] as SchemaObject
    const node = generator.buildSource('UuidSchema', schema)

    expect(node).toMatchSnapshot()
  })

  test('NullableString zodifies correctly', async () => {
    const schema = schemas?.['NullableString'] as SchemaObject
    const node = generator.buildSource('NullableString', schema)

    expect(node).toMatchSnapshot()
  })

  test('NullableStringWithAnyOf results in union of string and null', async () => {
    const schema = schemas['NullableStringWithAnyOf'] as SchemaObject
    const node = generator.buildSource('NullableStringWithAnyOf', schema)

    expect(node).toMatchSnapshot()
  })

  test('NullableStringUuid zodifies correctly to a uuid or null', async () => {
    const schema = schemas['NullableStringUuid'] as SchemaObject
    const node = generator.buildSource('NullableStringUuid', schema)

    expect(node).toMatchSnapshot()
  })

  test('NullConst zodifies correctly', async () => {
    const schema = schemas['NullConst'] as SchemaObject
    const node = generator.buildSource('NullConst', schema)

    expect(node).toMatchSnapshot()
  })

  test('StringValueConst correctly generates zod literal', async () => {
    const schema = schemas['StringValueConst'] as SchemaObject
    const node = generator.buildSource('StringValueConst', schema)

    expect(node).toMatchSnapshot()
  })

  test('NumberValueConst correctly generates zod literal', async () => {
    const schema = schemas['NumberValueConst'] as SchemaObject
    const node = generator.buildSource('NumberValueConst', schema)

    expect(node).toMatchSnapshot()
  })

  test('MixedValueTypeConst generates zod literal value correctly, overriding the type constraint', async () => {
    const schema = schemas['MixedValueTypeConst'] as SchemaObject
    const node = generator.buildSource('MixedValueTypeConst', schema)

    expect(node).toMatchSnapshot()
  })
})

describe('Zod SchemaGenerator lazy', async () => {
  const petStorePath = path.resolve(__dirname, '../mocks/lazy.yaml')
  const oas = await parse(petStorePath)

  test('generate schema for Example', async () => {
    const generator = new SchemaGenerator(
      {
        transformers: {},
        dateType: 'string',
        unknownType: 'any',
        exclude: undefined,
        override: undefined,
        typed: false,
        include: undefined,
        templates: {
          operations: Operations.templates,
        },
        mapper: {},
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        contentType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Example', schemas?.Example as SchemaObject)

    expect(node).toMatchSnapshot()
  })
})

describe('Zod SchemaGenerator enums', async () => {
  const schemaPath = path.resolve(__dirname, '../mocks/enums.yaml')
  const oas = await parse(schemaPath)
  const generator = new SchemaGenerator(
    {
      transformers: {},
      dateType: 'string',
      unknownType: 'any',
      exclude: undefined,
      override: undefined,
      typed: false,
      include: undefined,
      templates: {
        operations: Operations.templates,
      },
      mapper: {},
    },
    {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
      mode: 'split',
      override: [],
    },
  )

  const schemas = oas.getDefinition().components?.schemas

  test('generate x-enum-varnames types', async () => {
    const node = generator.buildSource('enumVarNames', schemas?.['enumVarNames.Type'] as SchemaObject)

    expect(node).toMatchSnapshot()
  })

  test('generate x-enumNames types', async () => {
    const node = generator.buildSource('enumNames', schemas?.['enumNames.Type'] as SchemaObject)

    expect(node).toMatchSnapshot()
  })
})

describe('Zod SchemaGenerator recursive', async () => {
  const petStorePath = path.resolve(__dirname, '../mocks/recursive.yaml')
  const oas = await parse(petStorePath)

  test('generate schema for Example', async () => {
    const generator = new SchemaGenerator(
      {
        transformers: {},
        dateType: 'string',
        unknownType: 'any',
        exclude: undefined,
        override: undefined,
        typed: false,
        include: undefined,
        templates: {
          operations: Operations.templates,
        },
        mapper: {},
      },
      {
        oas,
        pluginManager: mockedPluginManager,
        plugin: {} as Plugin<PluginOptions>,
        contentType: undefined,
        include: undefined,
        mode: 'split',
        override: [],
      },
    )

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.buildSource('Example', schemas?.Example as SchemaObject)

    expect(node).toMatchSnapshot()
  })
})

describe('Zod SchemaGenerator anyof', async () => {
  const discriminatorPath = path.resolve(__dirname, '../mocks/anyof.yaml')
  const oas = await parse(discriminatorPath)
  const generator = new SchemaGenerator(
    {
      transformers: {},
      dateType: 'string',
      unknownType: 'any',
      exclude: undefined,
      override: undefined,
      typed: false,
      include: undefined,
      templates: {
        operations: Operations.templates,
      },
      mapper: {},
    },
    {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
      mode: 'split',
      override: [],
    },
  )

  const schemas = oas.getDefinition().components?.schemas!

  test('anyof with 2 objects', async () => {
    const schema = schemas['test'] as SchemaObject
    const node = generator.buildSource('test', schema)

    expect(node).toMatchSnapshot()
  })
})

describe('Zod SchemaGenerator enums', async () => {
  const schemaPath = path.resolve(__dirname, '../mocks/enums3_1.yaml')
  const oas = await parse(schemaPath)
  const generator = new SchemaGenerator(
    {
      transformers: {},
      dateType: 'string',
      unknownType: 'any',
      exclude: undefined,
      override: undefined,
      typed: false,
      include: undefined,
      templates: {
        operations: Operations.templates,
      },
      mapper: {},
    },
    {
      oas,
      pluginManager: mockedPluginManager,
      plugin: {} as Plugin<PluginOptions>,
      contentType: undefined,
      include: undefined,
      mode: 'split',
      override: [],
    },
  )

  const schemas = oas.getDefinition().components?.schemas

  test('generate nullable 3.1 enums ', async () => {
    const node = generator.buildSource('enumNullable', schemas?.['enumNullable'] as SchemaObject)

    expect(node).toMatchSnapshot()
  })
})
