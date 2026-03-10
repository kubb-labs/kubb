import { describe, expect, it } from 'vitest'
import { createOperation, createParameter, createProperty, createResponse, createRoot, createSchema } from './factory.ts'
import type { OperationNode } from './nodes/operation.ts'
import type { RootNode } from './nodes/root.ts'
import type { SchemaNode } from './nodes/schema.ts'
import { transform, walk } from './visitor.ts'

function buildSampleTree(): RootNode {
  const petSchema = createSchema({
    type: 'object',
    name: 'Pet',
    properties: [
      createProperty({ name: 'id', schema: createSchema({ type: 'integer' }), required: true }),
      createProperty({ name: 'name', schema: createSchema({ type: 'string' }), required: true }),
    ],
  })

  const operation = createOperation({
    operationId: 'getPetById',
    method: 'GET',
    path: '/pets/{petId}',
    tags: ['pets'],
    parameters: [
      createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'integer' }), required: true }),
    ],
    responses: [
      createResponse({ statusCode: '200', schema: createSchema({ type: 'ref', ref: 'Pet' }) }),
      createResponse({ statusCode: '404' }),
    ],
  })

  return createRoot({ schemas: [petSchema], operations: [operation] })
}

describe('walk', () => {
  it('visits all node kinds in a tree', () => {
    const root = buildSampleTree()
    const visited = {
      root: 0,
      operation: 0,
      schema: 0,
      property: 0,
      parameter: 0,
      response: 0,
    }

    walk(root, {
      visitRoot() { visited.root++ },
      visitOperation() { visited.operation++ },
      visitSchema() { visited.schema++ },
      visitProperty() { visited.property++ },
      visitParameter() { visited.parameter++ },
      visitResponse() { visited.response++ },
    })

    expect(visited.root).toBe(1)
    expect(visited.operation).toBe(1)
    expect(visited.property).toBe(2) // id + name
    expect(visited.parameter).toBe(1) // petId
    expect(visited.response).toBe(2) // 200 + 404
    // schemas: petSchema(object) + id(integer) + name(string) + petId param(integer) + 200 response ref + parameter schema
    expect(visited.schema).toBeGreaterThanOrEqual(5)
  })

  it('accepts a partial visitor (only some methods)', () => {
    const root = buildSampleTree()
    const ids: Array<string> = []
    walk(root, {
      visitOperation(op) { ids.push(op.operationId) },
    })
    expect(ids).toEqual(['getPetById'])
  })

  it('does not mutate the original tree', () => {
    const root = buildSampleTree()
    const original = JSON.stringify(root)
    walk(root, { visitOperation(op) { return { ...op, operationId: 'mutated' } } })
    expect(JSON.stringify(root)).toBe(original)
  })
})

describe('transform', () => {
  it('returns a new tree without mutating the original', () => {
    const root = buildSampleTree()
    const result = transform(root, {}) as RootNode
    expect(result).not.toBe(root)
    expect(result.kind).toBe('Root')
  })

  it('replaces operations via visitor return value', () => {
    const root = buildSampleTree()
    const result = transform(root, {
      visitOperation(op): OperationNode {
        return { ...op, operationId: `api_${op.operationId}` }
      },
    }) as RootNode

    expect(result.operations[0]?.operationId).toBe('api_getPetById')
    // Original unchanged
    expect(root.operations[0]?.operationId).toBe('getPetById')
  })

  it('replaces schemas via visitor return value', () => {
    const root = buildSampleTree()
    const result = transform(root, {
      visitSchema(schema): SchemaNode {
        return { ...schema, description: 'transformed' }
      },
    }) as RootNode

    expect(result.schemas[0]?.description).toBe('transformed')
  })

  it('returns original node when visitor returns undefined', () => {
    const root = buildSampleTree()
    const unchanged = transform(root, {
      visitOperation() { return undefined },
    }) as RootNode

    expect(unchanged.operations[0]?.operationId).toBe('getPetById')
  })

  it('deeply transforms nested schemas in operations', () => {
    const root = buildSampleTree()
    const types: Array<string> = []
    transform(root, {
      visitSchema(schema): SchemaNode {
        types.push(schema.type)
        return schema
      },
    })

    expect(types).toContain('object')
    expect(types).toContain('integer')
    expect(types).toContain('string')
  })
})
