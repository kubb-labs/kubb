import { describe, expect, expectTypeOf, it } from 'vitest'
import { createProperty, createSchema } from './factory.ts'
import { buildSampleTree } from './mocks.ts'
import type { OperationNode } from './nodes/operation.ts'
import type { ParameterNode } from './nodes/parameter.ts'
import type { PropertyNode } from './nodes/property.ts'
import type { ResponseNode } from './nodes/response.ts'
import type { InputNode } from './nodes/root.ts'
import type { SchemaNode } from './nodes/schema.ts'
import type { ParentOf, VisitorContext } from './visitor.ts'
import { collect, transform, walk } from './visitor.ts'

describe('walk', () => {
  it('visits all node kinds in a tree', async () => {
    const root = buildSampleTree()
    const visited = {
      input: 0,
      operation: 0,
      schema: 0,
      property: 0,
      parameter: 0,
      response: 0,
    }

    await walk(root, {
      input() {
        visited.input++
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

    expect(visited.input).toBe(1)
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

    await walk(root, {
      concurrency: 2,
      async schema(s) {
        current++
        if (current > maxConcurrent) maxConcurrent = current
        await new Promise((r) => setTimeout(r, 5))
        order.push(s.type)
        current--
      },
    })

    expect(maxConcurrent).toBeLessThanOrEqual(2)
    expect(order.length).toBeGreaterThan(0)
  })

  it('does not recurse into schema properties/items/members when depth: shallow', async () => {
    const root = buildSampleTree()
    const schemaTypes: Array<string> = []
    const propertyNames: Array<string> = []

    await walk(root, {
      depth: 'shallow',
      schema(s) {
        schemaTypes.push(s.type)
      },
      property(p) {
        propertyNames.push(p.name)
      },
    })

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
    expect(result.kind).toBe('Input')
  })

  it('return type matches input type via overloads', () => {
    const root = buildSampleTree()
    expectTypeOf(transform(root, {})).toEqualTypeOf<InputNode>()
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
    transform(root, {
      depth: 'shallow',
      schema(schema): SchemaNode {
        types.push(schema.type)
        return schema
      },
    })

    // Top-level object schema is visited
    expect(types).toContain('object')
    // Parameter schema (integer) is still visited — not a schema property
    expect(types).toContain('integer')
    // 'string' (Pet.name property schema) is NOT visited — guarded by depth
    expect(types).not.toContain('string')
  })
})

describe('syncOptionality — auto-derived optional/nullish', () => {
  it('setting required: true via transformer clears schema.optional', () => {
    const node = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({
          name: 'tag',
          schema: createSchema({ type: 'string' }),
          required: false,
        }),
      ],
    })

    // Verify baseline: optional property has schema.optional = true
    if (node.type === 'object') {
      expect(node.properties[0]?.schema.optional).toBe(true)
    }

    const result = transform(node, {
      property(prop): PropertyNode {
        return { ...prop, required: true }
      },
    })

    if (result.type === 'object') {
      const tag = result.properties[0]!
      expect(tag.required).toBe(true)
      expect(tag.schema.optional).toBeUndefined()
      expect(tag.schema.nullish).toBeUndefined()
    }
  })

  it('setting required: false via transformer sets schema.optional for non-nullable', () => {
    const node = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({
          name: 'name',
          schema: createSchema({ type: 'string' }),
          required: true,
        }),
      ],
    })

    const result = transform(node, {
      property(prop): PropertyNode {
        return { ...prop, required: false }
      },
    })

    if (result.type === 'object') {
      const name = result.properties[0]!
      expect(name.required).toBe(false)
      expect(name.schema.optional).toBe(true)
      expect(name.schema.nullish).toBeUndefined()
    }
  })

  it('setting required: false on nullable schema sets schema.nullish', () => {
    const node = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({
          name: 'tag',
          schema: createSchema({ type: 'string', nullable: true }),
          required: true,
        }),
      ],
    })

    // Baseline: required + nullable = no optional/nullish
    if (node.type === 'object') {
      expect(node.properties[0]?.schema.optional).toBeUndefined()
      expect(node.properties[0]?.schema.nullish).toBeUndefined()
    }

    const result = transform(node, {
      property(prop): PropertyNode {
        return { ...prop, required: false }
      },
    })

    if (result.type === 'object') {
      const tag = result.properties[0]!
      expect(tag.required).toBe(false)
      expect(tag.schema.optional).toBeUndefined()
      expect(tag.schema.nullish).toBe(true)
      expect(tag.schema.nullable).toBe(true)
    }
  })

  it('property transformer targeting a specific parent schema auto-syncs', () => {
    const node = createSchema({
      type: 'object',
      name: 'Address',
      properties: [
        createProperty({
          name: 'street',
          schema: createSchema({ type: 'string' }),
          required: false,
        }),
        createProperty({
          name: 'city',
          schema: createSchema({ type: 'string' }),
          required: false,
        }),
      ],
    })

    const result = transform(node, {
      property(prop, { parent }) {
        if (parent?.kind === 'Schema' && 'name' in parent && parent.name === 'Address') {
          return { ...prop, required: true }
        }
      },
    })

    if (result.type === 'object') {
      for (const prop of result.properties) {
        expect(prop.required).toBe(true)
        expect(prop.schema.optional).toBeUndefined()
        expect(prop.schema.nullish).toBeUndefined()
      }
    }
  })
})

