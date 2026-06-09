import { describe, expect, test } from 'vitest'
import { isIdentifier, isValidVarName, transformReservedWord } from './reserved.ts'

describe('isIdentifier', () => {
  test('accepts identifier syntax including reserved words and globals', () => {
    expect(isIdentifier('name')).toBe(true)
    expect(isIdentifier('class')).toBe(true)
    expect(isIdentifier('_id$')).toBe(true)
  })

  test('rejects non-identifier syntax', () => {
    expect(isIdentifier('x-total')).toBe(false)
    expect(isIdentifier('200')).toBe(false)
    expect(isIdentifier('with space')).toBe(false)
  })
})

describe('transformReservedWord', () => {
  test('template rendering', () => {
    expect(transformReservedWord('delete')).toBe('_delete')
    expect(transformReservedWord('this')).toBe('_this')
    expect(transformReservedWord('var')).toBe('_var')
    expect(transformReservedWord('1test')).toBe('_1test')
  })
})

describe('isValidVarName', () => {
  test('valid identifiers return true', () => {
    expect(isValidVarName('status')).toBe(true)
    expect(isValidVarName('_private')).toBe(true)
    expect(isValidVarName('$el')).toBe(true)
    expect(isValidVarName('camelCase')).toBe(true)
    expect(isValidVarName('with123')).toBe(true)
  })

  test('reserved words return false', () => {
    expect(isValidVarName('class')).toBe(false)
    expect(isValidVarName('var')).toBe(false)
    expect(isValidVarName('return')).toBe(false)
    expect(isValidVarName('null')).toBe(false)
  })

  test('identifiers starting with a digit return false', () => {
    expect(isValidVarName('42foo')).toBe(false)
    expect(isValidVarName('1test')).toBe(false)
  })

  test('empty string returns false', () => {
    expect(isValidVarName('')).toBe(false)
  })

  test('names with special characters return false', () => {
    expect(isValidVarName('foo-bar')).toBe(false)
    expect(isValidVarName('foo bar')).toBe(false)
    expect(isValidVarName('foo.bar')).toBe(false)
  })
})
