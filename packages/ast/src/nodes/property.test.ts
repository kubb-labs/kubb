import { describe, expect, it } from 'vitest'
import { createProperty } from './property.ts'
import { createSchema } from './schema.ts'

describe('createProperty', () => {
  it('defaults required to false', () => {
    const node = createProperty({
      name: 'name',
      schema: createSchema({ type: 'string' }),
    })

    expect(node.kind).toBe('Property')
    expect(node.required).toBe(false)
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

  it('marks a non-required schema optional without a dialect', () => {
    const node = createProperty({
      name: 'name',
      schema: createSchema({ type: 'string' }),
    })

    expect(node.schema.optional).toBe(true)
    expect(node.schema.nullish).toBeUndefined()
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
