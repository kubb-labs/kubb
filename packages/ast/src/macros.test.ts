import { describe, expect, it } from 'vitest'
import { applyMacros } from './macro.ts'
import { macroDiscriminatorEnum, macroEnumName, macroSimplifyUnion } from './macros.ts'
import { createProperty } from './nodes/property.ts'
import { createSchema, type SchemaNode } from './nodes/schema.ts'

function applyShallow(node: SchemaNode, macro: Parameters<typeof applyMacros>[1][number]): SchemaNode {
  return applyMacros(node, [macro], { depth: 'shallow' })
}

describe('macroDiscriminatorEnum', () => {
  function makeObjectNode(propNames: Array<string>, name?: string): SchemaNode {
    return createSchema({
      type: 'object',
      name,
      properties: propNames.map((prop) => createProperty({ name: prop, schema: createSchema({ type: 'string' }) })),
    })
  }

  const baseNode = makeObjectNode(['type', 'name'], 'Pet')

  it('returns the original node when input is not an object schema', () => {
    const node = createSchema({ type: 'string' })
    expect(applyShallow(node, macroDiscriminatorEnum({ propertyName: 'type', values: ['dog'] }))).toBe(node)
  })

  it('returns the original node when the target property is missing', () => {
    expect(applyShallow(baseNode, macroDiscriminatorEnum({ propertyName: 'kind', values: ['dog'] }))).toBe(baseNode)
  })

  it('returns the original node when object properties are empty', () => {
    const node = createSchema({ type: 'object', properties: [] })
    expect(applyShallow(node, macroDiscriminatorEnum({ propertyName: 'type', values: ['dog'] }))).toBe(node)
  })

  it('replaces the discriminator property with an unnamed enum for a single value', () => {
    const result = applyShallow(baseNode, macroDiscriminatorEnum({ propertyName: 'type', values: ['dog'] }))
    const objectNode = result.type === 'object' ? result : undefined
    const typeProp = objectNode?.properties?.find((prop) => prop.name === 'type')
    const enumNode = typeProp?.schema.type === 'enum' ? typeProp.schema : undefined

    expect(enumNode?.enumValues).toStrictEqual(['dog'])
    expect(enumNode?.name).toBeUndefined()
  })

  it('replaces the discriminator property with a named enum for multiple values', () => {
    const result = applyShallow(baseNode, macroDiscriminatorEnum({ propertyName: 'type', values: ['dog', 'cat'], enumName: 'PetTypeEnum' }))
    const objectNode = result.type === 'object' ? result : undefined
    const typeProp = objectNode?.properties?.find((prop) => prop.name === 'type')
    const enumNode = typeProp?.schema.type === 'enum' ? typeProp.schema : undefined

    expect(enumNode?.enumValues).toStrictEqual(['dog', 'cat'])
    expect(enumNode?.name).toBe('PetTypeEnum')
  })

  it('preserves readOnly and writeOnly from the original discriminator property', () => {
    const node = createSchema({
      type: 'object',
      properties: [createProperty({ name: 'type', schema: createSchema({ type: 'string', readOnly: true, writeOnly: true }) })],
    })
    const result = applyShallow(node, macroDiscriminatorEnum({ propertyName: 'type', values: ['dog'] }))
    const objectNode = result.type === 'object' ? result : undefined
    const typeProp = objectNode?.properties?.find((prop) => prop.name === 'type')

    expect(typeProp?.schema.readOnly).toBe(true)
    expect(typeProp?.schema.writeOnly).toBe(true)
  })
})

describe('macroSimplifyUnion', () => {
  function union(members: Array<SchemaNode>): SchemaNode {
    return createSchema({ type: 'union', members })
  }

  function members(node: SchemaNode): Array<SchemaNode> {
    return node.type === 'union' ? (node.members ?? []) : []
  }

  it('returns the original node when no scalar primitives are present', () => {
    const node = union([createSchema({ type: 'ref', ref: '#/components/schemas/Foo', name: 'Foo' })])
    expect(applyShallow(node, macroSimplifyUnion)).toBe(node)
  })

  it('removes a string enum when a broader string scalar is present', () => {
    const string = createSchema({ type: 'string' })
    const node = union([createSchema({ type: 'enum', primitive: 'string', enumValues: ['placed', 'approved'] }), string])

    expect(members(applyShallow(node, macroSimplifyUnion))).toStrictEqual([string])
  })

  it('keeps a single-value string enum when a broader string scalar is present', () => {
    const node = union([createSchema({ type: 'enum', primitive: 'string', enumValues: ['accepted'] }), createSchema({ type: 'string' })])
    expect(applyShallow(node, macroSimplifyUnion)).toBe(node)
  })

  it('removes a number enum when a broader number scalar is present', () => {
    const number = createSchema({ type: 'number' })
    const node = union([createSchema({ type: 'enum', primitive: 'number', enumValues: [200, 400] }), number])

    expect(members(applyShallow(node, macroSimplifyUnion))).toStrictEqual([number])
  })

  it('preserves ref members while simplifying scalar enum members', () => {
    const string = createSchema({ type: 'string' })
    const ref = createSchema({ type: 'ref', ref: '#/components/schemas/Bar', name: 'Bar' })
    const node = union([createSchema({ type: 'enum', primitive: 'string', enumValues: ['x', 'y'] }), string, ref])

    expect(members(applyShallow(node, macroSimplifyUnion))).toStrictEqual([string, ref])
  })
})

describe('macroEnumName', () => {
  it('assigns the resolved name to enum nodes', () => {
    const node = createSchema({ type: 'enum', primitive: 'string', enumValues: ['a', 'b'] })
    const result = applyShallow(node, macroEnumName({ parentName: 'Order', propName: 'status', enumSuffix: 'enum' }))

    expect(result.name).toBe('OrderStatusEnum')
  })

  it('strips names from boolean enum nodes', () => {
    const node = createSchema({ type: 'enum', primitive: 'boolean', enumValues: [true], name: 'ShouldDrop' })
    const result = applyShallow(node, macroEnumName({ parentName: 'Order', propName: 'enabled', enumSuffix: 'enum' }))

    expect(result.name).toBeNull()
  })

  it('passes through non-enum nodes unchanged', () => {
    const node = createSchema({ type: 'string' })
    expect(applyShallow(node, macroEnumName({ parentName: 'Order', propName: 'status', enumSuffix: 'enum' }))).toBe(node)
  })
})
