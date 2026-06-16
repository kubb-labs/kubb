import { describe, expect, expectTypeOf, it } from 'vitest'
import { isHttpOperationNode } from '../guards.ts'
import { createOperation } from './operation.ts'
import type { OperationNode } from './operation.ts'

describe('createOperation', () => {
  it('creates an OperationNode with required fields', () => {
    const node = createOperation({
      operationId: 'getPets',
      method: 'GET',
      path: '/pets',
    })

    expect(node.kind).toBe('Operation')
    expect(node.operationId).toBe('getPets')
    expect(node.method).toBe('GET')
    expect(node.path).toBe('/pets')
    expect(node.protocol).toBe('http')
    expect(node.tags).toStrictEqual([])
    expect(node.parameters).toStrictEqual([])
    expect(node.responses).toStrictEqual([])

    expectTypeOf(node.method).toEqualTypeOf<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE'>()
    expectTypeOf(node.path).toEqualTypeOf<string>()
  })

  it('accepts optional fields', () => {
    const node = createOperation({
      operationId: 'createPet',
      method: 'POST',
      path: '/pets',
      summary: 'Create a pet',
      deprecated: true,
      tags: ['pets'],
    })

    expect(node.summary).toBe('Create a pet')
    expect(node.deprecated).toBe(true)
    expect(node.tags).toStrictEqual(['pets'])
  })

  it('builds a generic operation without HTTP method/path', () => {
    const node = createOperation({ operationId: 'onPetAdded' })

    expect(node.method).toBeUndefined()
    expect(node.path).toBeUndefined()
    expect(node.protocol).toBeUndefined()
  })

  it('narrows an HTTP operation with isHttpOperationNode', () => {
    const node: OperationNode = createOperation({ operationId: 'getPets', method: 'GET', path: '/pets' })

    expect(isHttpOperationNode(node)).toBe(true)

    if (isHttpOperationNode(node)) {
      expectTypeOf(node.method).toEqualTypeOf<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE'>()
      expectTypeOf(node.path).toEqualTypeOf<string>()
    }
  })
})
