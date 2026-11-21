import { describe, expect, test } from 'vitest'
import { createResolver } from './createResolver.ts'

describe('Resolver.memo', () => {
  test('keeps keys apart', () => {
    const resolver = createResolver({ pluginName: 'plugin-test' })
    expect(resolver.memo('name:pet', () => 'Pet')).toBe('Pet')
    expect(resolver.memo('type:pet', () => 'PetType')).toBe('PetType')
  })
})
