import { describe, expect, test } from 'vitest'
import { camelCase, pascalCase } from './casing.ts'
import { convertCaseJs, convertCaseNative } from './convertCase.ts'
import { native } from './loader.ts'

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

describe('casing cache', () => {
  test('keeps camelCase and PascalCase results for the same text apart', () => {
    expect(camelCase('pet-store')).toBe('petStore')
    expect(pascalCase('pet-store')).toBe('PetStore')
    expect(camelCase('pet-store')).toBe('petStore')
  })
})

describe('native', () => {
  const inputs = [
    'hello-world',
    'HelloWorld',
    'getHTTPSResponse',
    'ABcDEf',
    'AbCDe',
    '123invalid',
    'get2pet',
    'hello@world',
    'pet.petId',
    'a/b\\c:d',
    '  padded\t',
    ' nbsp　wide﻿',
    'x\u0085y',
    'école',
    'ÉCOLE',
    'straße',
    'ß',
    'ſoo',
    '😀',
    '😀b',
    'ID',
    'iD',
    'I',
    '',
  ]

  test.skipIf(process.env.KUBB_NATIVE === '0')('loads the WebAssembly module', () => {
    expect(native).not.toBeNull()
  })

  test.skipIf(!convertCaseNative).each(inputs)('convert_case(%j) matches the JavaScript version', (input) => {
    expect(convertCaseNative!(input, false)).toBe(convertCaseJs(input, false))
    expect(convertCaseNative!(input, true)).toBe(convertCaseJs(input, true))
  })

  test.skipIf(!convertCaseNative)('survives inputs larger than the initial memory', () => {
    const input = 'word-'.repeat(200_000)
    expect(convertCaseNative!(input, false)).toBe(convertCaseJs(input, false))
  })
})
