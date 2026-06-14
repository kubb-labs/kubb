import { describe, expect, expectTypeOf, it } from 'vitest'
import { isHttpOperationNode, narrowSchema } from './guards.ts'
import { createOperation } from './nodes/operation.ts'
import { createSchema } from './nodes/schema.ts'
import type { HttpMethod, OperationNode } from './nodes/operation.ts'
import type { ObjectSchemaNode, StringSchemaNode, UnionSchemaNode } from './nodes/schema.ts'
import { nodeDefs } from './registry.ts'

describe('isHttpOperationNode', () => {
  it('returns true for an HTTP operation', () => {
    expect(isHttpOperationNode(createOperation({ operationId: 'op', method: 'GET', path: '/' }))).toBe(true)
  })
  it('returns false for a generic operation without method/path', () => {
    expect(isHttpOperationNode(createOperation({ operationId: 'op' }))).toBe(false)
  })
  it('narrows method/path to non-nullable in a conditional', () => {
    const node: OperationNode = createOperation({ operationId: 'op', method: 'GET', path: '/' })
    if (isHttpOperationNode(node)) {
      expectTypeOf(node.method).toEqualTypeOf<HttpMethod>()
      expectTypeOf(node.path).toEqualTypeOf<string>()
    }
  })
})

describe('narrowSchema', () => {
  it('returns the node when type matches', () => {
    const node = createSchema({ type: 'object', properties: [] })
    const result = narrowSchema(node, 'object')

    expect(result).toBe(node)
    expect(result?.type).toBe('object')
  })

  it('returns null when type does not match', () => {
    expect(narrowSchema(createSchema({ type: 'string' }), 'object')).toBeNull()
  })

  it('returns null when node is undefined', () => {
    expect(narrowSchema(undefined, 'string')).toBeNull()
  })

  it('narrows return type to ObjectSchemaNode | null for "object"', () => {
    expectTypeOf(narrowSchema(createSchema({ type: 'object' }), 'object')).toEqualTypeOf<ObjectSchemaNode | null>()
  })

  it('narrows return type to StringSchemaNode | null for "string"', () => {
    expectTypeOf(narrowSchema(createSchema({ type: 'string' }), 'string')).toEqualTypeOf<StringSchemaNode | null>()
  })

  it('narrows return type to UnionSchemaNode | null for "union"', () => {
    expectTypeOf(narrowSchema(createSchema({ type: 'union' }), 'union')).toEqualTypeOf<UnionSchemaNode | null>()
  })
})

describe('node definition guards', () => {
  it('exposes a guard for every node kind', () => {
    const kinds = new Set(nodeDefs.map((def) => def.kind))
    expect(kinds.size).toBe(nodeDefs.length)
  })

  it.each(nodeDefs.map((def) => [def.kind, def] as const))('%s def.is matches only its own kind', (kind, def) => {
    expect(def.is({ kind })).toBe(true)
    expect(def.is({ kind: 'Other' })).toBe(false)
  })
})
