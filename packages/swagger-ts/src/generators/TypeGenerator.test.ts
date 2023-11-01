import pathParser from 'node:path'

import { print } from '@kubb/parser'
import { oasPathParser } from '@kubb/swagger'

import { format } from '../../mocks/format.ts'
import { TypeGenerator } from './TypeGenerator.ts'

import type { OpenAPIV3 } from '@kubb/swagger'

describe('TypeGenerator simple', () => {
  const path = pathParser.resolve(__dirname, '../../mocks/petStore.yaml')

  test('generate type for Pet with optionalType `questionToken`', async () => {
    const oas = await oasPathParser(path)
    const generator = new TypeGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pet as OpenAPIV3.SchemaObject, baseName: 'Pet' })

    const output = print(node, undefined)

    expect(output).toBeDefined()

    expect(await format(output)).toMatch(
      await format(`
      export type Pet = {
        id: number
        name: string
        tag?: string
      }
    `),
    )
  })

  test('generate type for Pet with optionalType `undefined`', async () => {
    const oas = await oasPathParser(path)
    const generator = new TypeGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'undefined',
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pet as OpenAPIV3.SchemaObject, baseName: 'Pet' })

    const output = print(node, undefined)

    expect(output).toBeDefined()

    expect(await format(output)).toMatch(
      await format(`
      export type Pet = {
        id: number
        name: string
        tag: string | undefined
      }
    `),
    )
  })

  test('generate type for Pet with optionalType `questionTokenAndUndefined`', async () => {
    const oas = await oasPathParser(path)
    const generator = new TypeGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionTokenAndUndefined',
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pet as OpenAPIV3.SchemaObject, baseName: 'Pet' })

    const output = print(node, undefined)

    expect(output).toBeDefined()

    expect(await format(output)).toMatch(
      await format(`
      export type Pet = {
        id: number
        name: string
        tag?: string | undefined
      }
    `),
    )
  })

  test('generate type for nullable fields', async () => {
    const generator = new TypeGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
    })

    const schema: OpenAPIV3.SchemaObject = {
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
    expect(await format(output)).toMatch(
      await format(`
      export type Test = {
        foo?: string | null
      }
    `),
    )
  })

  test('generate type for Pets', async () => {
    const oas = await oasPathParser(path)
    const generator = new TypeGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pets as OpenAPIV3.SchemaObject, baseName: 'Pets' })

    const output = print(node, undefined)

    expect(output).toBeDefined()
    expect(await format(output)).toMatch(
      await format(`
      export type Pets = {
        id: number
        name: string
        tag?: string
      }[]
    `),
    )
  })
  test.todo('generate type for Pets and Pet')
})

describe('TypeGenerator with refs', () => {
  const path = pathParser.resolve(__dirname, '../../mocks/petStoreRef.yaml')

  test('generate type for Pets', async () => {
    const oas = await oasPathParser(path)
    const generator = new TypeGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Pets as OpenAPIV3.SchemaObject, baseName: 'Pets' })

    const output = print(node, undefined)

    expect(output).toBeDefined()
    expect(await format(output)).toMatch(
      await format(`
      export type Pets = Pet[]
    `),
    )
  })

  test.todo('generate type for Pets and Pet')
})

describe('TypeGenerator with discriminators', () => {
  const path = pathParser.resolve(__dirname, '../../mocks/discriminator.yaml')

  test('PetStore defined as array with type union', async () => {
    const oas = await oasPathParser(path)
    const generator = new TypeGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
    })

    const schemas = oas.getDefinition().components?.schemas
    const node = generator.build({ schema: schemas?.Petstore as OpenAPIV3.SchemaObject, baseName: 'Petstore' })

    const output = print(node, undefined)

    expect(output).toBeDefined()
    expect(output).toMatchSnapshot()
  })

  test('Cat.type defined as const', async () => {
    const oas = await oasPathParser(path)
    const generator = new TypeGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
    })

    const schemas = oas.getDefinition().components?.schemas
    const cat = generator.build({ schema: schemas?.Cat as OpenAPIV3.SchemaObject, baseName: 'Cat' })

    const cat_output = print(cat, undefined)
    expect(cat_output).toBeDefined()
    expect(cat_output).toMatchSnapshot()
  })

  test('Dog.type defined as const', async () => {
    const oas = await oasPathParser(path)
    const generator = new TypeGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
      enumType: 'asConst',
      dateType: 'string',
      optionalType: 'questionToken',
    })

    const schemas = oas.getDefinition().components?.schemas
    const dog = generator.build({ schema: schemas?.Dog as OpenAPIV3.SchemaObject, baseName: 'Dog' })

    const dog_output = print(dog, undefined)
    expect(dog_output).toBeDefined()
    expect(dog_output).toMatchSnapshot()
  })

    test('NullConst correctly produces "null"', async () => {
      const oas = await oasPathParser(path)
      const generator = new TypeGenerator({
        withJSDocs: false,
        resolveName: ({ name }) => name,
        enumType: 'asConst',
        dateType: 'string',
        optionalType: 'questionToken',
      })

      const schemas = oas.getDefinition().components?.schemas
      const ast = generator.build({ schema: schemas?.NullConst as OpenAPIV3.SchemaObject, baseName: 'NullConst' })

      const ast_output = print(ast, undefined)
      expect(ast_output).toBeDefined()
      expect(ast_output).toMatchSnapshot()
    })

    test('StringValueConst const correctly produces "foobar"', async () => {
      const oas = await oasPathParser(path)
      const generator = new TypeGenerator({
        withJSDocs: false,
        resolveName: ({ name }) => name,
        enumType: 'asConst',
        dateType: 'string',
        optionalType: 'questionToken',
      })

      const schemas = oas.getDefinition().components?.schemas
      const ast = generator.build({ schema: schemas?.StringValueConst as OpenAPIV3.SchemaObject, baseName: 'StringValueConst' })

      const ast_output = print(ast, undefined)
      expect(ast_output).toBeDefined()
      expect(ast_output).toMatchSnapshot()
    })

    test('NumberValueConst const correctly produces `42`', async () => {
      const oas = await oasPathParser(path)
      const generator = new TypeGenerator({
        withJSDocs: false,
        resolveName: ({ name }) => name,
        enumType: 'asConst',
        dateType: 'string',
        optionalType: 'questionToken',
      })

      const schemas = oas.getDefinition().components?.schemas
      const ast = generator.build({ schema: schemas?.NumberValueConst as OpenAPIV3.SchemaObject, baseName: 'NumberValueConst' })

      const ast_output = print(ast, undefined)
      expect(ast_output).toBeDefined()
      expect(ast_output).toMatchSnapshot()
    })

    test('MixedValueTypeConst correctly throws error', async () => {
      const oas = await oasPathParser(path)
      const generator = new TypeGenerator({
        withJSDocs: false,
        resolveName: ({ name }) => name,
        enumType: 'asConst',
        dateType: 'string',
        optionalType: 'questionToken',
      })

      const schemas = oas.getDefinition().components?.schemas
      const ast = generator.build({ schema: schemas?.MixedValueTypeConst as OpenAPIV3.SchemaObject, baseName: 'MixedValueTypeConst' })

      // const ast_output = print(ast, undefined)
      expect(generator).toThrow("TODO Decide on expected behaviour.")

      // expect(ast_output).toBeDefined()
      // expect(ast_output).toMatchSnapshot()
    })
})
