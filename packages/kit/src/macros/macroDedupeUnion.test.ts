import { ast } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { macroSimplifyUnion } from '../index.ts'
import { macroDedupeUnion } from './macroDedupeUnion.ts'

function dedupe(members: Array<SchemaNode>): Array<SchemaNode> {
  const result = ast.macro.apply(ast.factory.createSchema({ type: ast.schema.types.union, members }), [macroDedupeUnion], { depth: 'shallow' })
  return result.type === ast.schema.types.union ? (result.members ?? []) : []
}

describe('macroDedupeUnion', () => {
  it('is still exported under its old name, macroSimplifyUnion', () => {
    expect(macroSimplifyUnion).toBe(macroDedupeUnion)
  })

  it('keeps enum members next to a broader scalar', () => {
    const members = [
      ast.factory.createSchema({ type: ast.schema.types.string }),
      ast.factory.createSchema({ type: ast.schema.types.enum, primitive: ast.schema.types.string, enumValues: ['gpt-a', 'gpt-b'] }),
      ast.factory.createSchema({ type: ast.schema.types.enum, primitive: ast.schema.types.string, enumValues: ['accepted'] }),
    ]

    expect(dedupe(members)).toStrictEqual(members)
  })

  it('deduplicates deeply shared schemas without expanding the resolved graph', () => {
    const shared = Array.from({ length: 30 }).reduce<SchemaNode>(
      (schema) =>
        ast.factory.createSchema({
          type: ast.schema.types.object,
          properties: ['left', 'right'].map((name) => ast.factory.createProperty({ name, schema })),
        }),
      ast.factory.createSchema({ type: ast.schema.types.string }),
    )
    const member = ast.factory.createSchema({ type: ast.schema.types.ref, name: 'Shared', schema: shared, pointer: '#/a' })
    const duplicate = { ...member, pointer: '#/b' }

    const result = dedupe([member, duplicate])

    expect(result).toHaveLength(1)
    expect(result[0]).toBe(member)
  })

  it('keeps refs with different resolved schemas and member constraints', () => {
    const string = ast.factory.createSchema({ type: ast.schema.types.ref, name: 'Value', schema: ast.factory.createSchema({ type: ast.schema.types.string }) })
    const number = { ...string, schema: ast.factory.createSchema({ type: ast.schema.types.number }) }
    const nullable = { ...string, nullable: true }

    expect(dedupe([string, number, nullable, { ...string }])).toStrictEqual([string, number, nullable])
  })

  it('does not hash the resolved schema of a ref that carries a pointer', () => {
    const resolved = ast.factory.createSchema({ type: ast.schema.types.string })
    const first = ast.factory.createSchema({ type: ast.schema.types.ref, name: 'Value', ref: '#/components/schemas/Value', schema: resolved })
    const other = ast.factory.createSchema({ type: ast.schema.types.ref, name: 'Other', ref: '#/components/schemas/Other', schema: resolved })
    // Same pointer, so the same target: a structurally different `schema` must not keep both.
    const repeat = { ...first, schema: ast.factory.createSchema({ type: ast.schema.types.number }) }

    expect(dedupe([first, other, repeat])).toStrictEqual([first, other])
  })

  it('hashes ref-shaped data under default in full', () => {
    const first = ast.factory.createSchema({ type: ast.schema.types.unknown, default: { type: 'ref', ref: '#/x', schema: 1 } })
    const second = { ...first, default: { type: 'ref', ref: '#/x', schema: 2 } }

    expect(dedupe([first, second])).toStrictEqual([first, second])
  })

  it('keeps object and array defaults distinct', () => {
    const object = ast.factory.createSchema({ type: ast.schema.types.unknown, default: {} })
    const array = { ...object, default: [] }

    expect(dedupe([object, array])).toStrictEqual([object, array])
  })

  it('keeps distinct Date defaults and deduplicates their serialized equivalents', () => {
    const first = ast.factory.createSchema({ type: ast.schema.types.string, default: new Date('2026-01-01T00:00:00.000Z') })
    const second = { ...first, default: new Date('2026-01-02T00:00:00.000Z') }
    const serialized = { ...first, default: '2026-01-01T00:00:00.000Z' }

    expect(dedupe([first, second, serialized])).toStrictEqual([first, second])
  })
})
