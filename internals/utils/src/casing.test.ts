import { describe, expect, test } from 'vitest'
import { camelCase, createCasing, pascalCase } from './casing.ts'

describe('casing', () => {
  test.each([
    // separators
    ['hello-world', 'helloWorld'],
    ['hello_world', 'helloWorld'],
    ['hello world', 'helloWorld'],
    // already camelCase / PascalCase input
    ['HelloWorld', 'helloWorld'],
    ['createPetById', 'createPetById'],
    // single word
    ['hello', 'hello'],
    ['a', 'a'],
    // all-caps acronym preserved
    ['HTML', 'HTML'],
    ['getHTTPSResponse', 'getHTTPSResponse'],
    // digit → letter boundary
    ['123invalid', '123Invalid'],
    ['get2pet', 'get2Pet'],
    // mixed separators
    ['hello-world_foo', 'helloWorldFoo'],
    // special chars stripped (@ is not a separator, just removed)
    ['hello@world', 'helloworld'],
    // dots are treated as a separator and collapsed into a single token
    ['pet.petId', 'petPetId'],
    // empty
    ['', ''],
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

  test('pascalCase', () => {
    expect(pascalCase('pet pet')).toBe('PetPet')
    expect(pascalCase('is HTML test')).toBe('IsHTMLTest')
    expect(pascalCase('aiType')).toBe('AiType')
  })
})

describe('createCasing', () => {
  test('returns the same results as the plain helpers', () => {
    const casing = createCasing()
    expect(casing.camelCase('pet-store', { prefix: 'create' })).toBe(camelCase('pet-store', { prefix: 'create' }))
    expect(casing.pascalCase('pet-store', { suffix: 'schema' })).toBe(pascalCase('pet-store', { suffix: 'schema' }))
  })

  test('clear empties the memo and the next call recomputes the same result', () => {
    const casing = createCasing()
    expect(casing.camelCase('pet-store')).toBe('petStore')
    casing.clear()
    expect(casing.camelCase('pet-store')).toBe('petStore')
  })

  test('keeps camelCase and PascalCase results for the same text apart', () => {
    const casing = createCasing()
    expect(casing.camelCase('pet-store')).toBe('petStore')
    expect(casing.pascalCase('pet-store')).toBe('PetStore')
    expect(casing.camelCase('pet-store')).toBe('petStore')
  })
})
