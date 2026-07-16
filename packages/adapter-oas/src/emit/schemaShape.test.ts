import { describe, expect, it } from 'vitest'
import { DEFAULT_PARSER_OPTIONS } from '../constants.ts'
import { flattenSchema, getDateType, getPrimitiveType, getSchemaType } from './schemaShape.ts'

describe('getSchemaType', () => {
  it('returns the SchemaType for a known format', () => {
    expect(getSchemaType('uuid')).toBe('uuid')
    expect(getSchemaType('uri')).toBe('url')
    expect(getSchemaType('email')).toBe('email')
  })

  it('returns null for an unknown format', () => {
    expect(getSchemaType('int64')).toBeNull()
    expect(getSchemaType('date-time')).toBeNull()
    expect(getSchemaType('not-a-format')).toBeNull()
  })
})

describe('getPrimitiveType', () => {
  it('returns numeric types unchanged', () => {
    expect(getPrimitiveType('number')).toBe('number')
    expect(getPrimitiveType('integer')).toBe('integer')
    expect(getPrimitiveType('bigint')).toBe('bigint')
  })

  it('maps boolean to boolean', () => {
    expect(getPrimitiveType('boolean')).toBe('boolean')
  })

  it('defaults everything else to string', () => {
    expect(getPrimitiveType('string')).toBe('string')
    expect(getPrimitiveType('object')).toBe('string')
    expect(getPrimitiveType(undefined)).toBe('string')
  })
})

describe('getDateType', () => {
  const base = DEFAULT_PARSER_OPTIONS

  it('returns null when dateType is false', () => {
    expect(getDateType({ ...base, dateType: false }, 'date-time')).toBeNull()
  })

  it('resolves date-time with dateType string to datetime without offset', () => {
    expect(getDateType({ ...base, dateType: 'string' }, 'date-time')).toStrictEqual({
      type: 'datetime',
      offset: false,
    })
  })

  it('resolves date-time with dateType date', () => {
    expect(getDateType({ ...base, dateType: 'date' }, 'date-time')).toStrictEqual({
      type: 'date',
      representation: 'date',
    })
  })

  it('resolves date-time with dateType stringOffset', () => {
    expect(getDateType({ ...base, dateType: 'stringOffset' }, 'date-time')).toStrictEqual({ type: 'datetime', offset: true })
  })

  it('resolves date-time with dateType stringLocal', () => {
    expect(getDateType({ ...base, dateType: 'stringLocal' }, 'date-time')).toStrictEqual({ type: 'datetime', local: true })
  })

  it('resolves date format', () => {
    expect(getDateType({ ...base, dateType: 'string' }, 'date')).toStrictEqual({
      type: 'date',
      representation: 'string',
    })
    expect(getDateType({ ...base, dateType: 'date' }, 'date')).toStrictEqual({
      type: 'date',
      representation: 'date',
    })
  })

  it('resolves time format', () => {
    expect(getDateType({ ...base, dateType: 'string' }, 'time')).toStrictEqual({
      type: 'time',
      representation: 'string',
    })
    expect(getDateType({ ...base, dateType: 'date' }, 'time')).toStrictEqual({
      type: 'time',
      representation: 'date',
    })
  })
})

describe('flattenSchema', () => {
  it('returns null for null input', () => {
    expect(flattenSchema(null)).toBeNull()
  })

  it('returns schema unchanged when there is no allOf', () => {
    const schema = { type: 'string' as const }

    expect(flattenSchema(schema)).toBe(schema)
  })

  it('returns schema unchanged when allOf is empty', () => {
    const schema = { allOf: [] }

    expect(flattenSchema(schema)).toBe(schema)
  })

  it('returns schema unchanged when allOf contains a $ref', () => {
    const schema = { allOf: [{ $ref: '#/components/schemas/Pet' }] }

    expect(flattenSchema(schema)).toBe(schema)
  })

  it('returns schema unchanged when allOf contains structural keys', () => {
    const schema = {
      allOf: [{ properties: { id: { type: 'integer' as const } } }],
    }

    expect(flattenSchema(schema)).toBe(schema)
  })

  it('merges plain allOf fragments into the parent schema', () => {
    const schema = {
      type: 'object' as const,
      allOf: [{ description: 'A pet' }, { example: 'Fido' }],
    }
    const result = flattenSchema(schema)

    expect(result).not.toHaveProperty('allOf')
    expect(result).toMatchObject({
      type: 'object',
      description: 'A pet',
      example: 'Fido',
    })
  })

  it('does not overwrite existing keys during merge', () => {
    const schema = {
      description: 'existing',
      allOf: [{ description: 'from allOf' }],
    }
    const result = flattenSchema(schema)

    expect(result?.description).toBe('existing')
  })
})
