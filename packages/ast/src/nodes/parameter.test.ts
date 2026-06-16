import { describe, expect, it } from 'vitest'
import { createParameter } from './parameter.ts'
import { createSchema } from './schema.ts'

describe('createParameter', () => {
  it('creates a path parameter', () => {
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

  it('defaults required to false', () => {
    const node = createParameter({
      name: 'limit',
      in: 'query',
      schema: createSchema({ type: 'integer' }),
    })

    expect(node.required).toBe(false)
  })
})
