import { describe, expect, it } from 'vitest'
import { isHttpOperationNode } from './guards.ts'
import { createOperation } from './nodes/operation.ts'

describe('isHttpOperationNode', () => {
  it('returns true for an HTTP operation', () => {
    expect(isHttpOperationNode(createOperation({ operationId: 'op', method: 'GET', path: '/' }))).toBe(true)
  })
  it('returns false for a generic operation without method/path', () => {
    expect(isHttpOperationNode(createOperation({ operationId: 'op' }))).toBe(false)
  })
})
