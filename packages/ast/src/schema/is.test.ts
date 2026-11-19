import { describe, expect, it } from 'vitest'
import { createSchema, type SchemaNode } from '../nodes/schema.ts'
import { is } from './is.ts'

const blob = createSchema({ type: 'blob' })
const refTo = (schema: SchemaNode) => createSchema({ type: 'ref', name: schema.name ?? 'Target', schema })

describe('schema.is', () => {
  it.each([
    ['binary', createSchema({ type: 'blob' }), true],
    ['binary', createSchema({ type: 'string' }), false],
    ['string', createSchema({ type: 'uuid' }), true],
    ['string', createSchema({ type: 'date', representation: 'string' }), true],
    ['string', createSchema({ type: 'date', representation: 'date' }), false],
    ['text', createSchema({ type: 'string' }), true],
    ['text', createSchema({ type: 'blob' }), false],
    ['scalar', createSchema({ type: 'enum', enumValues: ['a'] }), true],
    ['scalar', createSchema({ type: 'object', properties: [] }), false],
    ['const', createSchema({ type: 'enum', enumValues: ['a'] }), true],
    ['const', createSchema({ type: 'enum', enumValues: ['a', 'b'] }), false],
    ['enumLike', createSchema({ type: 'union', members: [createSchema({ type: 'enum', enumValues: ['a'] })] }), true],
    ['enumLike', createSchema({ type: 'union', members: [] }), false],
    ['untyped', createSchema({ type: 'unknown' }), true],
    ['untyped', createSchema({ type: 'string' }), false],
  ] as const)('is(node, %s) on %o is %s', (kind, node, expected) => {
    expect(is(node, kind)).toBe(expected)
  })

  it('looks at the node only by default', () => {
    expect(is(refTo(blob), 'binary')).toBe(false)
    expect(is(createSchema({ type: 'array', items: [blob] }), 'binary')).toBe(false)
  })

  it('follows refs and array items when asked, through several levels', () => {
    const arrayOfRefs = createSchema({ type: 'array', items: [refTo(blob)] })

    expect(is(refTo(blob), 'binary', { follow: ['ref'] })).toBe(true)
    expect(is(arrayOfRefs, 'binary', { follow: ['ref'] })).toBe(false)
    expect(is(refTo(arrayOfRefs), 'binary', { follow: ['ref', 'array'] })).toBe(true)
  })

  it('applies follow to union members of an enum-like union', () => {
    const status = createSchema({ type: 'enum', name: 'Status', enumValues: ['a'] })
    const union = createSchema({ type: 'union', members: [refTo(status), refTo(status)] })

    expect(is(union, 'enumLike')).toBe(false)
    expect(is(union, 'enumLike', { follow: ['ref'] })).toBe(true)
  })

  it('stops on a ref cycle', () => {
    const node = createSchema({ type: 'ref', name: 'Loop' })
    Object.assign(node, { schema: refTo(node) })

    expect(is(node, 'binary', { follow: ['ref'] })).toBe(false)
  })
})
