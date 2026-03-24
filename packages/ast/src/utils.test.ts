import { describe, expect, it } from 'vitest'
import { createParameter, createSchema } from './factory.ts'
import { applyParamsCasing, isPlainStringType } from './utils.ts'

const param = (name: string) =>
  createParameter({
    name,
    in: 'query',
    required: false,
    schema: createSchema({ type: 'string' }),
  })

describe('applyParamsCasing', () => {
  it('returns original array when casing is undefined', () => {
    const params = [param('pet_id'), param('order_status')]
    const result = applyParamsCasing(params, undefined)

    expect(result).toBe(params)
  })

  it('camelCases snake_case names', () => {
    const result = applyParamsCasing([param('pet_id'), param('order_status')], 'camelcase')

    expect(result.map((p) => p.name)).toEqual(['petId', 'orderStatus'])
  })

  it('camelCases kebab-case names', () => {
    const result = applyParamsCasing([param('some-param'), param('another-one')], 'camelcase')

    expect(result.map((p) => p.name)).toEqual(['someParam', 'anotherOne'])
  })

  it('leaves already-camelCased names unchanged', () => {
    const result = applyParamsCasing([param('petId'), param('limit')], 'camelcase')

    expect(result.map((p) => p.name)).toEqual(['petId', 'limit'])
  })

  it('does not mutate the original params', () => {
    const original = [param('pet_id')]
    applyParamsCasing(original, 'camelcase')

    expect(original[0]!.name).toBe('pet_id')
  })

  it('preserves all other ParameterNode fields', () => {
    const original = param('pet_id')
    const [result] = applyParamsCasing([original], 'camelcase')

    expect(result).toMatchObject({
      kind: 'Parameter',
      in: 'query',
      required: false,
      name: 'petId',
    })
    expect(result!.schema).toBe(original.schema)
  })

  it('handles an empty params array', () => {
    expect(applyParamsCasing([], 'camelcase')).toEqual([])
  })
})

describe('isPlainStringType', () => {
  it('returns true for plain string-like schema types', () => {
    expect(isPlainStringType(createSchema({ type: 'string' }))).toBe(true)
    expect(isPlainStringType(createSchema({ type: 'uuid' }))).toBe(true)
    expect(isPlainStringType(createSchema({ type: 'email' }))).toBe(true)
    expect(isPlainStringType(createSchema({ type: 'url' }))).toBe(true)
    expect(isPlainStringType(createSchema({ type: 'datetime' }))).toBe(true)
  })

  it('returns true for date/time with string representation', () => {
    expect(isPlainStringType(createSchema({ type: 'date', representation: 'string' }))).toBe(true)
    expect(isPlainStringType(createSchema({ type: 'time', representation: 'string' }))).toBe(true)
  })

  it('returns false for date/time with date representation and non-string scalars', () => {
    expect(isPlainStringType(createSchema({ type: 'date', representation: 'date' }))).toBe(false)
    expect(isPlainStringType(createSchema({ type: 'time', representation: 'date' }))).toBe(false)
    expect(isPlainStringType(createSchema({ type: 'number' }))).toBe(false)
  })
})
