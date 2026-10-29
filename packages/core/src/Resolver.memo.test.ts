import { describe, expect, test } from 'vitest'
import { createResolver, Resolver } from './Resolver.ts'

describe('Resolver.memo', () => {
  test('computes a key once and returns the same value afterwards', () => {
    const resolver = createResolver({ pluginName: 'plugin-test' })
    const seen: Array<string> = []
    const compute = () => {
      seen.push('pet')
      return `pet${seen.length}`
    }
    expect(resolver.memo('name:pet', compute)).toBe('pet1')
    expect(resolver.memo('name:pet', compute)).toBe('pet1')
    expect(seen).toHaveLength(1)
  })

  test('keeps keys apart', () => {
    const resolver = createResolver({ pluginName: 'plugin-test' })
    expect(resolver.memo('name:pet', () => 'Pet')).toBe('Pet')
    expect(resolver.memo('type:pet', () => 'PetType')).toBe('PetType')
  })

  test('a merged resolver starts with an empty memo', () => {
    const base = createResolver({ pluginName: 'plugin-test' })
    base.memo('name:pet', () => 'cached')
    const merged = Resolver.merge(base, { name: (name) => name })
    expect(merged.memo('name:pet', () => 'fresh')).toBe('fresh')
  })
})
