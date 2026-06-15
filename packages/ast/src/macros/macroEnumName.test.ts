import { describe, expect, it } from 'vitest'
import { applyMacros } from '../defineMacro.ts'
import { createSchema, type SchemaNode } from '../nodes/schema.ts'
import { macroEnumName } from './macroEnumName.ts'

function applyShallow(node: SchemaNode, macro: Parameters<typeof applyMacros>[1][number]): SchemaNode {
  return applyMacros(node, [macro], { depth: 'shallow' })
}

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
