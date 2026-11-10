import { describe, expect, it } from 'vitest'
import { getBinaryFallbackSchema, isDiscriminator, isJsonMimeType } from './oas.ts'
import type { SchemaObject } from './types.ts'

describe('isDiscriminator', () => {
  it.each([{ title: 'false for a Swagger 2 string-form discriminator', schema: { discriminator: 'type' }, expected: false }])(
    'returns $title',
    ({ schema, expected }) => {
      expect(isDiscriminator(schema)).toBe(expected)
    },
  )
})

describe('isJsonMimeType', () => {
  it('matches a JSON media type regardless of case', () => {
    expect(isJsonMimeType('application/JSON')).toBe(true)
    expect(isJsonMimeType('text/plain')).toBe(false)
  })
})

describe('getBinaryFallbackSchema', () => {
  const binary = { type: 'string', contentMediaType: 'application/octet-stream' }

  it.each([
    { title: 'the binary schema for an octet-stream entry without a schema', contentType: 'application/octet-stream', schema: undefined, expected: binary },
    {
      title: 'undefined when the entry carries a $ref',
      contentType: 'application/octet-stream',
      schema: { $ref: '#/components/schemas/Pet' },
      expected: undefined,
    },
    {
      title: 'the binary schema with the annotations the upgrade kept',
      contentType: 'application/octet-stream',
      schema: { description: 'The asset' },
      expected: { ...binary, description: 'The asset' },
    },
    { title: 'undefined when the entry declares a type', contentType: 'text/plain', schema: { type: 'string', description: 'Text' }, expected: undefined },
    { title: 'undefined for a JSON media type', contentType: 'application/json', schema: undefined, expected: undefined },
    { title: 'undefined for a JSON-like media type', contentType: 'application/vnd.api+json', schema: {}, expected: undefined },
    { title: 'undefined for a missing media type', contentType: undefined, schema: undefined, expected: undefined },
  ])('returns $title', ({ contentType, schema, expected }) => {
    expect(getBinaryFallbackSchema(contentType, schema as SchemaObject | undefined)).toEqual(expected)
  })
})
