/** biome-ignore-all lint/style/noUnusedTemplateLiteral: not needed */
import { describe, expect, it } from 'vitest'
import { createProperty, createSchema } from './factory.ts'
import type { SchemaNode } from './nodes/schema.ts'
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
    expect(mergeAdjacentAnonymousObjects([])).toMatchInlineSnapshot(`[]`)
  })

  it('passes through a single anonymous object unchanged', () => {
    const node = makeObject(['a'])

    expect(
      mergeAdjacentAnonymousObjects([node]).map((n) =>
        n.type === 'object' ? { type: n.type, name: n.name, props: n.properties.map((p) => p.name) } : { type: n.type },
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "name": undefined,
          "props": [
            "a",
          ],
          "type": "object",
        },
      ]
    `)
  })

  it('merges two adjacent anonymous objects into one', () => {
    const result = mergeAdjacentAnonymousObjects([makeObject(['a']), makeObject(['b'])])

    expect(result.map((n) => (n.type === 'object' ? { type: n.type, props: n.properties.map((p) => p.name) } : { type: n.type }))).toMatchInlineSnapshot(`
      [
        {
          "props": [
            "a",
            "b",
          ],
          "type": "object",
        },
      ]
    `)
  })

  it('merges three consecutive anonymous objects into one', () => {
    const result = mergeAdjacentAnonymousObjects([makeObject(['a']), makeObject(['b']), makeObject(['c'])])

    expect(result.map((n) => (n.type === 'object' ? { type: n.type, props: n.properties.map((p) => p.name) } : { type: n.type }))).toMatchInlineSnapshot(`
      [
        {
          "props": [
            "a",
            "b",
            "c",
          ],
          "type": "object",
        },
      ]
    `)
  })

  it('does not merge named objects', () => {
    const result = mergeAdjacentAnonymousObjects([makeObject(['a'], 'Foo'), makeObject(['b'], 'Bar')])

    expect(
      result.map((n) => (n.type === 'object' ? { type: n.type, name: n.name, props: n.properties.map((p) => p.name) } : { type: n.type })),
    ).toMatchInlineSnapshot(`
      [
        {
          "name": "Foo",
          "props": [
            "a",
          ],
          "type": "object",
        },
        {
          "name": "Bar",
          "props": [
            "b",
          ],
          "type": "object",
        },
      ]
    `)
  })

  it('does not merge across a named-object boundary', () => {
    const result = mergeAdjacentAnonymousObjects([makeObject(['a']), makeObject(['b'], 'Named'), makeObject(['c'])])

    expect(
      result.map((n) => (n.type === 'object' ? { type: n.type, name: n.name, props: n.properties.map((p) => p.name) } : { type: n.type })),
    ).toMatchInlineSnapshot(`
      [
        {
          "name": undefined,
          "props": [
            "a",
          ],
          "type": "object",
        },
        {
          "name": "Named",
          "props": [
            "b",
          ],
          "type": "object",
        },
        {
          "name": undefined,
          "props": [
            "c",
          ],
          "type": "object",
        },
      ]
    `)
  })

  it('does not merge a ref node with an anonymous object', () => {
    const result = mergeAdjacentAnonymousObjects([
      createSchema({ type: 'ref', ref: '#/components/schemas/Address', name: 'Address' }),
      makeObject(['streetNumber']),
      makeObject(['streetName']),
    ])

    expect(
      result.map((n) =>
        n.type === 'object'
          ? { type: n.type, name: n.name, props: n.properties.map((p) => p.name) }
          : n.type === 'ref'
            ? { type: n.type, name: n.name, ref: n.ref }
            : { type: n.type },
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "name": "Address",
          "ref": "#/components/schemas/Address",
          "type": "ref",
        },
        {
          "name": undefined,
          "props": [
            "streetNumber",
            "streetName",
          ],
          "type": "object",
        },
      ]
    `)
  })
})

describe('simplifyUnionMembers', () => {
  it('returns members unchanged when no scalar primitives are present', () => {
    const members = [createSchema({ type: 'ref', ref: '#/components/schemas/Foo', name: 'Foo' })]

    expect(simplifyUnionMembers(members)).toEqual(members)
  })

  it('removes string enum when a plain string is also present', () => {
    const members = [createSchema({ type: 'enum', primitive: 'string', enumValues: ['placed', 'approved'] }), createSchema({ type: 'string' })]

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
    const members = [createSchema({ type: 'enum', primitive: 'number', enumValues: [200, 400] }), createSchema({ type: 'number' })]

    expect(simplifyUnionMembers(members)).toEqual([members[1]])
  })

  it('preserves ref members alongside scalar types', () => {
    const members = [
      createSchema({ type: 'enum', primitive: 'string', enumValues: ['x', 'y'] }),
      createSchema({ type: 'string' }),
      createSchema({ type: 'ref', ref: '#/components/schemas/Bar', name: 'Bar' }),
    ]
    const result = simplifyUnionMembers(members)

    expect(result).toEqual([members[1], members[2]])
  })
})
