import { describe, expect, it } from 'vitest'
import { isJsonSchemaDocument, wrapJsonSchema } from './jsonSchema.ts'

describe('isJsonSchemaDocument', () => {
  it.each([
    { title: 'a schema with $schema', document: { $schema: 'https://json-schema.org/draft/2020-12/schema' }, expected: true },
    { title: 'a schema with only $defs', document: { $defs: {} }, expected: true },
    { title: 'a schema with only a type', document: { type: 'object' }, expected: true },
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

  it('names an untitled root Schema', () => {
    expect(Object.keys(wrapJsonSchema({ type: 'string' }).components?.schemas ?? {})).toStrictEqual(['Schema'])
  })
})
