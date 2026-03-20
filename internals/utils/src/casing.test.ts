import { describe, expect, test } from 'vitest'
import { camelCase, pascalCase, screamingSnakeCase, snakeCase } from './casing.ts'

describe('casing', () => {
  test('camelCase', () => {
    expect(camelCase('pet pet')).toBe('petPet')
    expect(camelCase('is HTML test')).toBe('isHTMLTest')
    expect(camelCase('aiType')).toBe('aiType')
    expect(camelCase('pet.Pet', { isFile: true })).toBe('pet/pet')
    expect(camelCase('create tag.tag', { isFile: true })).toBe('createTag/tag')
    expect(camelCase('tag.tag', { isFile: true, prefix: 'create' })).toBe('tag/createTag')
    expect(camelCase('tag.tag', { isFile: true, suffix: 'schema' })).toBe('tag/tagSchema')
  })

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

  test.each([
    // version numbers with dots should NOT be split (Bug 4 regression)
    ['get_enterprise_configurations_id_v2025.0', { isFile: true }, 'getEnterpriseConfigurationsIdV20250'],
    ['some_operation_v3.14', { isFile: true }, 'someOperationV314'],
    // dots followed by letters ARE split in file mode (namespace-like paths)
    ['pet.petId', { isFile: true }, 'pet/petId'],
    ['pet.Pet', { isFile: true }, 'pet/pet'],
    // dots before digits should NOT split
    ['version.1.2.3', { isFile: true }, 'version123'],
    // dots before letters DO split
    ['api.v2', { isFile: true }, 'api/v2'],
  ])('camelCase(%s, %o) -> %s (file mode dot handling)', (input, options, expected) => {
    expect(camelCase(input, options as Parameters<typeof camelCase>[1])).toBe(expected)
  })

  test.each([
    // version numbers with dots should NOT be split (Bug 4 regression)
    ['get_enterprise_configurations_id_v2025.0', { isFile: true }, 'GetEnterpriseConfigurationsIdV20250'],
    ['some_operation_v3.14', { isFile: true }, 'SomeOperationV314'],
    // dots followed by letters ARE split in file mode
    ['pet.petId', { isFile: true }, 'pet/PetId'],
    ['pet.Pet', { isFile: true }, 'pet/Pet'],
  ])('pascalCase(%s, %o) -> %s (file mode dot handling)', (input, options, expected) => {
    expect(pascalCase(input, options as Parameters<typeof pascalCase>[1])).toBe(expected)
  })

  test('pascalCase', () => {
    expect(pascalCase('pet pet')).toBe('PetPet')
    expect(pascalCase('is HTML test')).toBe('IsHTMLTest')
    expect(pascalCase('aiType')).toBe('AiType')
    expect(pascalCase('pet.Pet', { isFile: true })).toBe('pet/Pet')
    expect(pascalCase('create tag.tag', { isFile: true })).toBe('createTag/Tag')
    expect(pascalCase('tag.tag', { isFile: true, prefix: 'create' })).toBe('tag/CreateTag')
    expect(pascalCase('tag.tag', { isFile: true, suffix: 'schema' })).toBe('tag/TagSchema')
  })

  test('snakeCase', () => {
    expect(snakeCase('petPet')).toBe('pet_pet')
    expect(snakeCase('created at')).toBe('created_at')
    expect(snakeCase('FILE.UPLOADED')).toBe('file_uploaded')
    expect(snakeCase('FILE.DOWNLOADED')).toBe('file_downloaded')
    expect(snakeCase('enum-value')).toBe('enum_value')
    expect(snakeCase('is HTML test')).toBe('is_html_test')
    expect(snakeCase('description')).toBe('description')
    expect(snakeCase('PetType')).toBe('pet_type')
    expect(snakeCase('tag', { prefix: 'create' })).toBe('create_tag')
    expect(snakeCase('tag', { suffix: 'schema' })).toBe('tag_schema')
  })

  test('screamingSnakeCase', () => {
    expect(screamingSnakeCase('petPet')).toBe('PET_PET')
    expect(screamingSnakeCase('created at')).toBe('CREATED_AT')
    expect(screamingSnakeCase('FILE.UPLOADED')).toBe('FILE_UPLOADED')
    expect(screamingSnakeCase('FILE.DOWNLOADED')).toBe('FILE_DOWNLOADED')
    expect(screamingSnakeCase('enum-value')).toBe('ENUM_VALUE')
    expect(screamingSnakeCase('is HTML test')).toBe('IS_HTML_TEST')
    expect(screamingSnakeCase('description')).toBe('DESCRIPTION')
    expect(screamingSnakeCase('PetType')).toBe('PET_TYPE')
    expect(screamingSnakeCase('tag', { prefix: 'create' })).toBe('CREATE_TAG')
    expect(screamingSnakeCase('tag', { suffix: 'schema' })).toBe('TAG_SCHEMA')
  })
})
