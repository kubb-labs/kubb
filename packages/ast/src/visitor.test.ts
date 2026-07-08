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
import { collect, transform } from './visitor.ts'

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
