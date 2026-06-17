import { describe, expect, it } from 'vitest'
import { createProperty } from './nodes/property.ts'
import { createSchema, type SchemaNode } from './nodes/schema.ts'
import { isSchemaEqual, signatureOf } from './signature.ts'

function stringEnum(values: Array<string>, extra: Partial<Parameters<typeof createSchema>[0]> = {}): SchemaNode {
  return createSchema({ type: 'enum', primitive: 'string', enumValues: values, ...extra } as Parameters<typeof createSchema>[0])
}

describe('signatureOf', () => {
  it('ignores documentation and usage-slot fields', () => {
    const a = stringEnum(['a', 'b'], { description: 'one', examples: ['a'], deprecated: true, optional: true })
    const b = stringEnum(['a', 'b'], { title: 'two' })

    expect(signatureOf(a)).toBe(signatureOf(b))
    expect(isSchemaEqual(a, b)).toBe(true)
  })

  it('distinguishes by enum values', () => {
    expect(isSchemaEqual(stringEnum(['a', 'b']), stringEnum(['a', 'c']))).toBe(false)
  })

  it('distinguishes by nullable', () => {
    expect(isSchemaEqual(stringEnum(['a']), stringEnum(['a'], { nullable: true }))).toBe(false)
  })

  it('distinguishes objects by property name and required', () => {
    const base = createSchema({ type: 'object', properties: [createProperty({ name: 'id', required: true, schema: createSchema({ type: 'string' }) })] })
    const renamed = createSchema({ type: 'object', properties: [createProperty({ name: 'key', required: true, schema: createSchema({ type: 'string' }) })] })

    expect(isSchemaEqual(base, renamed)).toBe(false)
  })

  it('returns a stable signature for the same node across repeated calls', () => {
    const node = createSchema({ type: 'object', properties: [createProperty({ name: 'id', required: true, schema: stringEnum(['a', 'b']) })] })

    expect(signatureOf(node)).toBe(signatureOf(node))
  })

  it('compares distinct nodes by content, not identity', () => {
    const a = stringEnum(['a', 'b'])
    const b = stringEnum(['a', 'b'])

    // Hash each independently first so both are cached, then assert content equality still holds.
    expect(signatureOf(a)).toBe(signatureOf(b))
    expect(signatureOf(stringEnum(['a', 'c']))).not.toBe(signatureOf(a))
  })
})
