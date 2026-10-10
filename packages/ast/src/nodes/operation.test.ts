import { describe, expect, expectTypeOf, it } from 'vitest'
import { createContent } from './content.ts'
import { createOperation } from './operation.ts'
import { createSchema } from './schema.ts'

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

  it('keeps summary, deprecated and tags when given', () => {
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

  it('returns a RequestBodyNode when requestBody is a plain object', () => {
    const content = createContent({ contentType: 'application/json', schema: createSchema({ type: 'object' }) })
    const node = createOperation({
      operationId: 'createPet',
      method: 'POST',
      path: '/pets',
      requestBody: { required: true, description: 'A pet', content: [content] },
    })

    expect(node.requestBody).toStrictEqual({ kind: 'RequestBody', required: true, description: 'A pet', content: [content] })
  })
})
