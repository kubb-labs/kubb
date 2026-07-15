import { ast } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { mergeAdjacentObjectsLazy } from './mergeAdjacentSchemas.ts'

function mergeAdjacentObjects(members: Array<SchemaNode>): Array<SchemaNode> {
  return [...mergeAdjacentObjectsLazy(members)]
}

function makeObject(props: Array<string>, name?: string): SchemaNode {
  return ast.factory.createSchema({
    type: 'object',
    name,
    properties: props.map((prop) => ast.factory.createProperty({ name: prop, schema: ast.factory.createSchema({ type: 'string' }) })),
  })
}

function summarize(nodes: Array<SchemaNode>) {
  return nodes.map((n) => {
    if (n.type === 'object') return { type: n.type, name: n.name, props: n.properties.map((p) => p.name) }
    if (n.type === 'ref') return { type: n.type, name: n.name, ref: n.ref }
    return { type: n.type }
  })
}

describe('mergeAdjacentObjects', () => {
  it('merges a run of adjacent anonymous objects into one', () => {
    const result = mergeAdjacentObjects([makeObject(['a']), makeObject(['b']), makeObject(['c'])])
    expect(summarize(result)).toStrictEqual([{ type: 'object', name: undefined, props: ['a', 'b', 'c'] }])
  })

  it('does not merge across a named object', () => {
    const result = mergeAdjacentObjects([makeObject(['a']), makeObject(['b'], 'Named'), makeObject(['c'])])
    expect(summarize(result)).toStrictEqual([
      { type: 'object', name: undefined, props: ['a'] },
      { type: 'object', name: 'Named', props: ['b'] },
      { type: 'object', name: undefined, props: ['c'] },
    ])
  })

  it('does not merge ref nodes with anonymous objects', () => {
    const result = mergeAdjacentObjects([
      ast.factory.createSchema({ type: 'ref', ref: '#/components/schemas/Address', name: 'Address' }),
      makeObject(['streetNumber']),
      makeObject(['streetName']),
    ])
    expect(summarize(result)).toStrictEqual([
      { type: 'ref', name: 'Address', ref: '#/components/schemas/Address' },
      { type: 'object', name: undefined, props: ['streetNumber', 'streetName'] },
    ])
  })
})
