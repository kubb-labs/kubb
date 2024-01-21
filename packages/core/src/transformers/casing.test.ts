import { camelCase, pascalCase, pathCase } from './casing.ts'

describe('casing', () => {
  test('camelCase', () => {
    expect(camelCase('pet pet')).toBe('petPet')
    expect(camelCase('pet.Pet', { isFile: true })).toBe('pet/pet')
    expect(camelCase('create tag.tag', { isFile: true })).toBe('createTag/tag')
    expect(camelCase('tag.tag', { isFile: true, prefix: 'create' })).toBe('tag/createTag')
    expect(camelCase('tag.tag', { isFile: true, suffix: 'schema' })).toBe('tag/tagSchema')
  })
  test('pascalCase', () => {
    expect(pascalCase('pet pet')).toBe('PetPet')
    expect(pascalCase('pet.Pet', { isFile: true })).toBe('pet/Pet')
    expect(pascalCase('create tag.tag', { isFile: true })).toBe('createTag/Tag')
    expect(pascalCase('tag.tag', { isFile: true, prefix: 'create' })).toBe('tag/CreateTag')
    expect(pascalCase('tag.tag', { isFile: true, suffix: 'schema' })).toBe('tag/TagSchema')
  })

  test('pathCase', () => {
    expect(pathCase('pet pet')).toBe('petpet')
    expect(pathCase('pet.Pet', { isFile: true })).toBe('pet/pet')
    expect(pathCase('create tag.tag', { isFile: true })).toBe('createTag/tag')
    expect(pathCase('tag.tag', { isFile: true, prefix: 'create' })).toBe('tag/createtag')
    expect(pathCase('tag.tag', { isFile: true, suffix: 'schema' })).toBe('tag/tagschema')
  })
})
