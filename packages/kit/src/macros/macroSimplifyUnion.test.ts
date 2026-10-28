import { ast } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { macroSimplifyUnion } from './macroSimplifyUnion.ts'

function simplify(members: Array<SchemaNode>): Array<SchemaNode> {
  const result = ast.applyMacros(ast.factory.createSchema({ type: ast.schemaTypes.union, members }), [macroSimplifyUnion], { depth: 'shallow' })
  return result.type === ast.schemaTypes.union ? (result.members ?? []) : []
}

describe('macroSimplifyUnion', () => {
  it('drops a multi-value enum covered by a broader scalar while keeping other members', () => {
    const string = ast.factory.createSchema({ type: ast.schemaTypes.string })
    const ref = ast.factory.createSchema({ type: ast.schemaTypes.ref, ref: '#/components/schemas/Bar', name: 'Bar' })

    expect(
      simplify([ast.factory.createSchema({ type: ast.schemaTypes.enum, primitive: ast.schemaTypes.string, enumValues: ['x', 'y'] }), string, ref]),
    ).toStrictEqual([string, ref])
  })

  it('keeps a single-value enum even when a broader scalar is present', () => {
    const members = [
      ast.factory.createSchema({ type: ast.schemaTypes.enum, primitive: ast.schemaTypes.string, enumValues: ['accepted'] }),
      ast.factory.createSchema({ type: ast.schemaTypes.string }),
    ]

    expect(simplify(members)).toStrictEqual(members)
  })

  it('drops repeated members, ignoring the source pointer', () => {
    const string = ast.factory.createSchema({ type: ast.schemaTypes.string, pointer: '#/a' })
    const number = ast.factory.createSchema({ type: ast.schemaTypes.number })

    expect(simplify([string, ast.factory.createSchema({ type: ast.schemaTypes.string, pointer: '#/b' }), number])).toStrictEqual([string, number])
  })

  it('deduplicates deeply shared schemas without expanding the resolved graph', () => {
    const shared = Array.from({ length: 30 }).reduce<SchemaNode>(
      (schema) =>
        ast.factory.createSchema({
          type: ast.schemaTypes.object,
          properties: ['left', 'right'].map((name) => ast.factory.createProperty({ name, schema })),
        }),
      ast.factory.createSchema({ type: ast.schemaTypes.string }),
    )
    const member = ast.factory.createSchema({ type: ast.schemaTypes.ref, name: 'Shared', schema: shared, pointer: '#/a' })
    const duplicate = { ...member, pointer: '#/b' }

    const result = simplify([member, duplicate])

    expect(result).toHaveLength(1)
    expect(result[0]).toBe(member)
  })

  it('keeps refs with different resolved schemas and member constraints', () => {
    const string = ast.factory.createSchema({ type: ast.schemaTypes.ref, name: 'Value', schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) })
    const number = { ...string, schema: ast.factory.createSchema({ type: ast.schemaTypes.number }) }
    const nullable = { ...string, nullable: true }

    expect(simplify([string, number, nullable, { ...string }])).toStrictEqual([string, number, nullable])
  })

  it('does not hash the resolved schema of a ref that carries a pointer', () => {
    const resolved = ast.factory.createSchema({ type: ast.schemaTypes.string })
    const first = ast.factory.createSchema({ type: ast.schemaTypes.ref, name: 'Value', ref: '#/components/schemas/Value', schema: resolved })
    const other = ast.factory.createSchema({ type: ast.schemaTypes.ref, name: 'Other', ref: '#/components/schemas/Other', schema: resolved })
    // Same pointer, so the same target: the differing `schema` object must not keep both.
    const repeat = { ...first, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) }

    expect(simplify([first, other, repeat])).toStrictEqual([first, other])
  })

  it('keeps object and array defaults distinct', () => {
    const object = ast.factory.createSchema({ type: ast.schemaTypes.unknown, default: {} })
    const array = { ...object, default: [] }

    expect(simplify([object, array])).toStrictEqual([object, array])
  })

  it('keeps distinct Date defaults and deduplicates their serialized equivalents', () => {
    const first = ast.factory.createSchema({ type: ast.schemaTypes.string, default: new Date('2026-01-01T00:00:00.000Z') })
    const second = { ...first, default: new Date('2026-01-02T00:00:00.000Z') }
    const serialized = { ...first, default: '2026-01-01T00:00:00.000Z' }

    expect(simplify([first, second, serialized])).toStrictEqual([first, second])
  })
})
