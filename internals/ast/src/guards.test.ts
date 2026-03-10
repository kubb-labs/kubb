import { describe, expect, it } from 'vitest'
import { createOperation, createParameter, createResponse, createRoot, createSchema } from './factory.ts'
import {
  isOperationNode,
  isParameterNode,
  isPropertyNode,
  isResponseNode,
  isRootNode,
  isSchemaNode,
} from './guards.ts'

describe('isRootNode', () => {
  it('returns true for RootNode', () => {
    expect(isRootNode(createRoot())).toBe(true)
  })
  it('returns false for other nodes', () => {
    expect(isRootNode(createSchema({ type: 'string' }))).toBe(false)
    expect(isRootNode(createOperation({ operationId: 'op', method: 'GET', path: '/' }))).toBe(false)
  })
})

describe('isOperationNode', () => {
  it('returns true for OperationNode', () => {
    expect(isOperationNode(createOperation({ operationId: 'op', method: 'GET', path: '/' }))).toBe(true)
  })
  it('returns false for other nodes', () => {
    expect(isOperationNode(createRoot())).toBe(false)
  })
})

describe('isSchemaNode', () => {
  it('returns true for SchemaNode', () => {
    expect(isSchemaNode(createSchema({ type: 'string' }))).toBe(true)
  })
  it('returns false for other nodes', () => {
    expect(isSchemaNode(createRoot())).toBe(false)
  })
})

describe('isParameterNode', () => {
  it('returns true for ParameterNode', () => {
    expect(isParameterNode(createParameter({ name: 'id', in: 'path', schema: createSchema({ type: 'string' }) }))).toBe(true)
  })
  it('returns false for other nodes', () => {
    expect(isParameterNode(createSchema({ type: 'string' }))).toBe(false)
  })
})

describe('isPropertyNode', () => {
  it('returns false for non-property nodes', () => {
    expect(isPropertyNode(createSchema({ type: 'string' }))).toBe(false)
  })
})

describe('isResponseNode', () => {
  it('returns true for ResponseNode', () => {
    expect(isResponseNode(createResponse({ statusCode: '200' }))).toBe(true)
  })
  it('returns false for other nodes', () => {
    expect(isResponseNode(createRoot())).toBe(false)
  })
})
