import { describe, expect, it } from 'vitest'
import { createSchema } from '../nodes/schema.ts'
import { resolveRefName } from './refs.ts'

describe('resolveRefName', () => {
  it('extracts the name from a $ref pointer', () => {
    const ref = createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })

    expect(resolveRefName(ref)).toBe('Pet')
  })

  it('prefers targetName over the pointer segment', () => {
    const ref = createSchema({ type: 'ref', name: 'Order', ref: '#/components/schemas/Order', targetName: 'OrderSchema' })

    expect(resolveRefName(ref)).toBe('OrderSchema')
  })

  it('falls back to node.name when ref is missing', () => {
    const ref = createSchema({ type: 'ref', name: 'Pet' })

    expect(resolveRefName(ref)).toBe('Pet')
  })

  it('returns null for non-ref nodes', () => {
    expect(resolveRefName(createSchema({ type: 'string' }))).toBeNull()
    expect(resolveRefName(undefined)).toBeNull()
  })
})
