import { describe, expect, it } from 'vitest'
import { createProperty } from './property.ts'
import { createSchema } from './schema.ts'

describe('createProperty', () => {
  it('returns required false and an optional schema when required is omitted', () => {
    const node = createProperty({
      name: 'name',
      schema: createSchema({ type: 'string' }),
    })

    expect(node).toStrictEqual({
      kind: 'Property',
      name: 'name',
      required: false,
      schema: { kind: 'Schema', type: 'string', primitive: 'string', optional: true, nullish: undefined },
    })
  })

  it('accepts required: true', () => {
    const node = createProperty({
      name: 'id',
      schema: createSchema({ type: 'integer' }),
      required: true,
    })

    expect(node.required).toBe(true)
    expect(node.schema.optional).toBeFalsy()
    expect(node.schema.nullable).toBeFalsy()
    expect(node.schema.nullish).toBeFalsy()
  })

  it('marks a non-required nullable schema nullish without a dialect', () => {
    const node = createProperty({
      name: 'name',
      schema: createSchema({ type: 'string', nullable: true }),
    })

    expect(node.schema.nullish).toBe(true)
    expect(node.schema.optional).toBeUndefined()
  })
})
