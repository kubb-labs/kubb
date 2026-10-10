import { describe, expect, it } from 'vitest'
import { createInput } from './input.ts'
import { createSchema } from './schema.ts'

describe('createInput', () => {
  it('creates an InputNode with default empty arrays', () => {
    const node = createInput()

    expect(node.kind).toBe('Input')
    expect(node.schemas).toStrictEqual([])
    expect(node.operations).toStrictEqual([])
  })

  it('accepts overrides', () => {
    const schema = createSchema({ type: 'string' })
    const node = createInput({ schemas: [schema] })

    expect(node.schemas).toHaveLength(1)
    expect(node.operations).toStrictEqual([])
  })

  it('returns fresh schemas, operations and meta objects for every call', () => {
    const first = createInput()
    const second = createInput()

    first.schemas.push(createSchema({ type: 'string' }))

    expect(second.schemas).toStrictEqual([])
    expect(second.meta).not.toBe(first.meta)
    expect(second.meta).toStrictEqual({ circularNames: [], enumNames: [] })
  })

  it('always sets kind to Input', () => {
    // @ts-expect-error — kind should be overridden back to 'Input'
    const node = createInput({ kind: 'Operation' })

    expect(node.kind).toBe('Input')
  })
})
