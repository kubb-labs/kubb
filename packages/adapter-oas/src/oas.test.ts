import { describe, expect, expectTypeOf, it } from 'vitest'
import { getBinaryFallbackSchema, isDiscriminator, isNullable } from './oas.ts'
import type { SchemaObject } from './types.ts'

describe('isNullable', () => {
  it('returns true for nullable: true (OAS 3.0)', () => {
    expect(isNullable({ nullable: true } as SchemaObject)).toBe(true)
  })

  it('returns true for x-nullable: true (vendor extension)', () => {
    expect(isNullable({ 'x-nullable': true } as SchemaObject)).toBe(true)
  })

  it('returns true for type: "null"', () => {
    expect(isNullable({ type: 'null' } as SchemaObject)).toBe(true)
  })

  it('returns true for type array containing "null" (OAS 3.1)', () => {
    expect(isNullable({ type: ['string', 'null'] } as SchemaObject)).toBe(true)
  })

  it('returns false for a plain non-nullable schema', () => {
    expect(isNullable({ type: 'string' } as SchemaObject)).toBe(false)
  })
})

describe('isDiscriminator', () => {
  it('returns true for a schema with a discriminator object', () => {
    const schema = {
      discriminator: {
        propertyName: 'type',
        mapping: { Cat: '#/components/schemas/Cat' },
      },
    }
    expect(isDiscriminator(schema)).toBe(true)

    if (isDiscriminator(schema)) {
      expectTypeOf(schema.discriminator.propertyName).toEqualTypeOf<string>()
    }
  })

  it('returns false for a Swagger 2 string-form discriminator', () => {
    expect(isDiscriminator({ discriminator: 'type' })).toBe(false)
  })
})

describe('getBinaryFallbackSchema', () => {
  it('returns the binary schema for a non-JSON entry the 3.1 upgrade emptied out', () => {
    expect(getBinaryFallbackSchema('application/octet-stream', undefined)).toEqual({
      type: 'string',
      contentMediaType: 'application/octet-stream',
    })
    expect(getBinaryFallbackSchema('application/octet-stream', {})).toEqual({
      type: 'string',
      contentMediaType: 'application/octet-stream',
    })
    expect(getBinaryFallbackSchema('application/pdf', {})).toEqual({
      type: 'string',
      contentMediaType: 'application/octet-stream',
    })
  })

  it('returns undefined when the entry carries a schema of its own', () => {
    expect(getBinaryFallbackSchema('application/octet-stream', { type: 'object' })).toBeUndefined()
    expect(getBinaryFallbackSchema('application/octet-stream', { $ref: '#/components/schemas/Pet' })).toBeUndefined()
    expect(getBinaryFallbackSchema('application/pdf', { type: 'object' })).toBeUndefined()
  })

  it('returns undefined for a JSON-like media type or a missing one', () => {
    expect(getBinaryFallbackSchema('application/json', undefined)).toBeUndefined()
    expect(getBinaryFallbackSchema('application/vnd.api+json', {})).toBeUndefined()
    expect(getBinaryFallbackSchema(undefined, undefined)).toBeUndefined()
  })
})
