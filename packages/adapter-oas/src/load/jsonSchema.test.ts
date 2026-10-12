import { describe, expect, it } from 'vitest'
import { isJsonSchemaDocument, wrapJsonSchema } from './jsonSchema.ts'

describe('isJsonSchemaDocument', () => {
  it.each([
    { title: 'a schema with $schema', document: { $schema: 'https://json-schema.org/draft/2020-12/schema' }, expected: true },
    { title: 'a schema with only $defs', document: { $defs: {} }, expected: true },
    { title: 'a schema with only a type', document: { type: 'object' }, expected: true },
    { title: 'a schema with only an enum', document: { enum: ['a', 'b'] }, expected: true },
    { title: 'an OpenAPI document', document: { openapi: '3.1.0', info: {}, paths: {} }, expected: false },
    { title: 'a Swagger document', document: { swagger: '2.0', info: {}, paths: {} }, expected: false },
    { title: 'an object without schema keywords', document: { path: './openapi.yaml' }, expected: false },
    { title: 'an array', document: [], expected: false },
  ])('returns $expected for $title', ({ document, expected }) => {
    expect(isJsonSchemaDocument(document)).toBe(expected)
  })
})

describe('wrapJsonSchema', () => {
  it('moves the root and its $defs into components.schemas and rewrites local refs', () => {
    const document = wrapJsonSchema({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://kubb.dev/schemas/options.json',
      title: 'Options',
      type: 'object',
      properties: {
        output: { $ref: '#/$defs/Output' },
        legacy: { $ref: '#/definitions/Legacy' },
        children: { type: 'array', items: { $ref: '#' } },
        external: { $ref: './shared.schema.yaml#/$defs/Output' },
      },
      $defs: { Output: { type: 'object' } },
      definitions: { Legacy: { type: 'string' } },
    })

    expect(document).toStrictEqual({
      openapi: '3.1.0',
      info: { title: 'Options', version: '0.0.0' },
      paths: {},
      components: {
        schemas: {
          Legacy: { type: 'string' },
          Output: { type: 'object' },
          Options: {
            title: 'Options',
            type: 'object',
            properties: {
              output: { $ref: '#/components/schemas/Output' },
              legacy: { $ref: '#/components/schemas/Legacy' },
              children: { type: 'array', items: { $ref: '#/components/schemas/Options' } },
              external: { $ref: './shared.schema.yaml#/$defs/Output' },
            },
          },
        },
      },
    })
  })

  it('rewrites refs into the root schema under its component', () => {
    const document = wrapJsonSchema({ title: 'Pet', type: 'object', properties: { id: { type: 'string' }, parentId: { $ref: '#/properties/id' } } })

    expect(document.components?.schemas?.['Pet']).toMatchObject({ properties: { parentId: { $ref: '#/components/schemas/Pet/properties/id' } } })
  })

  it('strips characters a component key cannot hold from the title', () => {
    expect(Object.keys(wrapJsonSchema({ title: 'Pet / Details', type: 'object' }).components?.schemas ?? {})).toStrictEqual(['PetDetails'])
  })

  it('keeps a definition that shares the root title', () => {
    const document = wrapJsonSchema({
      title: 'Options',
      type: 'object',
      properties: { nested: { $ref: '#/$defs/Options' } },
      $defs: { Options: { type: 'string' } },
    })

    expect(document.components?.schemas).toStrictEqual({
      Options: { type: 'string' },
      OptionsSchema: { title: 'Options', type: 'object', properties: { nested: { $ref: '#/components/schemas/Options' } } },
    })
  })

  it('names an untitled root Schema', () => {
    expect(Object.keys(wrapJsonSchema({ type: 'string' }).components?.schemas ?? {})).toStrictEqual(['Schema'])
  })
})
