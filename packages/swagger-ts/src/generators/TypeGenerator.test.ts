import path from 'node:path'

import { print } from '@kubb/parser'
import { oasPathParser } from '@kubb/swagger'

import { format } from '../../mocks/format.ts'
import { TypeGenerator } from './TypeGenerator.ts'

import type { OpenAPIV3 } from '@kubb/swagger'

describe('TypeGenerator simple', () => {
  const petStorePath = path.resolve(__dirname, '../../mocks/petStore.yaml')

  test('generate type for Pet with optionalType `questionToken`', async () => {
    const oas = await oasPathParser(petStorePath)
    const generator = new TypeGenerator({
      usedEnumNames: {},
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
    const oas = await oasPathParser(petStorePath)
    const generator = new TypeGenerator({
      usedEnumNames: {},
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
    const oas = await oasPathParser(petStorePath)
    const generator = new TypeGenerator({
      usedEnumNames: {},
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
      usedEnumNames: {},
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
    const oas = await oasPathParser(petStorePath)
    const generator = new TypeGenerator({
      usedEnumNames: {},
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
})

describe('TypeGenerator with refs', () => {
  const petStoreRefPath = path.resolve(__dirname, '../../mocks/petStoreRef.yaml')

  test('generate type for Pets', async () => {
    const oas = await oasPathParser(petStoreRefPath)
    const generator = new TypeGenerator({
      usedEnumNames: {},
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
})
