import { describe, expect, expectTypeOf, it } from 'vitest'
import { createProperty } from './property.ts'
import { createSchema } from './schema.ts'
import type { ObjectSchemaNode, StringSchemaNode } from './schema.ts'

describe('createSchema', () => {
  it('creates a SchemaNode with a type', () => {
    const node = createSchema({ type: 'string' })

    expect(node.kind).toBe('Schema')
    expect(node.type).toBe('string')
  })

  it('accepts nullable and description', () => {
    const node = createSchema({
      type: 'number',
      nullable: true,
      description: 'An age value',
    })

    expect(node.nullable).toBe(true)
    expect(node.description).toBe('An age value')
  })

  it('creates an object schema with properties', () => {
    const prop = createProperty({
      name: 'id',
      schema: createSchema({ type: 'integer' }),
    })
    const node = createSchema({ type: 'object', properties: [prop] })

    expect(node.properties).toHaveLength(1)
    expect(node.properties?.[0]?.name).toBe('id')
  })

  it('creates a ref schema', () => {
    const node = createSchema({ type: 'ref', name: 'Pet' })

    expect(node.name).toBe('Pet')
  })

  it('narrows return type to StringSchemaNode for type "string"', () => {
    expectTypeOf(createSchema({ type: 'string' })).toMatchTypeOf<StringSchemaNode & { kind: 'Schema' }>()
  })

  it('narrows return type to ObjectSchemaNode for type "object"', () => {
    expectTypeOf(createSchema({ type: 'object' })).toMatchTypeOf<ObjectSchemaNode & { kind: 'Schema' }>()
  })
})
