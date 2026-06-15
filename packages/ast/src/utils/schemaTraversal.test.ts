import { describe, expect, it } from 'vitest'
import { createProperty } from '../nodes/property.ts'
import { createSchema } from '../nodes/schema.ts'
import type { SchemaNode } from '../nodes/schema.ts'
import { lazyGetter, mapSchemaItems, mapSchemaMembers, mapSchemaProperties } from './schemaTraversal.ts'

const label = (schema: SchemaNode): string => `<${schema.type}>`

describe('mapSchemaProperties', () => {
  it('pairs each property with its transformed output', () => {
    const node = createSchema({
      type: 'object',
      properties: [
        createProperty({ name: 'id', required: true, schema: createSchema({ type: 'number' }) }),
        createProperty({ name: 'name', required: false, schema: createSchema({ type: 'string' }) }),
      ],
    })
    if (node.type !== 'object') return

    const result = mapSchemaProperties(node, label)

    expect(result.map((entry) => ({ name: entry.name, output: entry.output }))).toStrictEqual([
      { name: 'id', output: '<number>' },
      { name: 'name', output: '<string>' },
    ])
    expect(result[0]!.property.required).toBe(true)
  })

  it('returns an empty array for an object with no properties', () => {
    const node = createSchema({ type: 'object', properties: [] })
    if (node.type !== 'object') return

    expect(mapSchemaProperties(node, label)).toStrictEqual([])
  })
})

describe('mapSchemaMembers', () => {
  it('pairs each union member with its transformed output', () => {
    const node = createSchema({ type: 'union', members: [createSchema({ type: 'string' }), createSchema({ type: 'number' })] })
    if (node.type !== 'union') return

    expect(mapSchemaMembers(node, label).map((entry) => entry.output)).toStrictEqual(['<string>', '<number>'])
  })

  it('returns an empty array when members are absent', () => {
    const node = createSchema({ type: 'intersection' })
    if (node.type !== 'intersection') return

    expect(mapSchemaMembers(node, label)).toStrictEqual([])
  })
})

describe('mapSchemaItems', () => {
  it('pairs each item with its transformed output', () => {
    const node = createSchema({ type: 'array', items: [createSchema({ type: 'string' })] })
    if (node.type !== 'array') return

    const result = mapSchemaItems(node, label)
    expect(result).toHaveLength(1)
    expect(result[0]!.output).toBe('<string>')
  })

  it('returns an empty array when items are absent', () => {
    const node = createSchema({ type: 'array' })
    if (node.type !== 'array') return

    expect(mapSchemaItems(node, label)).toStrictEqual([])
  })

  it('is generic over the output type', () => {
    const node = createSchema({ type: 'array', items: [createSchema({ type: 'string' }), createSchema({ type: 'number' })] })
    if (node.type !== 'array') return

    const lengths = mapSchemaItems(node, (schema) => schema.type.length)
    expect(lengths.map((entry) => entry.output)).toStrictEqual([6, 6])
  })
})

describe('lazyGetter', () => {
  it('emits a getter for a valid identifier key', () => {
    expect(lazyGetter({ name: 'parent', body: 'z.lazy(() => Pet)' })).toBe('get parent() { return z.lazy(() => Pet) }')
  })

  it('quotes a key that is not a valid identifier', () => {
    expect(lazyGetter({ name: 'x-total', body: 'z.number()' })).toBe("get 'x-total'() { return z.number() }")
  })
})
