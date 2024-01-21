import { camelCase, pascalCase, pathCase } from './casing.ts'

describe('casing', () => {
  test('camelCase', () => {
    expect(camelCase('pet pet')).toBe('petPet')
    expect(camelCase('pet.Pet', { isFile: true })).toBe('pet/pet')
  })
  test('pascalCase', () => {
    expect(pascalCase('pet pet')).toBe('PetPet')
    expect(pascalCase('pet.Pet', { isFile: true })).toBe('pet/Pet')
  })

  test('pathCase', () => {
    expect(pathCase('pet pet')).toBe('petpet')
    expect(pathCase('pet.Pet', { isFile: true })).toBe('pet/pet')
  })
})
