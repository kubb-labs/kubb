import { describe, expect, it } from 'vitest'
import { createParameter } from './parameter.ts'
import { createSchema } from './schema.ts'

describe('createParameter', () => {
  it('returns required false and an optional schema when required is omitted', () => {
    const node = createParameter({
      name: 'limit',
      in: 'query',
      schema: createSchema({ type: 'integer' }),
    })

    expect(node).toStrictEqual({
      kind: 'Parameter',
      name: 'limit',
      in: 'query',
      required: false,
      schema: { kind: 'Schema', type: 'integer', primitive: 'integer', optional: true, nullish: undefined },
    })
  })

  it('keeps required true when given', () => {
    const node = createParameter({
      name: 'petId',
      in: 'path',
      schema: createSchema({ type: 'integer' }),
      required: true,
    })

    expect(node.kind).toBe('Parameter')
    expect(node.in).toBe('path')
    expect(node.required).toBe(true)
  })
})
