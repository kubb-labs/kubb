import { describe, expect, expectTypeOf, it } from 'vitest'
import { createInput, createOperation, createSchema } from './factory.ts'
import {
  isArrowFunctionNode,
  isBreakNode,
  isConstNode,
  isContentNode,
  isExportNode,
  isFileNode,
  isFunctionNode,
  isFunctionParameterNode,
  isFunctionParametersNode,
  isHttpOperationNode,
  isImportNode,
  isInputNode,
  isJsxNode,
  isOperationNode,
  isOutputNode,
  isParameterGroupNode,
  isParameterNode,
  isParamsTypeNode,
  isPropertyNode,
  isRequestBodyNode,
  isResponseNode,
  isSchemaNode,
  isSourceNode,
  isTextNode,
  isTypeNode,
  narrowSchema,
} from './guards.ts'
import type { NodeKind } from './nodes/base.ts'
import type { Node } from './nodes/index.ts'
import type { InputNode } from './nodes/input.ts'
import type { HttpMethod, OperationNode } from './nodes/operation.ts'
import type { ObjectSchemaNode, SchemaNode, StringSchemaNode, UnionSchemaNode } from './nodes/schema.ts'

describe('isInputNode', () => {
  it('returns true for InputNode', () => {
    expect(isInputNode(createInput())).toBe(true)
  })
  it('returns false for other nodes', () => {
    expect(isInputNode(createSchema({ type: 'string' }))).toBe(false)
    expect(isInputNode(createOperation({ operationId: 'op', method: 'GET', path: '/' }))).toBe(false)
  })
  it('narrows to InputNode in a conditional', () => {
    const node: Node = createInput()
    if (isInputNode(node)) {
      expectTypeOf(node).toEqualTypeOf<InputNode>()
    }
  })
})

describe('isOperationNode', () => {
  it('returns true for OperationNode', () => {
    expect(isOperationNode(createOperation({ operationId: 'op', method: 'GET', path: '/' }))).toBe(true)
  })
  it('returns false for other nodes', () => {
    expect(isOperationNode(createInput())).toBe(false)
  })
  it('narrows to OperationNode in a conditional', () => {
    const node: Node = createOperation({
      operationId: 'op',
      method: 'GET',
      path: '/',
    })
    if (isOperationNode(node)) {
      expectTypeOf(node).toMatchTypeOf<OperationNode>()
    }
  })
})

describe('isHttpOperationNode', () => {
  it('returns true for an HTTP operation', () => {
    expect(isHttpOperationNode(createOperation({ operationId: 'op', method: 'GET', path: '/' }))).toBe(true)
  })
  it('returns false for a generic operation without method/path', () => {
    expect(isHttpOperationNode(createOperation({ operationId: 'op' }))).toBe(false)
  })
  it('narrows method/path to non-nullable in a conditional', () => {
    const node: OperationNode = createOperation({ operationId: 'op', method: 'GET', path: '/' })
    if (isHttpOperationNode(node)) {
      expectTypeOf(node.method).toEqualTypeOf<HttpMethod>()
      expectTypeOf(node.path).toEqualTypeOf<string>()
    }
  })
})

describe('isSchemaNode', () => {
  it('returns true for SchemaNode', () => {
    expect(isSchemaNode(createSchema({ type: 'string' }))).toBe(true)
  })
  it('returns false for other nodes', () => {
    expect(isSchemaNode(createInput())).toBe(false)
  })
  it('narrows to SchemaNode in a conditional', () => {
    const node: Node = createSchema({ type: 'string' })
    if (isSchemaNode(node)) {
      expectTypeOf(node).toMatchTypeOf<SchemaNode>()
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

  it('returns null when type does not match', () => {
    expect(narrowSchema(createSchema({ type: 'string' }), 'object')).toBeNull()
  })

  it('returns null when node is undefined', () => {
    expect(narrowSchema(undefined, 'string')).toBeNull()
  })

  it('narrows return type to ObjectSchemaNode | null for "object"', () => {
    expectTypeOf(narrowSchema(createSchema({ type: 'object' }), 'object')).toEqualTypeOf<ObjectSchemaNode | null>()
  })

  it('narrows return type to StringSchemaNode | null for "string"', () => {
    expectTypeOf(narrowSchema(createSchema({ type: 'string' }), 'string')).toEqualTypeOf<StringSchemaNode | null>()
  })

  it('narrows return type to UnionSchemaNode | null for "union"', () => {
    expectTypeOf(narrowSchema(createSchema({ type: 'union' }), 'union')).toEqualTypeOf<UnionSchemaNode | null>()
  })
})

describe('node kind guards', () => {
  const guardsByKind: Array<[NodeKind, (node: unknown) => boolean]> = [
    ['Input', isInputNode],
    ['Output', isOutputNode],
    ['Operation', isOperationNode],
    ['RequestBody', isRequestBodyNode],
    ['Content', isContentNode],
    ['Response', isResponseNode],
    ['Schema', isSchemaNode],
    ['Property', isPropertyNode],
    ['Parameter', isParameterNode],
    ['FunctionParameter', isFunctionParameterNode],
    ['ParameterGroup', isParameterGroupNode],
    ['FunctionParameters', isFunctionParametersNode],
    ['ParamsType', isParamsTypeNode],
    ['Type', isTypeNode],
    ['File', isFileNode],
    ['Import', isImportNode],
    ['Export', isExportNode],
    ['Source', isSourceNode],
    ['Const', isConstNode],
    ['Function', isFunctionNode],
    ['ArrowFunction', isArrowFunctionNode],
    ['Text', isTextNode],
    ['Break', isBreakNode],
    ['Jsx', isJsxNode],
  ]

  it('exposes a guard for every node kind', () => {
    expect(guardsByKind).toHaveLength(24)
  })

  it.each(guardsByKind)('matches only the %s kind', (kind, guard) => {
    expect(guard({ kind })).toBe(true)
    expect(guard({ kind: 'Other' })).toBe(false)
  })
})
