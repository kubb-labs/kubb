import { describe, expect, it } from 'vitest'
import { applyMacros } from '../defineMacro.ts'
import { createProperty } from '../nodes/property.ts'
import { createSchema, type RefSchemaNode, type SchemaNode } from '../nodes/schema.ts'
import { narrowSchema } from '../guards.ts'
import { resolveRefName } from '../utils/refs.ts'
import { macroRenameSchema } from './macroRenameSchema.ts'

function apply(node: SchemaNode, macro: Parameters<typeof applyMacros>[1][number]): SchemaNode {
  return applyMacros(node, [macro])
}

describe('macroRenameSchema', () => {
  it('renames the declaration name', () => {
    const node = createSchema({ type: 'object', name: 'Order', properties: [] })
    const result = apply(node, macroRenameSchema({ from: 'Order', to: 'StoreOrder' }))

    expect(result.name).toBe('StoreOrder')
  })

  it('retargets refs pointing at the renamed schema', () => {
    const node = createSchema({
      type: 'object',
      name: 'Cart',
      properties: [createProperty({ name: 'order', schema: createSchema({ type: 'ref', ref: '#/components/schemas/Order', name: 'Order' }) })],
    })

    const result = apply(node, macroRenameSchema({ from: 'Order', to: 'StoreOrder' }))
    const ref = narrowSchema(result, 'object')?.properties[0]?.schema

    expect(resolveRefName(ref)).toBe('StoreOrder')
    expect(narrowSchema(ref!, 'ref')?.ref).toBe('#/components/schemas/Order')
  })

  it('keeps a flatten alias declaration and its target independent', () => {
    // `ClientDisconnectedProblem: { allOf: [$ref Problem] }` flattens to one ref node whose `name`
    // is the declaring component and whose pointer is the target. Renaming `Problem` must retarget
    // the pointer side without touching the declaration name.
    const node: RefSchemaNode = { kind: 'Schema', type: 'ref', name: 'ClientDisconnectedProblem', ref: '#/components/schemas/Problem' }

    const result = apply(node, macroRenameSchema({ from: 'Problem', to: 'ApiProblem' }))

    expect(result.name).toBe('ClientDisconnectedProblem')
    expect(resolveRefName(result)).toBe('ApiProblem')
  })
})
