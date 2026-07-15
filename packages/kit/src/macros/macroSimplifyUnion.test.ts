import { ast } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { macroSimplifyUnion } from './macroSimplifyUnion.ts'

function simplify(members: Array<SchemaNode>): Array<SchemaNode> {
  const result = ast.applyMacros(ast.factory.createSchema({ type: 'union', members }), [macroSimplifyUnion], { depth: 'shallow' })
  return result.type === 'union' ? (result.members ?? []) : []
}

describe('macroSimplifyUnion', () => {
  it('drops a multi-value enum covered by a broader scalar while keeping other members', () => {
    const string = ast.factory.createSchema({ type: 'string' })
    const ref = ast.factory.createSchema({ type: 'ref', ref: '#/components/schemas/Bar', name: 'Bar' })

    expect(simplify([ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: ['x', 'y'] }), string, ref])).toStrictEqual([string, ref])
  })

  it('keeps a single-value enum even when a broader scalar is present', () => {
    const members = [ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: ['accepted'] }), ast.factory.createSchema({ type: 'string' })]

    expect(simplify(members)).toStrictEqual(members)
  })
})
