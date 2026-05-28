import { describe, expect, it } from 'vitest'
import { extractRefName } from './refs.ts'

describe('extractRefName', () => {
  it('extracts schema name from component schema refs', () => {
    expect(extractRefName('#/components/schemas/Order')).toBe('Order')
  })

  it('extracts name from component response refs', () => {
    expect(extractRefName('#/components/responses/NotFound')).toBe('NotFound')
  })

  it('falls back to the full string when no slash is present', () => {
    expect(extractRefName('SomeName')).toBe('SomeName')
  })
})