describe('VisitorContext — parent', () => {
  it('property visitor receives parent schema via context', () => {
    const node = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({
          name: 'name',
          schema: createSchema({ type: 'string' }),
          required: true,
        }),
        createProperty({
          name: 'tag',
          schema: createSchema({ type: 'string' }),
          required: false,
        }),
      ],
    })

    const result = transform(node, {
      property(prop, { parent }) {
        if (parent?.kind === 'Schema' && 'name' in parent && parent.name === 'Pet' && prop.name === 'tag') {
          return { ...prop, required: true }
        }
      },
    })

    if (result.type === 'object') {
      expect(result.properties.find((p) => p.name === 'tag')?.required).toBe(true)
      expect(result.properties.find((p) => p.name === 'name')?.required).toBe(true)
    }
  })

  it('property visitor ignores properties from other schemas', () => {
    const root = buildSampleTree()

    const names: Array<string> = []
    transform(root, {
      property(prop, { parent }) {
        if (parent?.kind === 'Schema' && 'name' in parent) {
          names.push(`${parent.name}.${prop.name}`)
        }
      },
    })

    expect(names).toContain('Pet.name')
  })

  it('schema visitor receives parent input node', () => {
    const root = buildSampleTree()

    let parentKind: string | undefined
    transform(root, {
      schema(_node, { parent }) {
        if (!parentKind && parent) {
          parentKind = parent.kind
        }
      },
    })

    expect(parentKind).toBe('Input')
  })

  it('operation visitor receives parent input node', () => {
    const root = buildSampleTree()

    let parentKind: string | undefined
    transform(root, {
      operation(_node, { parent }) {
        if (parent) {
          parentKind = parent.kind
        }
      },
    })

    expect(parentKind).toBe('Input')
  })

  it('input visitor has no parent', () => {
    const root = buildSampleTree()

    let hasParent = false
    transform(root, {
      input(_node, { parent }) {
        hasParent = !!parent
      },
    })

    expect(hasParent).toBe(false)
  })

  it('walk passes parent context', async () => {
    const root = buildSampleTree()

    const pairs: Array<string> = []
    await walk(root, {
      property(prop, { parent }) {
        if (parent?.kind === 'Schema' && 'name' in parent) {
          pairs.push(`${parent.name}.${prop.name}`)
        }
      },
    })

    expect(pairs).toContain('Pet.name')
  })
})

