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
import type { SchemaNode } from './nodes/schema.ts'
import { collectSync, transform } from './visitor.ts'

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

describe('transform', () => {
  it('preserves identity when nothing changes (structural sharing)', () => {
    const root = buildSampleTree()

    // A no-op transform returns the exact same reference.
    expect(transform(root, {})).toBe(root)
    // Visitors that return their input unchanged are also no-ops.
    expect(transform(root, { schema: (schema) => schema, operation: (operation) => operation })).toBe(root)
  })

  it('rebuilds the changed branch and reuses untouched subtrees when a visitor returns a new node', () => {
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
    // ...the original is left as is...
    expect(root.operations[0]?.operationId).toBe('getPetById')
    // ...and the untouched schemas branch keeps its references.
    expect(result.schemas).toBe(root.schemas)
    expect(result.schemas[0]).toBe(root.schemas[0])
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

  it('rebuilds a schema inside patternProperties and keeps the record when nothing changes', () => {
    const root = createInput({
      schemas: [createSchema({ type: 'object', name: 'Map', properties: [], patternProperties: { '^x-': createSchema({ type: 'ref', name: 'Extension' }) } })],
    })

    const renamed = transform(root, {
      schema(n): SchemaNode {
        return n.type === 'ref' ? { ...n, name: 'Renamed' } : n
      },
    })
    const untouched = transform(root, { schema: (n) => n })

    const map = renamed.schemas[0]
    expect(map?.type === 'object' ? map.patternProperties?.['^x-']?.name : undefined).toBe('Renamed')
    expect(untouched).toBe(root)
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
  it('passes the owning schema as parent to the property visitor', () => {
    const root = createInput({
      schemas: [
        createSchema({
          type: 'object',
          name: 'Pet',
          properties: [createProperty({ name: 'tag', schema: createSchema({ type: 'string' }), required: false })],
        }),
        createSchema({
          type: 'object',
          name: 'Order',
          properties: [createProperty({ name: 'tag', schema: createSchema({ type: 'string' }), required: false })],
        }),
      ],
    })

    const result = transform(root, {
      property(prop, { parent }) {
        if (parent?.kind === 'Schema' && 'name' in parent && parent.name === 'Pet' && prop.name === 'tag') {
          return { ...prop, required: true }
        }
      },
    })

    const [pet, order] = result.schemas
    expect(pet?.type === 'object' ? pet.properties[0]?.required : undefined).toBe(true)
    expect(order?.type === 'object' ? order.properties[0]?.required : undefined).toBe(false)
  })

  it('passes the Input node as parent to schema and operation visitors and no parent to the input visitor', () => {
    const root = buildSampleTree()
    const parents: Record<string, string | undefined> = {}

    transform(root, {
      input(_node, { parent }) {
        parents.input = parent === undefined ? 'none' : 'some'
      },
      schema(_node, { parent }) {
        parents.schema ??= parent?.kind
      },
      operation(_node, { parent }) {
        parents.operation = parent?.kind
      },
    })

    expect(parents).toStrictEqual({ input: 'none', schema: 'Input', operation: 'Input' })
  })

  it('visitor callbacks receive narrowed context', () => {
    expectTypeOf(transform(buildSampleTree(), {})).toEqualTypeOf<InputNode>()

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

    collectSync<string>(buildSampleTree(), {
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

describe('collectSync', () => {
  it('collects all schema types with default depth traversal', () => {
    const root = buildSampleTree()
    const types = collectSync<string>(root, {
      schema(n) {
        return n.type
      },
    })

    expect(types).toContain('object')
    expect(types).toContain('integer')
    expect(types).toContain('string')
  })

  it('collects schemas inside a tuple rest and patternProperties', () => {
    const root = createInput({
      schemas: [
        createSchema({ type: 'tuple', name: 'Pair', items: [createSchema({ type: 'string' })], rest: createSchema({ type: 'ref', name: 'Tail' }) }),
        createSchema({ type: 'object', name: 'Map', properties: [], patternProperties: { '^x-': createSchema({ type: 'ref', name: 'Extension' }) } }),
      ],
    })

    const names = collectSync<string>(root, {
      schema(n) {
        return n.type === 'ref' ? (n.name ?? undefined) : undefined
      },
    })

    expect(names).toStrictEqual(['Tail', 'Extension'])
  })

  it('collects only top-level schemas (not object properties) when depth: shallow', () => {
    const root = buildSampleTree()
    const types = collectSync<string>(root, {
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
