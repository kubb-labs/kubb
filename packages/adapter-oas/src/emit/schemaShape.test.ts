import { describe, expect, it } from 'vitest'
import { flattenSchema, resolveDateTypeValue } from './schemaShape.ts'

describe('resolveDateTypeValue', () => {
  it('reads the matching key from the object form, defaulting an omitted key to string', () => {
    expect(resolveDateTypeValue({ dateTime: 'date' }, 'date-time')).toBe('date')
    expect(resolveDateTypeValue({ dateTime: 'date' }, 'date')).toBe('string')
    expect(resolveDateTypeValue({ date: false, time: 'date' }, 'date')).toBe(false)
    expect(resolveDateTypeValue({ date: false, time: 'date' }, 'time')).toBe('date')
  })
})

describe('flattenSchema', () => {
  it.each([{ title: 'allOf is empty', schema: { allOf: [] } }])('returns schema unchanged when $title', ({ schema }) => {
    expect(flattenSchema(schema)).toBe(schema)
  })

  it('merges plain allOf fragments into the parent schema without overwriting existing keys', () => {
    const schema = {
      type: 'object' as const,
      description: 'existing',
      allOf: [{ description: 'from allOf' }, { example: 'Fido' }],
    }
    const result = flattenSchema(schema)

    expect(result).not.toHaveProperty('allOf')
    expect(result).toMatchObject({
      type: 'object',
      description: 'existing',
      example: 'Fido',
    })
  })
})
