import { describe, expect, test } from 'vitest'
import { camelCase, capitalize, pascalCase, screamingSnakeCase, snakeCase } from './casing.ts'

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
    // a status range stays lower case
    ['listPets Status 2xx', 'listPetsStatus2xx'],
    ['listPetsStatus4xx headers', 'listPetsStatus4xxHeaders'],
    ['get2xxl', 'get2Xxl'],
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
    expect(pascalCase('list pets status 2xx')).toBe('ListPetsStatus2xx')
  })
})

describe('casing cache', () => {
  test('keeps camelCase and PascalCase results for the same text apart', () => {
    expect(camelCase('pet-store')).toBe('petStore')
    expect(pascalCase('pet-store')).toBe('PetStore')
    expect(camelCase('pet-store')).toBe('petStore')
  })
})

describe('snake casing', () => {
  test.each([['', '']])('capitalize(%s) -> %s', (input, expected) => {
    expect(capitalize(input)).toBe(expected)
  })

  test.each([
    // separators
    ['created at', 'created_at'],
    ['enum-value', 'enum_value'],
    ['FILE.UPLOADED', 'file_uploaded'],
    ['pets/{id}:list', 'pets_id_list'],
    // camelCase and PascalCase input
    ['petPet', 'pet_pet'],
    ['PetType', 'pet_type'],
    // acronyms, including plurals and a lowercase run after them
    ['is HTML test', 'is_html_test'],
    ['HTTPResponse', 'http_response'],
    ['userIDs', 'user_ids'],
    ['URLs', 'urls'],
    ['OAuth2Token', 'oauth2_token'],
    // a digit followed by an uppercase word starts a new word, a digit-letter token stays whole
    ['sensor2Reading', 'sensor2_reading'],
    ['v1alpha1', 'v1alpha1'],
    ['COOL_2D_DRAWING', 'cool_2d_drawing'],
    // single word and empty
    ['description', 'description'],
    ['', ''],
  ])('snakeCase(%s) -> %s', (input, expected) => {
    expect(snakeCase(input)).toBe(expected)
  })

  test.each(['cool_2d_drawing', 'ranked_3rd_place', 'sensor2_reading', 'v1alpha1', '2fa', 'a'])('snakeCase keeps %s unchanged', (input) => {
    expect(snakeCase(input)).toBe(input)
  })

  test('snake case with a prefix or suffix', () => {
    expect(snakeCase('tag', { prefix: 'create' })).toBe('create_tag')
    expect(snakeCase('tag', { suffix: 'schema' })).toBe('tag_schema')
    expect(screamingSnakeCase('tag', { prefix: 'create' })).toBe('CREATE_TAG')
    expect(screamingSnakeCase('tag', { suffix: 'schema' })).toBe('TAG_SCHEMA')
  })
})
