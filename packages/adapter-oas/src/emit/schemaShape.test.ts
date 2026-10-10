import { describe, expect, it } from 'vitest'
import { flattenSchema, resolveDateTypeValue } from './schemaShape.ts'

describe('resolveDateTypeValue', () => {
  it('applies a scalar dateType to every format', () => {
    expect(resolveDateTypeValue('date', 'date-time')).toBe('date')
    expect(resolveDateTypeValue('date', 'date')).toBe('date')
    expect(resolveDateTypeValue('date', 'time')).toBe('date')
    expect(resolveDateTypeValue(false, 'date-time')).toBe(false)
  })

  it('reads the matching key from the object form, defaulting an omitted key to string', () => {
    expect(resolveDateTypeValue({ dateTime: 'date' }, 'date-time')).toBe('date')
    expect(resolveDateTypeValue({ dateTime: 'date' }, 'date')).toBe('string')
    expect(resolveDateTypeValue({ date: false, time: 'date' }, 'date')).toBe(false)
    expect(resolveDateTypeValue({ date: false, time: 'date' }, 'time')).toBe('date')
  })
})

describe('flattenSchema', () => {
  it.each([
    { title: 'there is no allOf', schema: { type: 'string' as const } },
    { title: 'allOf is empty', schema: { allOf: [] } },
    { title: 'allOf contains a $ref', schema: { allOf: [{ $ref: '#/components/schemas/Pet' }] } },
    { title: 'allOf contains structural keys', schema: { allOf: [{ properties: { id: { type: 'integer' as const } } }] } },
  ])('returns schema unchanged when $title', ({ schema }) => {
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
