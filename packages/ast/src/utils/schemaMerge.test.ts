import { describe, expect, it } from 'vitest'
import { createProperty } from '../nodes/property.ts'
import { createSchema, type SchemaNode } from '../nodes/schema.ts'
import { mergeAdjacentObjects } from './schemaMerge.ts'

function makeObject(props: Array<string>, name?: string): SchemaNode {
  return createSchema({
    type: 'object',
    name,
    properties: props.map((prop) => createProperty({ name: prop, schema: createSchema({ type: 'string' }) })),
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
  it('returns an empty array unchanged', () => {
    expect(mergeAdjacentObjects([])).toStrictEqual([])
  })

  it('keeps a single anonymous object unchanged', () => {
    expect(summarize(mergeAdjacentObjects([makeObject(['a'])]))).toStrictEqual([{ type: 'object', name: undefined, props: ['a'] }])
  })

  it('merges adjacent anonymous objects into one object', () => {
    const result = mergeAdjacentObjects([makeObject(['a']), makeObject(['b']), makeObject(['c'])])
    expect(summarize(result)).toStrictEqual([{ type: 'object', name: undefined, props: ['a', 'b', 'c'] }])
  })

  it('does not merge named objects', () => {
    const result = mergeAdjacentObjects([makeObject(['a'], 'Foo'), makeObject(['b'], 'Bar')])
    expect(summarize(result)).toStrictEqual([
      { type: 'object', name: 'Foo', props: ['a'] },
      { type: 'object', name: 'Bar', props: ['b'] },
    ])
  })

  it('does not merge across named-object boundaries', () => {
    const result = mergeAdjacentObjects([makeObject(['a']), makeObject(['b'], 'Named'), makeObject(['c'])])
    expect(summarize(result)).toStrictEqual([
      { type: 'object', name: undefined, props: ['a'] },
      { type: 'object', name: 'Named', props: ['b'] },
      { type: 'object', name: undefined, props: ['c'] },
    ])
  })

  it('does not merge ref nodes with anonymous objects', () => {
    const result = mergeAdjacentObjects([
      createSchema({ type: 'ref', ref: '#/components/schemas/Address', name: 'Address' }),
      makeObject(['streetNumber']),
      makeObject(['streetName']),
    ])
    expect(summarize(result)).toStrictEqual([
      { type: 'ref', name: 'Address', ref: '#/components/schemas/Address' },
      { type: 'object', name: undefined, props: ['streetNumber', 'streetName'] },
    ])
  })
})
