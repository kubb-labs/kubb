import { describe, expect, it } from 'vitest'
import { createSchema } from '../nodes/schema.ts'
import { isString, jsonContent, numberBounds } from './index.ts'

describe('schema.jsonContent', () => {
  const inner = createSchema({ type: 'object', properties: [] })

  it('returns the schema of a JSON string', () => {
    expect(jsonContent({ content: { mediaType: 'application/json', schema: inner } })).toBe(inner)
  })

  it('ignores other media types, encoded content, or no schema', () => {
    expect(jsonContent({ content: { mediaType: 'text/plain', schema: inner } })).toBeUndefined()
    expect(jsonContent({ content: { mediaType: 'application/json', encoding: 'base64', schema: inner } })).toBeUndefined()
    expect(jsonContent({ content: { mediaType: 'application/json' } })).toBeUndefined()
  })
})

describe('isString', () => {
  it('returns true for plain string-like schema types', () => {
    expect(isString(createSchema({ type: 'string' }))).toBe(true)
    expect(isString(createSchema({ type: 'uuid' }))).toBe(true)
    expect(isString(createSchema({ type: 'email' }))).toBe(true)
    expect(isString(createSchema({ type: 'url' }))).toBe(true)
    expect(isString(createSchema({ type: 'datetime' }))).toBe(true)
  })

  it('returns true for date/time with string representation', () => {
    expect(isString(createSchema({ type: 'date', representation: 'string' }))).toBe(true)
    expect(isString(createSchema({ type: 'time', representation: 'string' }))).toBe(true)
  })

  it('returns false for date/time with date representation and non-string scalars', () => {
    expect(isString(createSchema({ type: 'date', representation: 'date' }))).toBe(false)
    expect(isString(createSchema({ type: 'time', representation: 'date' }))).toBe(false)
    expect(isString(createSchema({ type: 'number' }))).toBe(false)
  })
})

describe('schema.numberBounds', () => {
  it.each([
    [{ min: 1, max: 5 }, {}, { min: 1, max: 5 }],
    [{ exclusive: { min: 2, max: 8 } }, { integer: true }, { min: 3, max: 7 }],
    [{ min: 1.2, max: 4.8 }, { integer: true }, { min: 2, max: 4 }],
    [{ exclusive: { min: 0 } }, { integer: true, step: 5 }, { min: 5 }],
    [{ min: 0, exclusive: { min: 3 } }, { integer: true }, { min: 4 }],
    [{ min: -(2 ** 63), max: 2 ** 63 }, { integer: true }, {}],
    [{ exclusive: { min: 0.5 } }, {}, { min: 0.5 }],
  ] as const)('numberBounds(%o, %o) is %o', (node, options, expected) => {
    expect(numberBounds(node, options)).toStrictEqual(expected)
  })
})
