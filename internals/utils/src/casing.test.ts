import { describe, expect, test } from 'vitest'
import { camelCase, pascalCase } from './casing.ts'

describe('casing', () => {
  test.each([
    // all-caps acronym preserved
    ['HTML', 'HTML'],
    ['getHTTPSResponse', 'getHTTPSResponse'],
    // digit → letter boundary
    ['123invalid', '123Invalid'],
    ['get2pet', 'get2Pet'],
    // special chars stripped (@ is not a separator, just removed)
    ['hello@world', 'helloworld'],
    // dots are treated as a separator and collapsed into a single token
    ['pet.petId', 'petPetId'],
  ])('camelCase(%s) -> %s', (input, expected) => {
    expect(camelCase(input)).toBe(expected)
  })

  test.each([
    ['tag', { prefix: 'create' }, 'createTag'],
    ['tag', { suffix: 'schema' }, 'tagSchema'],
    ['pet', { prefix: 'get', suffix: 'byId' }, 'getPetById'],
  ])('camelCase(%s, options) -> %s', (input, options, expected) => {
    expect(camelCase(input, options as Parameters<typeof camelCase>[1])).toBe(expected)
  })

  test('pascalCase keeps an all-caps acronym', () => {
    expect(pascalCase('is HTML test')).toBe('IsHTMLTest')
  })
})

describe('casing cache', () => {
  test('keeps camelCase and PascalCase results for the same text apart', () => {
    expect(camelCase('pet-store')).toBe('petStore')
    expect(pascalCase('pet-store')).toBe('PetStore')
    expect(camelCase('pet-store')).toBe('petStore')
  })
})
