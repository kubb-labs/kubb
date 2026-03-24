import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { isDiscriminator, isNullable, isOpenApiV2Document, isReference } from './guards.ts'
import type { SchemaObject } from './types.ts'

describe('isOpenApiV2Document', () => {
  it('returns true for a Swagger 2.0 document', () => {
    const doc = { swagger: '2.0', info: { title: '', version: '' }, paths: {} }

    expect(isOpenApiV2Document(doc)).toBe(true)
    if (isOpenApiV2Document(doc)) {
      expectTypeOf(doc).toEqualTypeOf<OpenAPIV2.Document>()
    }
  })

  it('returns false for an OpenAPI 3 document', () => {
    expect(isOpenApiV2Document({ openapi: '3.0.0', info: { title: '', version: '' }, paths: {} })).toBe(false)
  })

  it('returns false for null / non-objects', () => {
    expect(isOpenApiV2Document(null)).toBe(false)
    expect(isOpenApiV2Document('string')).toBe(false)
  })
})

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
      expectTypeOf(ref).toEqualTypeOf<OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject>()
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
    const schema = { discriminator: { propertyName: 'type', mapping: { Cat: '#/components/schemas/Cat' } } }
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
