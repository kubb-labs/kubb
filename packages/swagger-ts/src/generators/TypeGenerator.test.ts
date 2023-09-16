import pathParser from 'node:path'

import { oasPathParser } from '@kubb/swagger'
import { print } from '@kubb/ts-codegen'

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
