import { describe, expect, it } from 'vitest'
import { createProperty } from '../nodes/property.ts'
import { createSchema } from '../nodes/schema.ts'
import { getSchemaLiteralValues, resolveSchemaProperties } from './schemaProperties.ts'

describe('resolveSchemaProperties', () => {
  it('finds properties through references and intersections', () => {
    const property = createProperty({
      name: 'type',
      required: true,
      schema: createSchema({ type: 'enum', enumValues: ['cat'] }),
    })
    const object = createSchema({ type: 'object', properties: [property] })
    const ref = createSchema({ type: 'ref', name: 'Cat', schema: object })
    const node = createSchema({ type: 'intersection', members: [ref, createSchema({ type: 'object', properties: [property] })] })

    expect(resolveSchemaProperties({ node, propertyName: 'type' })).toStrictEqual([property, property])
  })

  it('does not find properties in union branches', () => {
    const node = createSchema({
      type: 'union',
      members: [
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'type', schema: createSchema({ type: 'enum', enumValues: ['cat'] }) })],
        }),
      ],
    })

    expect(resolveSchemaProperties({ node, propertyName: 'type' })).toStrictEqual([])
  })

  it('terminates for circular resolved references', () => {
    const node = createSchema({ type: 'ref', name: 'Node' })
    node.schema = node

    expect(resolveSchemaProperties({ node, propertyName: 'type' })).toStrictEqual([])
  })
})

describe('getSchemaLiteralValues', () => {
  it('collects unique values from enums, references, and unions', () => {
    const cat = createSchema({ type: 'enum', enumValues: ['cat'] })
    const node = createSchema({
      type: 'union',
      members: [createSchema({ type: 'ref', name: 'Cat', schema: cat }), cat, createSchema({ type: 'enum', enumValues: ['dog', null] })],
    })

    expect(getSchemaLiteralValues(node)).toStrictEqual(['cat', 'dog', null])
  })

  it('prefers named enum values', () => {
    const node = createSchema({
      type: 'enum',
      enumValues: ['ignored'],
      namedEnumValues: [{ name: 'Cat', value: 'cat', primitive: 'string' }],
    })

    expect(getSchemaLiteralValues(node)).toStrictEqual(['cat'])
  })
})
