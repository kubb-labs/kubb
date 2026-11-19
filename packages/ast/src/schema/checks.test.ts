import { describe, expect, it } from 'vitest'
import { createProperty } from '../nodes/property.ts'
import { createSchema } from '../nodes/schema.ts'
import { getChecks, getObjectKind } from './checks.ts'

const string = createSchema({ type: 'string' })
const properties = [createProperty({ name: 'id', schema: string, required: true })]

describe('schema.getChecks', () => {
  it('lists property counts, key checks and conditionals', () => {
    const conditional = { if: string, then: string }
    const node = createSchema({ type: 'object', properties, min: 1, max: 3, propertyNames: string, conditionals: [conditional] })

    expect(getChecks(node)).toStrictEqual([
      { kind: 'minProperties', value: 1 },
      { kind: 'maxProperties', value: 3 },
      { kind: 'propertyNames', schema: string },
      { kind: 'conditional', ...conditional },
    ])
  })

  it('leaves the key check of a plain record to the record', () => {
    expect(getChecks(createSchema({ type: 'object', properties: [], additionalProperties: string, propertyNames: string }))).toStrictEqual([])
  })

  it('checks pattern keys of a closed object with properties', () => {
    const patternProperties = { '^x-': string }
    const node = createSchema({ type: 'object', properties, patternProperties, additionalProperties: false })

    expect(getChecks(node)).toStrictEqual([{ kind: 'patternProperties', patterns: patternProperties }])
  })
})

describe('schema.getObjectKind', () => {
  const object = createSchema({ type: 'object', properties })

  it.each([
    ['an object with properties', object, 'properties'],
    ['an empty object', createSchema({ type: 'object', properties: [] }), 'properties'],
    ['a record', createSchema({ type: 'object', properties: [], additionalProperties: string }), 'record'],
    ['properties plus a typed rest', createSchema({ type: 'object', properties, additionalProperties: string }), 'mixed'],
    ['an allOf of objects', createSchema({ type: 'intersection', members: [object, object] }), 'composed'],
    ['a single-member union', createSchema({ type: 'union', members: [object] }), 'properties'],
    ['an unresolved ref', createSchema({ type: 'ref', name: 'Pet' }), 'properties'],
    ['a resolved ref', createSchema({ type: 'ref', name: 'Pet', schema: object }), 'properties'],
    ['a nullable object', createSchema({ type: 'object', properties, nullable: true }), null],
    ['an object with a property count', createSchema({ type: 'object', properties, min: 1 }), null],
    [
      'an allOf with a record base',
      createSchema({ type: 'intersection', members: [createSchema({ type: 'object', properties: [], additionalProperties: string }), object] }),
      null,
    ],
    ['a string', string, null],
  ] as const)('%s gives %s', (_, node, expected) => {
    expect(getObjectKind(node)).toBe(expected)
  })

  it('gives null for a ref into a cycle', () => {
    expect(getObjectKind(createSchema({ type: 'ref', name: 'Tree', schema: object }), { circularSchemas: new Set(['Tree']) })).toBeNull()
  })
})
