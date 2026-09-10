import { describe, expect, expectTypeOf, it } from 'vitest'
import { getBinaryFallbackSchema, isDiscriminator, isNullable, isReference } from './oas.ts'
import type { ReferenceObject, SchemaObject } from './types.ts'

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

  it('returns false for undefined', () => {
    expect(isNullable(undefined)).toBe(false)
  })
})

describe('isReference', () => {
  it('returns true for a $ref object', () => {
    const ref = { $ref: '#/components/schemas/Pet' }
    expect(isReference(ref)).toBe(true)

    if (isReference(ref)) {
      expectTypeOf(ref).toEqualTypeOf<ReferenceObject>()
    }
  })

  it('returns false for a plain schema object', () => {
    expect(isReference({ type: 'string' })).toBe(false)
  })

  it('returns false for null / undefined', () => {
    expect(isReference(null)).toBe(false)
    expect(isReference(undefined)).toBe(false)
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

  it('returns false when discriminator is absent', () => {
    expect(isDiscriminator({ type: 'object' })).toBe(false)
  })

  it('returns false for null / undefined', () => {
    expect(isDiscriminator(null)).toBe(false)
    expect(isDiscriminator(undefined)).toBe(false)
  })
})

describe('getBinaryFallbackSchema', () => {
  it('returns the binary schema for an octet-stream entry the 3.1 upgrade emptied out', () => {
    expect(getBinaryFallbackSchema('application/octet-stream', undefined)).toEqual({
      type: 'string',
      contentMediaType: 'application/octet-stream',
    })
    expect(getBinaryFallbackSchema('application/octet-stream', {})).toEqual({
      type: 'string',
      contentMediaType: 'application/octet-stream',
    })
  })

  it('returns undefined when the octet-stream entry carries a schema of its own', () => {
    expect(getBinaryFallbackSchema('application/octet-stream', { type: 'object' })).toBeUndefined()
    expect(getBinaryFallbackSchema('application/octet-stream', { $ref: '#/components/schemas/Pet' })).toBeUndefined()
  })

  it('returns undefined for any other media type', () => {
    expect(getBinaryFallbackSchema('application/json', undefined)).toBeUndefined()
    expect(getBinaryFallbackSchema('application/pdf', {})).toBeUndefined()
    expect(getBinaryFallbackSchema(undefined, undefined)).toBeUndefined()
  })
})
