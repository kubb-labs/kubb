import { createProperty, createSchema } from './factory.ts'
import type { SchemaNode } from './nodes/schema.ts'
import { describe, expect, it } from 'vitest'
import { applyDiscriminatorEnum, mergeAdjacentAnonymousObjects, simplifyUnionMembers } from './transforms.ts'

describe('applyDiscriminatorEnum', () => {
  function makeObjectNode(propNames: Array<string>, name?: string): SchemaNode {
    return createSchema({
      type: 'object',
      name,
      properties: propNames.map((prop) => createProperty({ name: prop, schema: createSchema({ type: 'string' }) })),
    })
  }

  const baseNode = makeObjectNode(['type', 'name'], 'Pet')

  it('returns node unchanged when it is not an object', () => {
    const node = createSchema({ type: 'string' })
    const result = applyDiscriminatorEnum({ node, propertyName: 'type', values: ['dog'] })

    expect(result).toBe(node)
  })

  it('returns node unchanged when the target property does not exist', () => {
    const result = applyDiscriminatorEnum({ node: baseNode, propertyName: 'kind', values: ['dog'] })

    expect(result).toBe(baseNode)
  })

  it('returns node unchanged when properties are empty', () => {
    const node = createSchema({ type: 'object', properties: [] })
    const result = applyDiscriminatorEnum({ node, propertyName: 'type', values: ['dog'] })

    expect(result).toBe(node)
  })

  it('replaces discriminator property with unnamed enum for single value', () => {
    const result = applyDiscriminatorEnum({ node: baseNode, propertyName: 'type', values: ['dog'] })
    const objectNode = result.type === 'object' ? result : undefined
    const typeProp = objectNode?.properties?.find((prop) => prop.name === 'type')
    const enumNode = typeProp?.schema.type === 'enum' ? typeProp.schema : undefined

    expect(enumNode?.enumValues).toEqual(['dog'])
    expect(enumNode?.name).toBeUndefined()
  })

  it('replaces discriminator property with named enum for multiple values', () => {
    const result = applyDiscriminatorEnum({ node: baseNode, propertyName: 'type', values: ['dog', 'cat'], enumName: 'PetTypeEnum' })
    const objectNode = result.type === 'object' ? result : undefined
    const typeProp = objectNode?.properties?.find((prop) => prop.name === 'type')
    const enumNode = typeProp?.schema.type === 'enum' ? typeProp.schema : undefined

    expect(enumNode?.enumValues).toEqual(['dog', 'cat'])
    expect(enumNode?.name).toBe('PetTypeEnum')
  })

  it('preserves other properties when replacing discriminator', () => {
    const result = applyDiscriminatorEnum({ node: baseNode, propertyName: 'type', values: ['dog'] })
    const objectNode = result.type === 'object' ? result : undefined
    const nameProp = objectNode?.properties?.find((prop) => prop.name === 'name')

    expect(nameProp?.schema.type).toBe('string')
  })

  it('preserves readOnly from original property schema', () => {
    const node = createSchema({
      type: 'object',
      properties: [createProperty({ name: 'type', schema: createSchema({ type: 'string', readOnly: true }) })],
    })
    const result = applyDiscriminatorEnum({ node, propertyName: 'type', values: ['dog'] })
    const objectNode = result.type === 'object' ? result : undefined
    const typeProp = objectNode?.properties?.find((prop) => prop.name === 'type')

    expect(typeProp?.schema.readOnly).toBe(true)
  })

  it('preserves writeOnly from original property schema', () => {
    const node = createSchema({
      type: 'object',
      properties: [createProperty({ name: 'type', schema: createSchema({ type: 'string', writeOnly: true }) })],
    })
    const result = applyDiscriminatorEnum({ node, propertyName: 'type', values: ['dog'] })
    const objectNode = result.type === 'object' ? result : undefined
    const typeProp = objectNode?.properties?.find((prop) => prop.name === 'type')

    expect(typeProp?.schema.writeOnly).toBe(true)
  })
})

