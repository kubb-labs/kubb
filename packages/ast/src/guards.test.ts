import { describe, expect, expectTypeOf, it } from 'vitest'
import { createOperation, createParameter, createProperty, createResponse, createRoot, createSchema } from './factory.ts'
import { isOperationNode, isParameterNode, isPropertyNode, isResponseNode, isRootNode, isSchemaNode, narrowSchema } from './guards.ts'
import type { Node } from './nodes/index.ts'
import type { OperationNode } from './nodes/operation.ts'
import type { ParameterNode } from './nodes/parameter.ts'
import type { PropertyNode } from './nodes/property.ts'
import type { ResponseNode } from './nodes/response.ts'
import type { RootNode } from './nodes/root.ts'
import type { ObjectSchemaNode, SchemaNode, StringSchemaNode, UnionSchemaNode } from './nodes/schema.ts'

describe('isRootNode', () => {
  it('returns true for RootNode', () => {
    expect(isRootNode(createRoot())).toBe(true)
  })
  it('returns false for other nodes', () => {
    expect(isRootNode(createSchema({ type: 'string' }))).toBe(false)
    expect(isRootNode(createOperation({ operationId: 'op', method: 'GET', path: '/' }))).toBe(false)
  })
  it('narrows to RootNode in a conditional', () => {
    const node: Node = createRoot()
    if (isRootNode(node)) {
      expectTypeOf(node).toEqualTypeOf<RootNode>()
    }
  })
})

describe('isOperationNode', () => {
  it('returns true for OperationNode', () => {
    expect(isOperationNode(createOperation({ operationId: 'op', method: 'GET', path: '/' }))).toBe(true)
  })
  it('returns false for other nodes', () => {
    expect(isOperationNode(createRoot())).toBe(false)
  })
  it('narrows to OperationNode in a conditional', () => {
    const node: Node = createOperation({ operationId: 'op', method: 'GET', path: '/' })
    if (isOperationNode(node)) {
      expectTypeOf(node).toEqualTypeOf<OperationNode>()
    }
  })
})

describe('isSchemaNode', () => {
  it('returns true for SchemaNode', () => {
    expect(isSchemaNode(createSchema({ type: 'string' }))).toBe(true)
  })
  it('returns false for other nodes', () => {
    expect(isSchemaNode(createRoot())).toBe(false)
  })
  it('narrows to SchemaNode in a conditional', () => {
    const node: Node = createSchema({ type: 'string' })
    if (isSchemaNode(node)) {
      expectTypeOf(node).toMatchTypeOf<SchemaNode>()
    }
  })
})

describe('isParameterNode', () => {
  it('returns true for ParameterNode', () => {
    expect(isParameterNode(createParameter({ name: 'id', in: 'path', schema: createSchema({ type: 'string' }) }))).toBe(true)
  })
  it('returns false for other nodes', () => {
    expect(isParameterNode(createSchema({ type: 'string' }))).toBe(false)
  })
  it('narrows to ParameterNode in a conditional', () => {
    const node: Node = createParameter({ name: 'id', in: 'path', schema: createSchema({ type: 'string' }) })
    if (isParameterNode(node)) {
      expectTypeOf(node).toEqualTypeOf<ParameterNode>()
    }
  })
})

describe('isPropertyNode', () => {
  it('returns true for PropertyNode', () => {
    expect(isPropertyNode(createProperty({ name: 'id', schema: createSchema({ type: 'integer' }) }))).toBe(true)
  })
  it('returns false for non-property nodes', () => {
    expect(isPropertyNode(createSchema({ type: 'string' }))).toBe(false)
  })
  it('narrows to PropertyNode in a conditional', () => {
    const node: Node = createProperty({ name: 'id', schema: createSchema({ type: 'integer' }) })
    if (isPropertyNode(node)) {
      expectTypeOf(node).toEqualTypeOf<PropertyNode>()
    }
  })
})

describe('isResponseNode', () => {
  it('returns true for ResponseNode', () => {
    expect(
      isResponseNode(
        createResponse({
          statusCode: '200',
          schema: createSchema({
            type: 'string',
          }),
        }),
      ),
    ).toBe(true)
  })
  it('returns false for other nodes', () => {
    expect(isResponseNode(createRoot())).toBe(false)
  })
  it('narrows to ResponseNode in a conditional', () => {
    const node: Node = createResponse({
      statusCode: '200',
      schema: createSchema({
        type: 'string',
      }),
    })
    if (isResponseNode(node)) {
      expectTypeOf(node).toEqualTypeOf<ResponseNode>()
    }
  })
})

describe('narrowSchema', () => {
  it('returns the node when type matches', () => {
    const node = createSchema({ type: 'object', properties: [] })
    const result = narrowSchema(node, 'object')

    expect(result).toBe(node)
    expect(result?.type).toBe('object')
  })

  it('returns undefined when type does not match', () => {
    expect(narrowSchema(createSchema({ type: 'string' }), 'object')).toBeUndefined()
  })

  it('returns undefined when node is undefined', () => {
    expect(narrowSchema(undefined, 'string')).toBeUndefined()
  })

  it('narrows return type to ObjectSchemaNode | undefined for "object"', () => {
    expectTypeOf(narrowSchema(createSchema({ type: 'object' }), 'object')).toEqualTypeOf<ObjectSchemaNode | undefined>()
  })

  it('narrows return type to StringSchemaNode | undefined for "string"', () => {
    expectTypeOf(narrowSchema(createSchema({ type: 'string' }), 'string')).toEqualTypeOf<StringSchemaNode | undefined>()
  })

  it('narrows return type to UnionSchemaNode | undefined for "union"', () => {
    expectTypeOf(narrowSchema(createSchema({ type: 'union' }), 'union')).toEqualTypeOf<UnionSchemaNode | undefined>()
  })
})
