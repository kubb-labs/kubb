import { describe, expect, it } from 'vitest'
import { createParameter, createSchema } from './factory.ts'
import { applyParamsCasing } from './utils.ts'

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