describe('mergeAdjacentAnonymousObjects', () => {
  function makeObject(props: Array<string>, name?: string): SchemaNode {
    return createSchema({
      type: 'object',
      name,
      properties: props.map((prop) => createProperty({ name: prop, schema: createSchema({ type: 'string' }) })),
    })
  }

  it('returns an empty array unchanged', () => {
    expect(mergeAdjacentAnonymousObjects([])).toEqual([])
  })

  it('passes through a single anonymous object unchanged', () => {
    const node = makeObject(['a'])

    expect(mergeAdjacentAnonymousObjects([node])).toEqual([node])
  })

  it('merges two adjacent anonymous objects into one', () => {
    const result = mergeAdjacentAnonymousObjects([makeObject(['a']), makeObject(['b'])])
    const merged = result[0]

    expect(result).toHaveLength(1)
    expect(merged?.type).toBe('object')
    expect(merged?.type === 'object' ? merged.properties?.map((p) => p.name) : []).toEqual(['a', 'b'])
  })

  it('merges three consecutive anonymous objects into one', () => {
    const result = mergeAdjacentAnonymousObjects([makeObject(['a']), makeObject(['b']), makeObject(['c'])])
    const merged = result[0]

    expect(result).toHaveLength(1)
    expect(merged?.type === 'object' ? merged.properties?.map((p) => p.name) : []).toEqual(['a', 'b', 'c'])
  })

  it('does not merge named objects', () => {
    const result = mergeAdjacentAnonymousObjects([makeObject(['a'], 'Foo'), makeObject(['b'], 'Bar')])

    expect(result).toHaveLength(2)
  })

  it('does not merge across a named-object boundary', () => {
    const result = mergeAdjacentAnonymousObjects([makeObject(['a']), makeObject(['b'], 'Named'), makeObject(['c'])])

    expect(result).toHaveLength(3)
  })

  it('does not merge a ref node with an anonymous object', () => {
    const result = mergeAdjacentAnonymousObjects([
      createSchema({ type: 'ref', ref: '#/components/schemas/Address', name: 'Address' }),
      makeObject(['streetNumber']),
      makeObject(['streetName']),
    ])

    expect(result).toHaveLength(2)
    expect(result[0]?.type).toBe('ref')
    expect(result[1]?.type === 'object' ? result[1].properties?.map((p) => p.name) : []).toEqual(['streetNumber', 'streetName'])
  })
})

describe('simplifyUnionMembers', () => {
  it('returns members unchanged when no scalar primitives are present', () => {
    const members = [createSchema({ type: 'ref', ref: '#/components/schemas/Foo', name: 'Foo' })]

    expect(simplifyUnionMembers(members)).toEqual(members)
  })

  it('removes string enum when a plain string is also present', () => {
    const members = [
      createSchema({ type: 'enum', primitive: 'string', enumType: 'string', enumValues: ['placed', 'approved'] }),
      createSchema({ type: 'string' }),
    ]

    expect(simplifyUnionMembers(members)).toEqual([members[1]])
  })

  it('keeps const-derived string enum when plain string is also present', () => {
    const members = [createSchema({ type: 'enum', primitive: 'string', enumValues: ['accepted'] }), createSchema({ type: 'string' })]

    expect(simplifyUnionMembers(members)).toEqual(members)
  })

  it('keeps string enum when no broader string scalar is present', () => {
    const members = [createSchema({ type: 'enum', primitive: 'string', enumValues: ['placed'] })]

    expect(simplifyUnionMembers(members)).toEqual(members)
  })

  it('removes number enum when a plain number is also present', () => {
    const members = [
      createSchema({ type: 'enum', primitive: 'number', enumType: 'number', enumValues: [200, 400] }),
      createSchema({ type: 'number' }),
    ]

    expect(simplifyUnionMembers(members)).toEqual([members[1]])
  })

  it('preserves ref members alongside scalar types', () => {
    const members = [
      createSchema({ type: 'enum', primitive: 'string', enumType: 'string', enumValues: ['x'] }),
      createSchema({ type: 'string' }),
      createSchema({ type: 'ref', ref: '#/components/schemas/Bar', name: 'Bar' }),
    ]
    const result = simplifyUnionMembers(members)

    expect(result).toEqual([members[1], members[2]])
  })
})
