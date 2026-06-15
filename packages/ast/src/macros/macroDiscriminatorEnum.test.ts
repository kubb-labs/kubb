import { describe, expect, it } from 'vitest'
import { applyMacros } from '../defineMacro.ts'
import { createProperty } from '../nodes/property.ts'
import { createSchema, type SchemaNode } from '../nodes/schema.ts'
import { macroDiscriminatorEnum } from './macroDiscriminatorEnum.ts'

function applyShallow(node: SchemaNode, macro: Parameters<typeof applyMacros>[1][number]): SchemaNode {
  return applyMacros(node, [macro], { depth: 'shallow' })
}

describe('macroDiscriminatorEnum', () => {
  it('leaves a node without the discriminator property unchanged', () => {
    const node = createSchema({ type: 'object', name: 'Pet', properties: [createProperty({ name: 'name', schema: createSchema({ type: 'string' }) })] })

    expect(applyShallow(node, macroDiscriminatorEnum({ propertyName: 'type', values: ['dog'] }))).toBe(node)
  })

  it('replaces the discriminator property with a string enum of the values, named from enumName', () => {
    const node = createSchema({ type: 'object', name: 'Pet', properties: [createProperty({ name: 'type', schema: createSchema({ type: 'string' }) })] })

    const result = applyShallow(node, macroDiscriminatorEnum({ propertyName: 'type', values: ['dog', 'cat'], enumName: 'PetTypeEnum' }))
    const enumNode = result.type === 'object' ? result.properties?.find((p) => p.name === 'type')?.schema : undefined

    expect(enumNode?.type === 'enum' ? enumNode.enumValues : undefined).toStrictEqual(['dog', 'cat'])
    expect(enumNode?.name).toBe('PetTypeEnum')
  })

  it('preserves readOnly and writeOnly on the replaced property', () => {
    const node = createSchema({
      type: 'object',
      properties: [createProperty({ name: 'type', schema: createSchema({ type: 'string', readOnly: true, writeOnly: true }) })],
    })

    const result = applyShallow(node, macroDiscriminatorEnum({ propertyName: 'type', values: ['dog'] }))
    const typeProp = result.type === 'object' ? result.properties?.find((p) => p.name === 'type') : undefined

    expect(typeProp?.schema.readOnly).toBe(true)
    expect(typeProp?.schema.writeOnly).toBe(true)
  })
})
