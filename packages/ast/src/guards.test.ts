import { describe, expect, it } from 'vitest'
import { isHttpOperationNode, narrowSchema } from './guards.ts'
import { createOperation } from './nodes/operation.ts'
import { createSchema } from './nodes/schema.ts'

describe('isHttpOperationNode', () => {
  it('returns true for an HTTP operation', () => {
    expect(isHttpOperationNode(createOperation({ operationId: 'op', method: 'GET', path: '/' }))).toBe(true)
  })
  it('returns false for a generic operation without method/path', () => {
    expect(isHttpOperationNode(createOperation({ operationId: 'op' }))).toBe(false)
  })
})

describe('narrowSchema', () => {
  it('returns the node when type matches', () => {
    const node = createSchema({ type: 'object', properties: [] })
    const result = narrowSchema(node, 'object')

    expect(result).toBe(node)
    expect(result?.type).toBe('object')
  })

  it('returns null when the node is missing or has another type', () => {
    expect(narrowSchema(createSchema({ type: 'string' }), 'object')).toBeNull()
    expect(narrowSchema(undefined, 'string')).toBeNull()
  })
})