describe('ParentOf — type inference', () => {
  it('InputNode parent is always undefined', () => {
    expectTypeOf<ParentOf<InputNode>>().toEqualTypeOf<undefined>()
  })

  it('OperationNode parent is InputNode', () => {
    expectTypeOf<ParentOf<OperationNode>>().toEqualTypeOf<InputNode>()
  })

  it('PropertyNode parent is SchemaNode', () => {
    expectTypeOf<ParentOf<PropertyNode>>().toEqualTypeOf<SchemaNode>()
  })

  it('ParameterNode parent is OperationNode', () => {
    expectTypeOf<ParentOf<ParameterNode>>().toEqualTypeOf<OperationNode>()
  })

  it('ResponseNode parent is OperationNode', () => {
    expectTypeOf<ParentOf<ResponseNode>>().toEqualTypeOf<OperationNode>()
  })

  it('SchemaNode parent is a union of possible parents', () => {
    expectTypeOf<ParentOf<SchemaNode>>().toEqualTypeOf<InputNode | OperationNode | SchemaNode | PropertyNode | ParameterNode | ResponseNode>()
  })

  it('VisitorContext narrows parent for PropertyNode', () => {
    expectTypeOf<VisitorContext<PropertyNode>['parent']>().toEqualTypeOf<SchemaNode | undefined>()
  })

  it('VisitorContext narrows parent for OperationNode', () => {
    expectTypeOf<VisitorContext<OperationNode>['parent']>().toEqualTypeOf<InputNode | undefined>()
  })

  it('VisitorContext narrows parent for InputNode to undefined', () => {
    expectTypeOf<VisitorContext<InputNode>['parent']>().toEqualTypeOf<undefined>()
  })

  it('visitor callbacks receive narrowed context', () => {
    transform(buildSampleTree(), {
      property(_prop, context) {
        expectTypeOf(context.parent).toEqualTypeOf<SchemaNode | undefined>()
      },
      operation(_op, context) {
        expectTypeOf(context.parent).toEqualTypeOf<InputNode | undefined>()
      },
      schema(_schema, context) {
        expectTypeOf(context.parent).toEqualTypeOf<InputNode | OperationNode | SchemaNode | PropertyNode | ParameterNode | ResponseNode | undefined>()
      },
      parameter(_param, context) {
        expectTypeOf(context.parent).toEqualTypeOf<OperationNode | undefined>()
      },
      response(_res, context) {
        expectTypeOf(context.parent).toEqualTypeOf<OperationNode | undefined>()
      },
      input(_input, context) {
        expectTypeOf(context.parent).toEqualTypeOf<undefined>()
      },
    })
  })

  it('walk callbacks receive narrowed context', async () => {
    await walk(buildSampleTree(), {
      property(_prop, context) {
        expectTypeOf(context.parent).toEqualTypeOf<SchemaNode | undefined>()
      },
      operation(_op, context) {
        expectTypeOf(context.parent).toEqualTypeOf<InputNode | undefined>()
      },
      parameter(_param, context) {
        expectTypeOf(context.parent).toEqualTypeOf<OperationNode | undefined>()
      },
    })
  })

  it('collect callbacks receive narrowed context', () => {
    collect<string>(buildSampleTree(), {
      property(_prop, context) {
        expectTypeOf(context.parent).toEqualTypeOf<SchemaNode | undefined>()
        return 'test'
      },
      schema(_schema, context) {
        expectTypeOf(context.parent).toEqualTypeOf<InputNode | OperationNode | SchemaNode | PropertyNode | ParameterNode | ResponseNode | undefined>()
        return 'test'
      },
    })
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
    const types = collect<string>(root, {
      depth: 'shallow',
      schema(n) {
        return n.type
      },
    })

    expect(types).toContain('object')
    // Parameter schema (integer) is still collected — not guarded by depth
    expect(types).toContain('integer')
    // 'string' (Pet.name property schema) is NOT collected — guarded by depth
    expect(types).not.toContain('string')
  })
})
