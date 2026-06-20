import { describe, expect, it } from 'vitest'
import { resolveBarrelType } from './resolveBarrelType.ts'

describe('resolveBarrelType', () => {
  it('returns undefined when no output is given', () => {
    expect(resolveBarrelType(undefined)).toBeUndefined()
  })

  it('falls back to the legacy barrelType when barrel is not set', () => {
    expect(resolveBarrelType({ barrelType: 'named' })).toBe('named')
    expect(resolveBarrelType({ barrelType: 'all' })).toBe('all')
    expect(resolveBarrelType({ barrelType: false })).toBe(false)
    expect(resolveBarrelType({})).toBeUndefined()
  })

  it('prefers the barrel object over barrelType', () => {
    expect(resolveBarrelType({ barrel: { type: 'all' }, barrelType: 'named' })).toBe('all')
  })

  it('maps the barrel object to the legacy representation', () => {
    expect(resolveBarrelType({ barrel: { type: 'named' } })).toBe('named')
    expect(resolveBarrelType({ barrel: { type: 'all' } })).toBe('all')
    expect(resolveBarrelType({ barrel: false })).toBe(false)
  })

  it('defaults the barrel type to named', () => {
    expect(resolveBarrelType({ barrel: {} })).toBe('named')
  })

  it('maps nested to the legacy propagate value', () => {
    expect(resolveBarrelType({ barrel: { nested: true } })).toBe('propagate')
    expect(resolveBarrelType({ barrel: { type: 'named', nested: true } })).toBe('propagate')
  })
})
