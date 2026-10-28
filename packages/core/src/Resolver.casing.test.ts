import { describe, expect, test } from 'vitest'
import { createResolver } from './createResolver.ts'
import { Resolver } from './Resolver.ts'

const upper = (text: string) => text.toUpperCase()

describe('Resolver casing', () => {
  test('uses the plain helpers when no casing is given', () => {
    const resolver = createResolver({ pluginName: 'plugin-test' })
    expect(resolver.camelCase('pet store')).toBe('petStore')
    expect(resolver.pascalCase('pet store', { suffix: 'schema' })).toBe('PetStoreSchema')
  })

  test('routes name and file through the given casing', () => {
    const resolver = new Resolver({ pluginName: 'plugin-test', camelCase: upper })
    expect(resolver.name('pet')).toBe('PET')
    expect(resolver.file({ name: 'pet.petId', extname: '.ts', root: '/root', output: { path: 'types', mode: 'directory' } }).path).toBe(
      '/root/types/PET/PETID.ts',
    )
  })

  test('keeps the casing of the base when merging a plugin resolver', () => {
    const base = new Resolver({ pluginName: 'plugin-test', camelCase: upper, pascalCase: upper })
    const merged = Resolver.merge(base, createResolver({ pluginName: 'plugin-test', name: (name) => `${name}!` }))
    expect(merged.camelCase('pet')).toBe('PET')
    expect(merged.pascalCase('pet')).toBe('PET')
    expect(merged.name('pet')).toBe('pet!')
  })
})
