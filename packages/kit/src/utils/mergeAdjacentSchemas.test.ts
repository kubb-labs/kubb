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
  it('merges the extensions of merged members', () => {
    const [merged] = mergeAdjacentObjects([
      { ...makeObject(['a']), extensions: { 'x-a': 1 } },
      { ...makeObject(['b']), extensions: { 'x-b': 2 } },
    ])
    expect(merged?.extensions).toStrictEqual({ 'x-a': 1, 'x-b': 2 })
    expect(mergeAdjacentObjects([makeObject(['a']), makeObject(['b'])])[0]?.extensions).toBeUndefined()
  })

  it('does not merge across a named object', () => {
    const result = mergeAdjacentObjects([makeObject(['a']), makeObject(['b'], 'Named'), makeObject(['c'])])
    expect(summarize(result)).toStrictEqual([
      { type: 'object', name: undefined, props: ['a'] },
      { type: 'object', name: 'Named', props: ['b'] },
      { type: 'object', name: undefined, props: ['c'] },
    ])
  })
})
