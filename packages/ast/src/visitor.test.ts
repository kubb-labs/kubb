import { describe, expect, expectTypeOf, it } from 'vitest'
import { createInput } from './nodes/input.ts'
import { createOperation } from './nodes/operation.ts'
import { createParameter } from './nodes/parameter.ts'
import { createProperty } from './nodes/property.ts'
import { createResponse } from './nodes/response.ts'
import { createSchema } from './nodes/schema.ts'
import type { ContentNode } from './nodes/content.ts'
import type { InputNode } from './nodes/input.ts'
import type { OperationNode } from './nodes/operation.ts'
import type { ParameterNode } from './nodes/parameter.ts'
import type { PropertyNode } from './nodes/property.ts'
import type { ResponseNode } from './nodes/response.ts'
import type { SchemaNode } from './nodes/schema.ts'
import type { ParentOf, VisitorContext } from './visitor.ts'
import { collect, transform, walk } from './visitor.ts'

/**
 * Builds a minimal sample AST with one `Pet` schema and one `getPetById` operation.
 */
function buildSampleTree(): InputNode {
  const petSchema = createSchema({
    type: 'object',
    name: 'Pet',
    properties: [
      createProperty({
        name: 'id',
        schema: createSchema({ type: 'integer' }),
        required: true,
      }),
      createProperty({
        name: 'name',
        schema: createSchema({ type: 'string' }),
        required: true,
      }),
    ],
  })

  const operation = createOperation({
    operationId: 'getPetById',
    method: 'GET',
    path: '/pets/{petId}',
    tags: ['pets'],
    parameters: [
      createParameter({
        name: 'petId',
        in: 'path',
        schema: createSchema({ type: 'integer' }),
        required: true,
      }),
    ],
    responses: [
      createResponse({
        statusCode: '200',
        schema: createSchema({ type: 'ref', name: 'Pet' }),
      }),
      createResponse({
        statusCode: '404',
        schema: createSchema({ type: 'ref', name: 'Error' }),
      }),
    ],
  })

  return createInput({ schemas: [petSchema], operations: [operation] })
}

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

    expect(ids).toStrictEqual(['getPetById'])
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

  it('actually runs sibling visitors concurrently up to the limit', async () => {
    // Five sibling schemas under the root — with concurrency 3 the limiter should
    // keep exactly three callbacks in flight at once, never one (serial) or five.
    const root = createInput({
      schemas: [
        createSchema({ type: 'string' }),
        createSchema({ type: 'number' }),
        createSchema({ type: 'boolean' }),
        createSchema({ type: 'integer' }),
        createSchema({ type: 'null' }),
      ],
    })

    let maxConcurrent = 0
    let current = 0

    await walk(root, {
      concurrency: 3,
      async schema() {
        current++
        if (current > maxConcurrent) maxConcurrent = current
        await new Promise((r) => setTimeout(r, 5))
        current--
      },
    })

    expect(maxConcurrent).toBe(3)
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
  it('preserves identity when nothing changes (structural sharing)', () => {
    const root = buildSampleTree()

    // A no-op transform returns the exact same reference.
    expect(transform(root, {})).toBe(root)
    // Visitors that return their input unchanged are also no-ops.
    expect(transform(root, { schema: (schema) => schema, operation: (operation) => operation })).toBe(root)
  })

  it('reuses untouched subtrees when only one branch changes', () => {
    const root = buildSampleTree()
    const result = transform(root, {
      operation(op): OperationNode {
        return { ...op, operationId: `api_${op.operationId}` }
      },
    })

    // The root and the operations branch are rebuilt...
    expect(result).not.toBe(root)
    expect(result.operations).not.toBe(root.operations)
    expect(result.operations[0]?.operationId).toBe('api_getPetById')
    // ...but the untouched schemas branch keeps its references.
    expect(result.schemas).toBe(root.schemas)
    expect(result.schemas[0]).toBe(root.schemas[0])
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
    expectTypeOf<ParentOf<SchemaNode>>().toEqualTypeOf<InputNode | ContentNode | SchemaNode | PropertyNode | ParameterNode>()
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
        expectTypeOf(context.parent).toEqualTypeOf<InputNode | ContentNode | SchemaNode | PropertyNode | ParameterNode | undefined>()
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
        expectTypeOf(context.parent).toEqualTypeOf<InputNode | ContentNode | SchemaNode | PropertyNode | ParameterNode | undefined>()
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
