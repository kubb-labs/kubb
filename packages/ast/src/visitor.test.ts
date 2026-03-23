import { describe, expect, expectTypeOf, it } from 'vitest'
import { createProperty, createSchema } from './factory.ts'
import { buildSampleTree } from './mocks.ts'
import type { OperationNode } from './nodes/operation.ts'
import type { PropertyNode } from './nodes/property.ts'
import type { RootNode } from './nodes/root.ts'
import type { SchemaNode } from './nodes/schema.ts'
import { collect, composeTransformers, transform, walk } from './visitor.ts'

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
    // schemas: petSchema(object) + id(integer) + name(string) + petId param(integer) + 200 response(ref) + 404 response(ref)
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

describe('composeTransformers', () => {
  it('returns a no-op visitor when given no arguments', () => {
    const root = buildSampleTree()
    const result = transform(root, composeTransformers())

    expect(result.operations[0]?.operationId).toBe('getPetById')
  })

  it('single visitor behaves identically to using it directly', () => {
    const root = buildSampleTree()

    const visitor = {
      operation(op: OperationNode): OperationNode {
        return { ...op, operationId: `prefixed_${op.operationId}` }
      },
    }

    const direct = transform(root, visitor)
    const composed = transform(root, composeTransformers(visitor))

    expect(direct.operations[0]?.operationId).toBe(composed.operations[0]?.operationId)
    expect(composed.operations[0]?.operationId).toBe('prefixed_getPetById')
  })

  it('chains multiple schema visitors left to right', () => {
    const node = createSchema({ type: 'object', name: 'Test', properties: [] })

    const first = {
      schema(s: SchemaNode): SchemaNode {
        return { ...s, description: 'first' }
      },
    }
    const second = {
      schema(s: SchemaNode): SchemaNode {
        return { ...s, description: `${s.description}+second` }
      },
    }

    const result = transform(node, composeTransformers(first, second))

    expect(result.description).toBe('first+second')
  })

  it('later visitor sees changes from earlier visitor', () => {
    const node = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({ name: 'age', schema: createSchema({ type: 'integer' }), required: true }),
      ],
    })

    const makeOptional = {
      property(p: PropertyNode): PropertyNode {
        return { ...p, required: false }
      },
    }
    const checkOptional = {
      property(p: PropertyNode): PropertyNode | void {
        if (!p.required) {
          return { ...p, name: `optional_${p.name}` }
        }
      },
    }

    const result = transform(node, composeTransformers(makeOptional, checkOptional))

    if (result.type === 'object') {
      expect(result.properties[0]?.name).toBe('optional_age')
      expect(result.properties[0]?.required).toBe(false)
    }
  })

  it('visitors without matching handler pass node through', () => {
    const node = createSchema({ type: 'string', name: 'Name' })

    const operationOnly = {
      operation(op: OperationNode): OperationNode {
        return { ...op, operationId: 'changed' }
      },
    }

    const result = transform(node, composeTransformers(operationOnly))

    expect(result.type).toBe('string')
    expect(result.name).toBe('Name')
  })

  it('no-op visitor returns node unchanged', () => {
    const node = createSchema({ type: 'string' })
    const result = transform(node, composeTransformers({}))

    expect(result).toEqual(node)
  })

  it('single visitor modifies schema type', () => {
    const node = createSchema({ type: 'date', representation: 'string' })

    const result = transform(node, composeTransformers({
      schema(n): SchemaNode {
        if (n.type === 'date') {
          return createSchema({ type: 'string', name: n.name })
        }
        return n
      },
    }))

    expect(result.type).toBe('string')
  })

  it('property-level visitor modifies properties', () => {
    const node = createSchema({
      type: 'object',
      name: 'User',
      properties: [
        createProperty({ name: 'email', schema: createSchema({ type: 'string' }), required: true }),
        createProperty({ name: 'password', schema: createSchema({ type: 'string' }), required: true }),
      ],
    })

    const result = transform(node, composeTransformers({
      property(n): PropertyNode | void {
        if (n.name === 'password') {
          return { ...n, required: false }
        }
      },
    }))

    expect(result.type).toBe('object')

    if (result.type === 'object') {
      const passwordProp = result.properties.find((p) => p.name === 'password')
      expect(passwordProp?.required).toBe(false)
    }
  })

  it('schema visitor replaces enum with string', () => {
    const node = createSchema({
      type: 'enum',
      name: 'Status',
      values: [
        { value: 'active', name: 'active' },
        { value: 'inactive', name: 'inactive' },
      ],
    })

    const result = transform(node, composeTransformers({
      schema(n) {
        if (n.type === 'enum') {
          return createSchema({ type: 'string', name: n.name })
        }
      },
    }))

    expect(result.type).toBe('string')
    expect(result.name).toBe('Status')
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
