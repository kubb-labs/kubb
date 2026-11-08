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
})
