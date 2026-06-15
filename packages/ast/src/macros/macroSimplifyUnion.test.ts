import { describe, expect, it } from 'vitest'
import { applyMacros } from '../defineMacro.ts'
import { createSchema, type SchemaNode } from '../nodes/schema.ts'
import { macroSimplifyUnion } from './macroSimplifyUnion.ts'

function applyShallow(node: SchemaNode): SchemaNode {
  return applyMacros(node, [macroSimplifyUnion], { depth: 'shallow' })
}

function union(members: Array<SchemaNode>): SchemaNode {
  return createSchema({ type: 'union', members })
}

function members(node: SchemaNode): Array<SchemaNode> {
  return node.type === 'union' ? (node.members ?? []) : []
}

describe('macroSimplifyUnion', () => {
  it('returns the original node when no scalar primitives are present', () => {
    const node = union([createSchema({ type: 'ref', ref: '#/components/schemas/Foo', name: 'Foo' })])
    expect(applyShallow(node)).toBe(node)
  })

  it('removes a string enum when a broader string scalar is present', () => {
    const string = createSchema({ type: 'string' })
    const node = union([createSchema({ type: 'enum', primitive: 'string', enumValues: ['placed', 'approved'] }), string])

    expect(members(applyShallow(node))).toStrictEqual([string])
  })

  it('keeps a single-value string enum when a broader string scalar is present', () => {
    const node = union([createSchema({ type: 'enum', primitive: 'string', enumValues: ['accepted'] }), createSchema({ type: 'string' })])
    expect(applyShallow(node)).toBe(node)
  })

  it('removes a number enum when a broader number scalar is present', () => {
    const number = createSchema({ type: 'number' })
    const node = union([createSchema({ type: 'enum', primitive: 'number', enumValues: [200, 400] }), number])

    expect(members(applyShallow(node))).toStrictEqual([number])
  })

  it('preserves ref members while simplifying scalar enum members', () => {
    const string = createSchema({ type: 'string' })
    const ref = createSchema({ type: 'ref', ref: '#/components/schemas/Bar', name: 'Bar' })
    const node = union([createSchema({ type: 'enum', primitive: 'string', enumValues: ['x', 'y'] }), string, ref])

    expect(members(applyShallow(node))).toStrictEqual([string, ref])
  })
})
