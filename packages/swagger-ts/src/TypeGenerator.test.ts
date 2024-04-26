import path from 'node:path'

import { mockedPluginManager } from '@kubb/core/mocks'
import { print } from '@kubb/parser'
import { OasManager } from '@kubb/swagger'

import { format } from '../mocks/format.ts'
import { TypeGenerator } from './TypeGenerator.ts'

import type { PluginManager } from '@kubb/core'
import type { Oas, OasTypes } from '@kubb/swagger/oas'

describe('TypeGenerator petStore', async () => {
  const petStorePath = path.resolve(__dirname, '../mocks/petStore.yaml')
  const oas = await new OasManager().parse(petStorePath)

  test('generate type for Pet with optionalType `questionToken`', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pet as OasTypes.SchemaObject, baseName: 'Pet' })

    const output = print(node, undefined)

    expect(output).toBeDefined()

    expect(await format(output)).toMatchSnapshot()
  })

  test('generate type for Pet with optionalType `undefined`', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'undefined',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pet as OasTypes.SchemaObject, baseName: 'Pet' })

    const output = print(node, undefined)

    expect(output).toBeDefined()

    expect(await format(output)).toMatchSnapshot()
  })

  test('generate type for Pet with optionalType `questionTokenAndUndefined`', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionTokenAndUndefined',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pet as OasTypes.SchemaObject, baseName: 'Pet' })

    const output = print(node, undefined)

    expect(output).toBeDefined()

    expect(await format(output)).toMatchSnapshot()
  })

  test('generate type for nullable fields', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas: {} as Oas,
      pluginManager: { resolveName: ({ name }) => name, resolvePath: ({ baseName }) => baseName } as PluginManager,
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

    const node = generator.build({ schema, baseName: 'Test' })
    const output = print(node, undefined)
    expect(await format(output)).toMatchSnapshot()
  })

  test('generate type for Pets', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pets as OasTypes.SchemaObject, baseName: 'Pets' })

    const output = print(node, undefined)

    expect(output).toBeDefined()
    expect(await format(output)).toMatchSnapshot()
  })
})

describe('TypeGenerator petStoreRef', async () => {
  const petStoreRefPath = path.resolve(__dirname, '../mocks/petStoreRef.yaml')
  const oas = await new OasManager().parse(petStoreRefPath)

  test('generate type for Pets', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pets as OasTypes.SchemaObject, baseName: 'Pets' })

    const output = print(node, undefined)

    expect(output).toBeDefined()
    expect(await format(output)).toMatchSnapshot()
  })
})

describe('TypeGenerator discriminator', async () => {
  const discriminatorPath = path.resolve(__dirname, '../mocks/discriminator.yaml')
  const oas = await new OasManager().parse(discriminatorPath)

  test('PetStore defined as array with type union', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Petstore as OasTypes.SchemaObject, baseName: 'Petstore' })

    const output = print(node, undefined)

    expect(output).toBeDefined()
    expect(output).toMatchSnapshot()
  })

  test('Cat.type defined as const', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })

    const schemas = oas.getDefinition().components?.schemas
    const cat = generator.build({ schema: schemas?.Cat as OasTypes.SchemaObject, baseName: 'Cat' })

    const cat_output = print(cat, undefined)
    expect(cat_output).toBeDefined()
    expect(cat_output).toMatchSnapshot()
  })

  test('Dog.type defined as const', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })

    const schemas = oas.getDefinition().components?.schemas
    const dog = generator.build({ schema: schemas?.Dog as OasTypes.SchemaObject, baseName: 'Dog' })

    const dog_output = print(dog, undefined)
    expect(dog_output).toBeDefined()
    expect(dog_output).toMatchSnapshot()
  })

  test('NullConst correctly produces "null"', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })
    const schemas = oas.getDefinition().components?.schemas
    const ast = generator.build({ schema: schemas?.NullConst as OasTypes.SchemaObject, baseName: 'NullConst' })

    const ast_output = print(ast, undefined)
    expect(ast_output).toBeDefined()
    expect(ast_output).toMatchSnapshot()
  })

  test('StringValueConst const correctly produces "foobar"', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })

    const schemas = oas.getDefinition().components?.schemas
    const ast = generator.build({ schema: schemas?.StringValueConst as OasTypes.SchemaObject, baseName: 'StringValueConst' })

    const ast_output = print(ast, undefined)
    expect(ast_output).toBeDefined()
    expect(ast_output).toMatchSnapshot()
  })

  test('NumberValueConst const correctly produces `42`', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })

    const schemas = oas.getDefinition().components?.schemas
    const ast = generator.build({ schema: schemas?.NumberValueConst as OasTypes.SchemaObject, baseName: 'NumberValueConst' })

    const ast_output = print(ast, undefined)
    expect(ast_output).toBeDefined()
    expect(ast_output).toMatchSnapshot()
  })

  test('MixedValueTypeConst ignores type constraint in favor of const constraint', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })

    const schemas = oas.getDefinition().components?.schemas
    const ast = generator.build({ schema: schemas?.MixedValueTypeConst as OasTypes.SchemaObject, baseName: 'MixedValueTypeConst' })

    const ast_output = print(ast, undefined)

    expect(ast_output).toBeDefined()
    expect(ast_output).toMatchSnapshot()
  })
})

