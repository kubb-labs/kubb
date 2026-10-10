import { describe, expect, expectTypeOf, it } from 'vitest'
import { createProperty } from './property.ts'
import { createSchema } from './schema.ts'
import type { ObjectSchemaNode, StringSchemaNode } from './schema.ts'

describe('createSchema', () => {
  it('returns { kind, type, primitive, ...input } when creating a scalar schema', () => {
    expect(createSchema({ type: 'number', nullable: true, description: 'An age value' })).toStrictEqual({
      kind: 'Schema',
      type: 'number',
      primitive: 'number',
      nullable: true,
      description: 'An age value',
    })
  })

  it('returns primitive object and empty properties when creating an object schema', () => {
    const prop = createProperty({ name: 'id', schema: createSchema({ type: 'integer' }) })

    expect(createSchema({ type: 'object' })).toStrictEqual({ kind: 'Schema', type: 'object', primitive: 'object', properties: [] })
    expect(createSchema({ type: 'object', properties: [prop] }).properties).toStrictEqual([prop])
  })

  it.each([
    { type: 'uuid', primitive: 'string', node: createSchema({ type: 'uuid' }) },
    { type: 'email', primitive: 'string', node: createSchema({ type: 'email' }) },
    { type: 'url', primitive: 'string', node: createSchema({ type: 'url' }) },
    { type: 'datetime', primitive: 'string', node: createSchema({ type: 'datetime' }) },
    { type: 'time', primitive: 'string', node: createSchema({ type: 'time', representation: 'string' }) },
    { type: 'date', primitive: 'date', node: createSchema({ type: 'date', representation: 'string' }) },
    { type: 'ref', primitive: undefined, node: createSchema({ type: 'ref' }) },
    { type: 'ipv4', primitive: undefined, node: createSchema({ type: 'ipv4' }) },
  ])('returns primitive $primitive when type is $type', ({ primitive, node }) => {
    expect(node.primitive).toBe(primitive)
  })

  it('narrows the return type to the variant of the given type', () => {
    expectTypeOf(createSchema({ type: 'string' })).toMatchTypeOf<StringSchemaNode & { kind: 'Schema' }>()
    expectTypeOf(createSchema({ type: 'object' })).toMatchTypeOf<ObjectSchemaNode & { kind: 'Schema' }>()
  })
})
