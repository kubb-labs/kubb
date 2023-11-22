import path from 'node:path'

import { print } from '@kubb/parser'
import { OasManager } from '@kubb/swagger'

import { format } from '../../mocks/format.ts'
import { TypeGenerator } from './TypeGenerator.ts'

import type { Oas, OasTypes } from '@kubb/swagger'

describe('TypeGenerator simple', () => {
  const petStorePath = path.resolve(__dirname, '../../mocks/petStore.yaml')

  test('generate type for Pet with optionalType `questionToken`', async () => {
    const oas = await new OasManager().parse(petStorePath)
    const generator = new TypeGenerator({
      usedEnumNames: {},
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      oas: {} as Oas,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pet as OasTypes.SchemaObject, baseName: 'Pet' })

    const output = print(node, undefined)

    expect(output).toBeDefined()

    expect(await format(output)).toMatchSnapshot()
  })

  test('generate type for Pet with optionalType `undefined`', async () => {
    const oas = await new OasManager().parse(petStorePath)
    const generator = new TypeGenerator({
      usedEnumNames: {},
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'undefined',
      oas: {} as Oas,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pet as OasTypes.SchemaObject, baseName: 'Pet' })

    const output = print(node, undefined)

    expect(output).toBeDefined()

    expect(await format(output)).toMatchSnapshot()
  })

  test('generate type for Pet with optionalType `questionTokenAndUndefined`', async () => {
    const oas = await new OasManager().parse(petStorePath)
    const generator = new TypeGenerator({
      usedEnumNames: {},
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionTokenAndUndefined',
      oas: {} as Oas,
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
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      oas: {} as Oas,
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
    const oas = await new OasManager().parse(petStorePath)
    const generator = new TypeGenerator({
      usedEnumNames: {},
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      oas: {} as Oas,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pets as OasTypes.SchemaObject, baseName: 'Pets' })

    const output = print(node, undefined)

    expect(output).toBeDefined()
    expect(await format(output)).toMatchSnapshot()
  })
})

describe('TypeGenerator with refs', () => {
  const petStoreRefPath = path.resolve(__dirname, '../../mocks/petStoreRef.yaml')

  test('generate type for Pets', async () => {
    const oas = await new OasManager().parse(petStoreRefPath)
    const generator = new TypeGenerator({
      usedEnumNames: {},
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      oas: {} as Oas,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pets as OasTypes.SchemaObject, baseName: 'Pets' })

    const output = print(node, undefined)

    expect(output).toBeDefined()
    expect(await format(output)).toMatchSnapshot()
  })
})

describe('TypeGenerator with discriminators', () => {
  const discriminatorPath = path.resolve(__dirname, '../../mocks/discriminator.yaml')

  test('PetStore defined as array with type union', async () => {
    const oas = await new OasManager().parse(discriminatorPath)

    const generator = new TypeGenerator({
      usedEnumNames: {},
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      oas: {} as Oas,
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Petstore as OasTypes.SchemaObject, baseName: 'Petstore' })

    const output = print(node, undefined)

    expect(output).toBeDefined()
    expect(output).toMatchSnapshot()
  })

  test('Cat.type defined as const', async () => {
    const oas = await new OasManager().parse(discriminatorPath)
    const generator = new TypeGenerator({
      usedEnumNames: {},
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      oas: { api: { openapi: '3.1' } } as Oas,
    })

    const schemas = oas.getDefinition().components?.schemas
    const cat = generator.build({ schema: schemas?.Cat as OasTypes.SchemaObject, baseName: 'Cat' })

    const cat_output = print(cat, undefined)
    expect(cat_output).toBeDefined()
    expect(cat_output).toMatchSnapshot()
  })

  test('Dog.type defined as const', async () => {
    const oas = await new OasManager().parse(discriminatorPath)
    const generator = new TypeGenerator({
      usedEnumNames: {},
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
      oas: { api: { openapi: '3.1' } } as Oas,
    })

    const schemas = oas.getDefinition().components?.schemas
    const dog = generator.build({ schema: schemas?.Dog as OasTypes.SchemaObject, baseName: 'Dog' })

    const dog_output = print(dog, undefined)
    expect(dog_output).toBeDefined()
    expect(dog_output).toMatchSnapshot()
  })
})
