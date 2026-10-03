import { narrowSchema } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { adapterOas } from './adapter.ts'
import type { SchemaObject } from './types.ts'

const members = [
  { const: 1, title: 'First', description: 'First status' },
  { const: 2, title: 'Second' },
]

async function parse(schema: SchemaObject, annotatedEnums = true) {
  const adapter = adapterOas({ annotatedEnums, integerType: 'number' })
  return adapter.parse({
    type: 'data',
    data: {
      openapi: '3.1.0',
      info: { title: 'Annotated enums', version: '1' },
      paths: {},
      components: { schemas: { Status: schema, Container: { type: 'object', properties: { status: { $ref: '#/components/schemas/Status' } } } } },
    },
  })
}

describe('annotated enums', () => {
  it.each(['oneOf', 'anyOf'] as const)('retains titles, values and descriptions for %s', async (keyword) => {
    const result = await parse({ type: 'integer', [keyword]: members, title: 'Status', description: 'Status description', default: 1 })
    expect(result.schemas[0]).toMatchObject({
      type: 'enum',
      name: 'Status',
      primitive: 'number',
      title: 'Status',
      description: 'Status description',
      default: 1,
      namedEnumValues: [
        { name: 'First', value: 1, primitive: 'number', description: 'First status' },
        { name: 'Second', value: 2, primitive: 'number' },
      ],
    })
    expect(result.meta?.enumNames).toContain('Status')
    const container = narrowSchema(result.schemas[1]!, 'object')!
    const reference = narrowSchema(container.properties![0]!.schema, 'ref')!
    expect(reference.schema).toMatchObject({
      type: 'enum',
      namedEnumValues: [
        { name: 'First', value: 1 },
        { name: 'Second', value: 2 },
      ],
    })
  })

  it('keeps current output by default', async () => {
    const adapter = adapterOas({ integerType: 'number' })
    const result = await adapter.parse({
      type: 'data',
      data: { openapi: '3.1.0', info: { title: 'Enums', version: '1' }, paths: {}, components: { schemas: { Status: { oneOf: members } } } },
    })
    expect(result.schemas[0]?.type).toBe('union')
    expect(result.meta?.enumNames).not.toContain('Status')
    expect(adapter.options.annotatedEnums).toBe(false)
  })

  it('preserves string wire values without using titles as serialized values', async () => {
    const result = await parse({
      type: 'string',
      oneOf: [
        { const: 'rgb', title: 'RGB' },
        { const: 'cmyk', title: 'CMYK' },
      ],
    })
    expect(result.schemas[0]).toMatchObject({
      type: 'enum',
      primitive: 'string',
      namedEnumValues: [
        { name: 'RGB', value: 'rgb' },
        { name: 'CMYK', value: 'cmyk' },
      ],
    })
  })

  it.each([
    { oneOf: [{ const: 1, title: 'First' }, { const: 2 }] },
    {
      oneOf: [
        { const: 1, title: 'First' },
        { const: 2, title: 'First' },
      ],
    },
    {
      oneOf: [
        { const: 1, title: 'First' },
        { const: 1, title: 'Second' },
      ],
    },
    {
      oneOf: [
        { const: 1, title: ' ' },
        { const: 2, title: 'Second' },
      ],
    },
    {
      oneOf: [
        { const: 1, title: 'First' },
        { const: 'two', title: 'Second' },
      ],
    },
    {
      oneOf: [
        { const: 1, title: 'First' },
        { const: null, title: 'None' },
      ],
    },
    {
      oneOf: [
        { const: 1, title: 'First', minimum: 2 },
        { const: 2, title: 'Second' },
      ],
    },
    { minimum: 2, oneOf: members },
    {
      type: 'integer',
      oneOf: [
        { const: 1.5, title: 'First' },
        { const: 2, title: 'Second' },
      ],
    },
    { oneOf: members, anyOf: [{ const: 1, title: 'Only' }] },
  ] satisfies Array<SchemaObject>)('leaves ambiguous or additionally constrained unions unchanged: %j', async (schema) => {
    const result = await parse(schema)
    expect(result.schemas[0]?.type).toBe('union')
    expect(result.meta?.enumNames).not.toContain('Status')
  })
})
