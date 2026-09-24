import { describe, expect, it } from 'vitest'
import { createSchema } from '../nodes/schema.ts'
import { isBareRef, resolveRefName } from './refs.ts'

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

describe('isBareRef', () => {
  it('returns true for a ref without modifiers', () => {
    expect(isBareRef(createSchema({ type: 'ref', ref: '#/components/schemas/Pet' }))).toBe(true)
  })

  it('returns false for non-ref nodes', () => {
    expect(isBareRef(createSchema({ type: 'string' }))).toBe(false)
    expect(isBareRef(undefined)).toBe(false)
  })

  it('returns false for ref modifiers and metadata', () => {
    expect(isBareRef(createSchema({ type: 'ref', ref: '#/components/schemas/Pet', nullable: true }))).toBe(false)
    expect(isBareRef(createSchema({ type: 'ref', ref: '#/components/schemas/Pet', default: 'pet' }))).toBe(false)
    expect(isBareRef(createSchema({ type: 'ref', ref: '#/components/schemas/Pet', description: 'Pet' }))).toBe(false)
    expect(isBareRef(createSchema({ type: 'ref', ref: '#/components/schemas/Pet', examples: ['pet'] }))).toBe(false)
  })

  it('checks modifiers inherited from the resolved schema', () => {
    const schema = createSchema({ type: 'object', optional: true })
    const ref = createSchema({ type: 'ref', ref: '#/components/schemas/Pet', schema })

    expect(isBareRef(ref)).toBe(false)
  })

  it('returns false when omit keys are present', () => {
    const ref = createSchema({ type: 'ref', ref: '#/components/schemas/Pet' })

    expect(isBareRef(ref, ['id'])).toBe(false)
  })
})
