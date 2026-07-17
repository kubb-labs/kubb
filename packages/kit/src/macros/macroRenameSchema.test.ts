import { ast } from '@kubb/ast'
import type { RefSchemaNode, SchemaNode } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { macroRenameSchema } from './macroRenameSchema.ts'

function apply(node: SchemaNode, macro: Parameters<typeof ast.applyMacros>[1][number]): SchemaNode {
  return ast.applyMacros(node, [macro])
}

describe('macroRenameSchema', () => {
  it('renames the declaration name', () => {
    const node = ast.factory.createSchema({ type: 'object', name: 'Order', properties: [] })
    const result = apply(node, macroRenameSchema({ from: 'Order', to: 'StoreOrder' }))

    expect(result.name).toBe('StoreOrder')
  })

  it('retargets refs pointing at the renamed schema', () => {
    const node = ast.factory.createSchema({
      type: 'object',
      name: 'Cart',
      properties: [
        ast.factory.createProperty({ name: 'order', schema: ast.factory.createSchema({ type: 'ref', ref: '#/components/schemas/Order', name: 'Order' }) }),
      ],
    })

    const result = apply(node, macroRenameSchema({ from: 'Order', to: 'StoreOrder' }))
    const ref = ast.narrowSchema(result, 'object')?.properties[0]?.schema

    expect(ast.resolveRefName(ref)).toBe('StoreOrder')
    expect(ast.narrowSchema(ref!, 'ref')?.ref).toBe('#/components/schemas/Order')
  })

  it('keeps a flatten alias declaration and its target independent', () => {
    // `ClientDisconnectedProblem: { allOf: [$ref Problem] }` flattens to one ref node whose `name`
    // is the declaring component and whose pointer is the target. Renaming `Problem` must retarget
    // the pointer side without touching the declaration name.
    const node: RefSchemaNode = { kind: 'Schema', type: 'ref', name: 'ClientDisconnectedProblem', ref: '#/components/schemas/Problem' }

    const result = apply(node, macroRenameSchema({ from: 'Problem', to: 'ApiProblem' }))

    expect(result.name).toBe('ClientDisconnectedProblem')
    expect(ast.resolveRefName(result)).toBe('ApiProblem')
  })
})
