import { describe, expect, expectTypeOf, it } from 'vitest'
import { buildSampleTree } from './mocks.ts'
import type { OperationNode } from './nodes/operation.ts'
import type { RootNode } from './nodes/root.ts'
import type { SchemaNode } from './nodes/schema.ts'
import { collect, transform, walk } from './visitor.ts'

describe('walk', () => {
  it('visits all node kinds in a tree', async () => {
    const root = buildSampleTree()
    const visited = {
      root: 0,
      operation: 0,
      schema: 0,
      property: 0,
      parameter: 0,
      response: 0,
    }

    await walk(root, {
      root() {
        visited.root++
      },
      operation() {
        visited.operation++
      },
      schema() {
        visited.schema++
      },
      property() {
        visited.property++
      },
      parameter() {
        visited.parameter++
      },
      response() {
        visited.response++
      },
    })

    expect(visited.root).toBe(1)
    expect(visited.operation).toBe(1)
    expect(visited.property).toBe(2) // id + name
    expect(visited.parameter).toBe(1) // petId
    expect(visited.response).toBe(2) // 200 + 404
    // schemas: petSchema(object) + id(integer) + name(string) + petId param(integer) + 200 response ref + parameter schema
    expect(visited.schema).toBeGreaterThanOrEqual(5)
  })

  it('accepts a partial visitor (only some methods)', async () => {
    const root = buildSampleTree()
    const ids: Array<string> = []
    await walk(root, {
      operation(op) {
        ids.push(op.operationId)
      },
    })

    expect(ids).toEqual(['getPetById'])
  })

  it('does not mutate the original tree', async () => {
    const root = buildSampleTree()
    const original = JSON.stringify(root)
    await walk(root, {
      operation(op) {
        return { ...op, operationId: 'mutated' }
      },
    })

    expect(JSON.stringify(root)).toBe(original)
  })

  it('respects concurrency option', async () => {
    const root = buildSampleTree()
    let maxConcurrent = 0
    let current = 0
    const order: Array<string> = []

    await walk(
      root,
      {
        async schema(s) {
          current++
          if (current > maxConcurrent) maxConcurrent = current
          await new Promise((r) => setTimeout(r, 5))
          order.push(s.type)
          current--
        },
      },
      { concurrency: 2 },
    )

    expect(maxConcurrent).toBeLessThanOrEqual(2)
    expect(order.length).toBeGreaterThan(0)
  })

  it('does not recurse into schema properties/items/members when depth: shallow', async () => {
    const root = buildSampleTree()
    const schemaTypes: Array<string> = []
    const propertyNames: Array<string> = []

    await walk(
      root,
      {
        schema(s) {
          schemaTypes.push(s.type)
        },
        property(p) {
          propertyNames.push(p.name)
        },
      },
      { depth: 'shallow' },
    )

    // Top-level Pet object schema is visited
    expect(schemaTypes).toContain('object')
    // Parameter schema (integer) is still visited — it's not a schema property
    expect(schemaTypes).toContain('integer')
    // Properties of Pet are NOT descended into, so 'string' (Pet.name) is absent
    expect(schemaTypes).not.toContain('string')
    // PropertyNodes are NOT visited since the object schema doesn't recurse into them
    expect(propertyNames).toHaveLength(0)
  })
})

describe('transform', () => {
  it('returns a new tree without mutating the original', () => {
    const root = buildSampleTree()
    const result = transform(root, {})

    expect(result).not.toBe(root)
    expect(result.kind).toBe('Root')
  })

  it('return type matches input type via overloads', () => {
    const root = buildSampleTree()
    expectTypeOf(transform(root, {})).toEqualTypeOf<RootNode>()
  })

  it('replaces operations via visitor return value', () => {
    const root = buildSampleTree()
    const result = transform(root, {
      operation(op): OperationNode {
        return { ...op, operationId: `api_${op.operationId}` }
      },
    })

    expect(result.operations[0]?.operationId).toBe('api_getPetById')
    // Original unchanged
    expect(root.operations[0]?.operationId).toBe('getPetById')
  })

  it('replaces schemas via visitor return value', () => {
    const root = buildSampleTree()
    const result = transform(root, {
      schema(schema): SchemaNode {
        return { ...schema, description: 'transformed' }
      },
    })

    expect(result.schemas[0]?.description).toBe('transformed')
  })

  it('returns original node when visitor returns undefined', () => {
    const root = buildSampleTree()
    const unchanged = transform(root, {
      operation() {
        return undefined
      },
    })

    expect(unchanged.operations[0]?.operationId).toBe('getPetById')
  })

  it('deeply transforms nested schemas in operations', () => {
    const root = buildSampleTree()
    const types: Array<string> = []
    transform(root, {
      schema(schema): SchemaNode {
        types.push(schema.type)
        return schema
      },
    })

    expect(types).toContain('object')
    expect(types).toContain('integer')
    expect(types).toContain('string')
  })

  it('does not recurse into schema properties/items/members when depth: shallow', () => {
    const root = buildSampleTree()
    const types: Array<string> = []
    transform(
      root,
      {
        schema(schema): SchemaNode {
          types.push(schema.type)
          return schema
        },
      },
      { depth: 'shallow' },
    )

    // Top-level object schema is visited
    expect(types).toContain('object')
    // Parameter schema (integer) is still visited — not a schema property
    expect(types).toContain('integer')
    // 'string' (Pet.name property schema) is NOT visited — guarded by depth
    expect(types).not.toContain('string')
  })
})

describe('collect', () => {
  it('collects all schema types with default depth traversal', () => {
    const root = buildSampleTree()
    const types = collect<string>(root, {
      schema(n) {
        return n.type
      },
    })

    expect(types).toContain('object')
    expect(types).toContain('integer')
    expect(types).toContain('string')
  })

  it('collects only top-level schemas (not object properties) when depth: shallow', () => {
    const root = buildSampleTree()
    const types = collect<string>(
      root,
      {
        schema(n) {
          return n.type
        },
      },
      { depth: 'shallow' },
    )

    expect(types).toContain('object')
    // Parameter schema (integer) is still collected — not guarded by depth
    expect(types).toContain('integer')
    // 'string' (Pet.name property schema) is NOT collected — guarded by depth
    expect(types).not.toContain('string')
  })
})
