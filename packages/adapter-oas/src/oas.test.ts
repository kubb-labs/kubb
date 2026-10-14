import { describe, expect, it } from 'vitest'
import { getBinaryFallbackSchema, isDiscriminator } from './oas.ts'
import type { SchemaObject } from './types.ts'

describe('isDiscriminator', () => {
  it.each([
    {
      title: 'true for a discriminator object',
      schema: { discriminator: { propertyName: 'type', mapping: { Cat: '#/components/schemas/Cat' } } },
      expected: true,
    },
    { title: 'false for a Swagger 2 string-form discriminator', schema: { discriminator: 'type' }, expected: false },
  ])('returns $title', ({ schema, expected }) => {
    expect(isDiscriminator(schema)).toBe(expected)
  })
})

describe('getBinaryFallbackSchema', () => {
  const binary = { type: 'string', contentMediaType: 'application/octet-stream' }

  it.each([
    { title: 'the binary schema for an octet-stream entry without a schema', contentType: 'application/octet-stream', schema: undefined, expected: binary },
    { title: 'the binary schema for an octet-stream entry the 3.1 upgrade emptied out', contentType: 'application/octet-stream', schema: {}, expected: binary },
    { title: 'the binary schema for another non-JSON media type', contentType: 'application/pdf', schema: {}, expected: binary },
    { title: 'undefined when the entry carries a schema of its own', contentType: 'application/octet-stream', schema: { type: 'object' }, expected: undefined },
    {
      title: 'undefined when the entry carries a $ref',
      contentType: 'application/octet-stream',
      schema: { $ref: '#/components/schemas/Pet' },
      expected: undefined,
    },
    { title: 'undefined for a JSON media type', contentType: 'application/json', schema: undefined, expected: undefined },
    { title: 'undefined for a JSON-like media type', contentType: 'application/vnd.api+json', schema: {}, expected: undefined },
    { title: 'undefined for a missing media type', contentType: undefined, schema: undefined, expected: undefined },
  ])('returns $title', ({ contentType, schema, expected }) => {
    expect(getBinaryFallbackSchema(contentType, schema as SchemaObject | undefined)).toEqual(expected)
  })
})
