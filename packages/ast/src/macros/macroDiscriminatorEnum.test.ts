import { describe, expect, it } from 'vitest'
import { applyMacros } from '../defineMacro.ts'
import { createProperty } from '../nodes/property.ts'
import { createSchema, type SchemaNode } from '../nodes/schema.ts'
import { macroDiscriminatorEnum } from './macroDiscriminatorEnum.ts'

function applyShallow(node: SchemaNode, macro: Parameters<typeof applyMacros>[1][number]): SchemaNode {
  return applyMacros(node, [macro], { depth: 'shallow' })
}

function makeObjectNode(propNames: Array<string>, name?: string): SchemaNode {
  return createSchema({
    type: 'object',
    name,
    properties: propNames.map((prop) => createProperty({ name: prop, schema: createSchema({ type: 'string' }) })),
  })
}

describe('macroDiscriminatorEnum', () => {
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
