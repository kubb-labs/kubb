import { createOperation, createSchema } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { NodeFingerprint } from './NodeFingerprint.ts'

function mapOf(...schemas: Array<SchemaNode>): Map<string, SchemaNode> {
  const map = new Map<string, SchemaNode>()
  for (const schema of schemas) {
    if (schema.name) map.set(schema.name, schema)
  }
  return map
}

const base = { pluginName: 'plugin', nodeId: 'plugin schema:A', resolvedOptions: {} }

describe('NodeFingerprint.schemaNodeId', () => {
  it('returns null for an inline schema with no name', () => {
    expect(NodeFingerprint.schemaNodeId({ pluginName: 'p', name: null })).toBeNull()
  })

  it('builds a stable id from the plugin and schema name', () => {
    expect(NodeFingerprint.schemaNodeId({ pluginName: 'p', name: 'Pet' })).toBe('p#schema:Pet')
  })
})

describe('NodeFingerprint.schemaNodeKey', () => {
  it('is stable for the same schema', () => {
    const node = createSchema({ name: 'A', type: 'string' })
    const a = NodeFingerprint.schemaNodeKey({ ...base, node, schemasByName: mapOf(node) })
    const b = NodeFingerprint.schemaNodeKey({ ...base, node, schemasByName: mapOf(node) })
    expect(a).toBe(b)
  })

  it('changes when the schema shape changes', () => {
    const a = NodeFingerprint.schemaNodeKey({ ...base, node: createSchema({ name: 'A', type: 'string' }), schemasByName: mapOf() })
    const b = NodeFingerprint.schemaNodeKey({ ...base, node: createSchema({ name: 'A', type: 'number' }), schemasByName: mapOf() })
    expect(a).not.toBe(b)
  })

  it('changes when a transitively referenced schema body changes', () => {
    const a = createSchema({ name: 'A', type: 'array', items: [createSchema({ type: 'ref', name: 'B' })] })
    const keyWith = (b: SchemaNode) => NodeFingerprint.schemaNodeKey({ ...base, node: a, schemasByName: mapOf(a, b) })

    expect(keyWith(createSchema({ name: 'B', type: 'string' }))).not.toBe(keyWith(createSchema({ name: 'B', type: 'number' })))
  })

  it('changes with resolved options and plugin name', () => {
    const node = createSchema({ name: 'A', type: 'string' })
    const key = (over: Partial<typeof base>) => NodeFingerprint.schemaNodeKey({ ...base, ...over, node, schemasByName: mapOf(node) })

    expect(key({})).not.toBe(key({ resolvedOptions: { x: 1 } }))
    expect(key({})).not.toBe(key({ pluginName: 'other' }))
  })
})

describe('NodeFingerprint.operationNodeKey', () => {
  const opBase = { pluginName: 'plugin', nodeId: 'plugin operation:createA', resolvedOptions: {} }
  const op = createOperation({
    operationId: 'createA',
    method: 'POST',
    path: '/a',
    requestBody: { content: [{ contentType: 'application/json', schema: createSchema({ type: 'ref', name: 'B' }) }] },
  })

  it('changes when a used schema changes', () => {
    const keyWith = (b: SchemaNode) => NodeFingerprint.operationNodeKey({ ...opBase, node: op, schemasByName: mapOf(b) })
    expect(keyWith(createSchema({ name: 'B', type: 'string' }))).not.toBe(keyWith(createSchema({ name: 'B', type: 'number' })))
  })

  it('is stable when an unused schema changes', () => {
    const b = createSchema({ name: 'B', type: 'string' })
    const withC = (c: SchemaNode) => NodeFingerprint.operationNodeKey({ ...opBase, node: op, schemasByName: mapOf(b, c) })
    expect(withC(createSchema({ name: 'C', type: 'string' }))).toBe(withC(createSchema({ name: 'C', type: 'number' })))
  })

  it('changes when the operation wiring changes', () => {
    const a = NodeFingerprint.operationNodeKey({ ...opBase, node: op, schemasByName: mapOf() })
    const moved = createOperation({ operationId: 'createA', method: 'PUT', path: '/a' })
    const b = NodeFingerprint.operationNodeKey({ ...opBase, node: moved, schemasByName: mapOf() })
    expect(a).not.toBe(b)
  })
})
