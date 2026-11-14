import { describe, expect, it } from 'vitest'
import { createSchema } from '../nodes/schema.ts'
import { getName, mergeSchema } from './index.ts'

describe('mergeSchema', () => {
  it('merges sibling overrides over the resolved schema', () => {
    const resolved = createSchema({ type: 'object', description: 'Original' })
    const ref = createSchema({
      type: 'ref',
      name: 'Pet',
      ref: '#/components/schemas/Pet',
      schema: resolved,
      description: 'Override',
      readOnly: true,
    })

    const merged = mergeSchema(ref)
    expect(merged.description).toBe('Override')
    expect(merged.readOnly).toBe(true)
    expect(merged.type).toBe('object')
  })

  it('keeps resolved fields when the ref override is undefined', () => {
    const resolved = createSchema({ type: 'string', description: 'Original', readOnly: true })
    const ref = createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet', schema: resolved, description: undefined })

    const merged = mergeSchema(ref)
    expect(merged.description).toBe('Original')
    expect(merged.readOnly).toBe(true)
  })
})

describe('getName', () => {
  it('prefers the targetName of a ref node', () => {
    const node = createSchema({ type: 'ref', ref: '#/components/schemas/Order', targetName: 'OrderSchema' })
    expect(getName(node)).toBe('OrderSchema')
    expect(getName(createSchema({ type: 'string' }))).toBeNull()
  })
})