describe('TypeGenerator enums', async () => {
  const schemaPath = path.resolve(__dirname, '../mocks/enums.yaml')
  const oas = await new OasManager().parse(schemaPath)
  const defaultGenerator = new TypeGenerator({
    usedEnumNames: {},
    enumType: 'asConst',
    dateType: 'string',
    optionalType: 'questionToken',
    transformers: {},
    oasType: false,
    unknownType: 'any',
  }, {
    oas,
    pluginManager: mockedPluginManager,
  })

  const schemas = oas.getDefinition().components?.schemas

  test('generate x-enum-varnames types', async () => {
    const node = defaultGenerator.build({ schema: schemas?.['enumVarNames.Type'] as OasTypes.SchemaObject, baseName: 'enumVarNames' })

    const output = print(node, undefined)

    expect(output).toBeDefined()

    expect(await format(output)).toMatchSnapshot()
  })

  test('generate x-enumNames types', async () => {
    const node = defaultGenerator.build({ schema: schemas?.['enumNames.Type'] as OasTypes.SchemaObject, baseName: 'enumNames' })

    const output = print(node, undefined)

    expect(output).toBeDefined()

    expect(await format(output)).toMatchSnapshot()
  })

  test('generate with enumtype enum', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'enum',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })

    const node = generator.build({ schema: schemas?.['enumNames.Type'] as OasTypes.SchemaObject, baseName: 'enumNames' })

    const output = print(node, undefined)

    expect(output).toBeDefined()

    expect(await format(output)).toMatchSnapshot()
  })

  test('generate with enumtype asPascalConst', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'asPascalConst',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })

    const node = generator.build({ schema: schemas?.['enumNames.Type'] as OasTypes.SchemaObject, baseName: 'enumNames' })

    const output = print(node, undefined)

    expect(output).toBeDefined()

    expect(await format(output)).toMatchSnapshot()
  })

  test('generate with enumtype constEnum', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'constEnum',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })

    const node = generator.build({ schema: schemas?.['enumNames.Type'] as OasTypes.SchemaObject, baseName: 'enumNames' })

    const output = print(node, undefined)

    expect(output).toBeDefined()

    expect(await format(output)).toMatchSnapshot()
  })

  test('generate with enumtype literal', async () => {
    const generator = new TypeGenerator({
      usedEnumNames: {},
      enumType: 'literal',
      dateType: 'string',
      optionalType: 'questionToken',
      transformers: {},
      oasType: false,
      unknownType: 'any',
    }, {
      oas,
      pluginManager: mockedPluginManager,
    })

    const node = generator.build({ schema: schemas?.['enumNames.Type'] as OasTypes.SchemaObject, baseName: 'enumNames' })

    const output = print(node, undefined)

    expect(output).toBeDefined()

    expect(await format(output)).toMatchSnapshot()
  })
})

describe('TypeGenerator type assertions', async () => {
  const schemaPath = path.resolve(__dirname, '../mocks/type_assertions.yaml')
  const oas = await new OasManager().parse(schemaPath)
  const generator = new TypeGenerator({
    usedEnumNames: {},
    enumType: 'asConst',
    dateType: 'string',
    optionalType: 'questionToken',
    transformers: {},
    oasType: false,
  }, {
    oas,
    pluginManager: mockedPluginManager,
  })

  const schemas = oas.getDefinition().components?.schemas

  test('generates file property with `File` type', async () => {
    const node = generator.build({ schema: schemas?.Body_upload_file_api_assets_post as OasTypes.SchemaObject, baseName: 'Body_upload_file_api_assets_post' })

    const output = print(node, undefined)

    expect(output).toBeDefined()
    expect(output).toMatchSnapshot()
  })

  test('generates Plain_File types correctly', async () => {
    const node = generator.build({ schema: schemas?.Plain_file as OasTypes.SchemaObject, baseName: 'Plain_file' })

    const output = print(node, undefined)

    expect(output).toBeDefined()
    expect(output).toMatchSnapshot()
  })

  test('generates Date type correctly', async () => {
    const node = generator.build({ schema: schemas?.Plain_date as OasTypes.SchemaObject, baseName: 'Plain_date' })

    const output = print(node, undefined)

    expect(output).toBeDefined()
    expect(output).toMatchSnapshot()
  })

  test('generates Time type correctly', async () => {
    const node = generator.build({ schema: schemas?.Plain_time as OasTypes.SchemaObject, baseName: 'Plain_time' })

    const output = print(node, undefined)

    expect(output).toBeDefined()
    expect(output).toMatchSnapshot()
  })

  test('generates Email type correctly', async () => {
    const node = generator.build({ schema: schemas?.Plain_email as OasTypes.SchemaObject, baseName: 'Plain_email' })

    const output = print(node, undefined)

    expect(output).toBeDefined()
    expect(output).toMatchSnapshot()
  })

  test('generates UUID type correctly', async () => {
    const node = generator.build({ schema: schemas?.Plain_uuid as OasTypes.SchemaObject, baseName: 'Plain_uuid' })

    const output = print(node, undefined)

    expect(output).toBeDefined()
    expect(output).toMatchSnapshot()
  })
})
