import { describe, expect, it } from 'vitest'
import { applyMacros } from '../defineMacro.ts'
import { createSchema, type SchemaNode } from '../nodes/schema.ts'
import { macroSimplifyUnion } from './macroSimplifyUnion.ts'

function simplify(members: Array<SchemaNode>): Array<SchemaNode> {
  const result = applyMacros(createSchema({ type: 'union', members }), [macroSimplifyUnion], { depth: 'shallow' })
  return result.type === 'union' ? (result.members ?? []) : []
}

describe('macroSimplifyUnion', () => {
  it('drops a multi-value enum covered by a broader scalar while keeping other members', () => {
    const string = createSchema({ type: 'string' })
    const ref = createSchema({ type: 'ref', ref: '#/components/schemas/Bar', name: 'Bar' })

    expect(simplify([createSchema({ type: 'enum', primitive: 'string', enumValues: ['x', 'y'] }), string, ref])).toStrictEqual([string, ref])
  })

  it('keeps a single-value enum even when a broader scalar is present', () => {
    const members = [createSchema({ type: 'enum', primitive: 'string', enumValues: ['accepted'] }), createSchema({ type: 'string' })]

    expect(simplify(members)).toStrictEqual(members)
  })
})
