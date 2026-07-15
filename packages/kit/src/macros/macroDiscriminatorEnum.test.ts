import { ast } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { macroDiscriminatorEnum } from './macroDiscriminatorEnum.ts'

function applyShallow(node: SchemaNode, macro: Parameters<typeof ast.applyMacros>[1][number]): SchemaNode {
  return ast.applyMacros(node, [macro], { depth: 'shallow' })
}

describe('macroDiscriminatorEnum', () => {
  it('leaves a node without the discriminator property unchanged', () => {
    const node = ast.factory.createSchema({
      type: 'object',
      name: 'Pet',
      properties: [ast.factory.createProperty({ name: 'name', schema: ast.factory.createSchema({ type: 'string' }) })],
    })

    expect(applyShallow(node, macroDiscriminatorEnum({ propertyName: 'type', values: ['dog'] }))).toBe(node)
  })

  it('replaces the discriminator property with a string enum of the values, named from enumName', () => {
    const node = ast.factory.createSchema({
      type: 'object',
      name: 'Pet',
      properties: [ast.factory.createProperty({ name: 'type', schema: ast.factory.createSchema({ type: 'string' }) })],
    })

    const result = applyShallow(node, macroDiscriminatorEnum({ propertyName: 'type', values: ['dog', 'cat'], enumName: 'PetTypeEnum' }))
    const enumNode = result.type === 'object' ? result.properties?.find((p) => p.name === 'type')?.schema : undefined

    expect(enumNode?.type === 'enum' ? enumNode.enumValues : undefined).toStrictEqual(['dog', 'cat'])
    expect(enumNode?.name).toBe('PetTypeEnum')
  })

  it('preserves readOnly and writeOnly on the replaced property', () => {
    const node = ast.factory.createSchema({
      type: 'object',
      properties: [ast.factory.createProperty({ name: 'type', schema: ast.factory.createSchema({ type: 'string', readOnly: true, writeOnly: true }) })],
    })

    const result = applyShallow(node, macroDiscriminatorEnum({ propertyName: 'type', values: ['dog'] }))
    const typeProp = result.type === 'object' ? result.properties?.find((p) => p.name === 'type') : undefined

    expect(typeProp?.schema.readOnly).toBe(true)
    expect(typeProp?.schema.writeOnly).toBe(true)
  })
})
