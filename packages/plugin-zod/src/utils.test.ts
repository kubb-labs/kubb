import { createProperty, createSchema } from '@kubb/ast'
import { describe, expect, test } from 'vitest'
import {
  applyMiniModifiers,
  applyModifiers,
  containsSelfRef,
  formatDefault,
  formatLiteral,
  lengthChecksMini,
  lengthConstraints,
  numberChecksMini,
  numberConstraints,
} from './utils.ts'

describe('formatDefault', () => {
  test('string value is quoted', () => {
    expect(formatDefault('hello')).toBe('"hello"')
  })

  test('number value is stringified', () => {
    expect(formatDefault(42)).toBe('42')
  })

  test('boolean value is stringified', () => {
    expect(formatDefault(false)).toBe('false')
  })

  test('object value becomes empty object literal', () => {
    expect(formatDefault({ a: 1 })).toBe('{}')
  })

  test('null produces empty string (not object literal)', () => {
    expect(formatDefault(null)).toBe('')
  })

  test('undefined value becomes empty string', () => {
    expect(formatDefault(undefined)).toBe('')
  })
})

describe('formatLiteral', () => {
  test('string value is quoted', () => {
    expect(formatLiteral('cat')).toBe('"cat"')
  })

  test('number value is raw', () => {
    expect(formatLiteral(0)).toBe('0')
  })

  test('boolean true is raw', () => {
    expect(formatLiteral(true)).toBe('true')
  })

  test('boolean false is raw', () => {
    expect(formatLiteral(false)).toBe('false')
  })
})

describe('numberConstraints', () => {
  test('no constraints returns empty string', () => {
    expect(numberConstraints({})).toBe('')
  })

  test('min only', () => {
    expect(numberConstraints({ min: 0 })).toBe('.min(0)')
  })

  test('max only', () => {
    expect(numberConstraints({ max: 100 })).toBe('.max(100)')
  })

  test('min and max', () => {
    expect(numberConstraints({ min: 1, max: 10 })).toBe('.min(1).max(10)')
  })

  test('exclusiveMinimum', () => {
    expect(numberConstraints({ exclusiveMinimum: 0 })).toBe('.gt(0)')
  })

  test('exclusiveMaximum', () => {
    expect(numberConstraints({ exclusiveMaximum: 100 })).toBe('.lt(100)')
  })

  test('all constraints combined', () => {
    expect(numberConstraints({ min: 1, max: 99, exclusiveMinimum: 0, exclusiveMaximum: 100 })).toBe('.min(1).max(99).gt(0).lt(100)')
  })
})

describe('lengthConstraints', () => {
  test('no constraints returns empty string', () => {
    expect(lengthConstraints({})).toBe('')
  })

  test('min only', () => {
    expect(lengthConstraints({ min: 2 })).toBe('.min(2)')
  })

  test('max only', () => {
    expect(lengthConstraints({ max: 50 })).toBe('.max(50)')
  })

  test('min and max', () => {
    expect(lengthConstraints({ min: 1, max: 255 })).toBe('.min(1).max(255)')
  })

  test('pattern only', () => {
    expect(lengthConstraints({ pattern: '^\\d+$' })).toBe('.regex(/^\\d+$/)')
  })

  test('all constraints combined', () => {
    expect(lengthConstraints({ min: 1, max: 10, pattern: '^[a-z]+$' })).toBe('.min(1).max(10).regex(/^[a-z]+$/)')
  })
})

describe('numberChecksMini', () => {
  test('no constraints returns empty string', () => {
    expect(numberChecksMini({})).toBe('')
  })

  test('min only', () => {
    expect(numberChecksMini({ min: 0 })).toBe('.check(z.minimum(0))')
  })

  test('max only', () => {
    expect(numberChecksMini({ max: 100 })).toBe('.check(z.maximum(100))')
  })

  test('min and max', () => {
    expect(numberChecksMini({ min: 1, max: 10 })).toBe('.check(z.minimum(1), z.maximum(10))')
  })

  test('exclusiveMinimum', () => {
    expect(numberChecksMini({ exclusiveMinimum: 0 })).toBe('.check(z.minimum(0, { exclusive: true }))')
  })

  test('exclusiveMaximum', () => {
    expect(numberChecksMini({ exclusiveMaximum: 100 })).toBe('.check(z.maximum(100, { exclusive: true }))')
  })

  test('all constraints combined', () => {
    expect(numberChecksMini({ min: 1, max: 99, exclusiveMinimum: 0, exclusiveMaximum: 100 })).toBe(
      '.check(z.minimum(1), z.maximum(99), z.minimum(0, { exclusive: true }), z.maximum(100, { exclusive: true }))',
    )
  })
})

describe('lengthChecksMini', () => {
  test('no constraints returns empty string', () => {
    expect(lengthChecksMini({})).toBe('')
  })

  test('min only', () => {
    expect(lengthChecksMini({ min: 2 })).toBe('.check(z.minLength(2))')
  })

  test('max only', () => {
    expect(lengthChecksMini({ max: 50 })).toBe('.check(z.maxLength(50))')
  })

  test('min and max', () => {
    expect(lengthChecksMini({ min: 1, max: 255 })).toBe('.check(z.minLength(1), z.maxLength(255))')
  })

  test('pattern only', () => {
    expect(lengthChecksMini({ pattern: '^\\d+$' })).toBe('.check(z.regex(/^\\d+$/))')
  })

  test('all constraints combined', () => {
    expect(lengthChecksMini({ min: 1, max: 10, pattern: '^[a-z]+$' })).toBe('.check(z.minLength(1), z.maxLength(10), z.regex(/^[a-z]+$/))')
  })
})

describe('applyModifiers', () => {
  test('value only — no modifiers', () => {
    expect(applyModifiers({ value: 'z.string()' })).toBe('z.string()')
  })

  test('optional', () => {
    expect(applyModifiers({ value: 'z.string()', optional: true })).toBe('z.string().optional()')
  })

  test('nullable', () => {
    expect(applyModifiers({ value: 'z.string()', nullable: true })).toBe('z.string().nullable()')
  })

  test('nullish (explicit flag) takes priority over nullable+optional', () => {
    expect(applyModifiers({ value: 'z.string()', nullish: true, nullable: true, optional: true })).toBe('z.string().nullish()')
  })

  test('nullable and optional combined produce nullish', () => {
    expect(applyModifiers({ value: 'z.string()', nullable: true, optional: true })).toBe('z.string().nullish()')
  })

  test('default value (string)', () => {
    expect(applyModifiers({ value: 'z.string()', defaultValue: 'hi' })).toBe('z.string().default("hi")')
  })

  test('default value (number)', () => {
    expect(applyModifiers({ value: 'z.number()', defaultValue: 0 })).toBe('z.number().default(0)')
  })

  test('default value (object)', () => {
    expect(applyModifiers({ value: 'z.object({})', defaultValue: {} })).toBe('z.object({}).default({})')
  })

  test('description', () => {
    expect(applyModifiers({ value: 'z.string()', description: 'A name' })).toBe('z.string().describe("A name")')
  })

  test('all modifiers combined', () => {
    expect(applyModifiers({ value: 'z.string()', optional: true, nullable: true, defaultValue: 'x', description: 'desc' })).toBe(
      'z.string().nullish().default("x").describe("desc")',
    )
  })
})

describe('applyMiniModifiers', () => {
  test('value only — no modifiers', () => {
    expect(applyMiniModifiers({ value: 'z.string()' })).toBe('z.string()')
  })

  test('optional wraps with z.optional()', () => {
    expect(applyMiniModifiers({ value: 'z.string()', optional: true })).toBe('z.optional(z.string())')
  })

  test('nullable wraps with z.nullable()', () => {
    expect(applyMiniModifiers({ value: 'z.string()', nullable: true })).toBe('z.nullable(z.string())')
  })

  test('nullish wraps with z.nullish() and skips individual nullable/optional', () => {
    expect(applyMiniModifiers({ value: 'z.string()', nullish: true, nullable: true, optional: true })).toBe('z.nullish(z.string())')
  })

  test('nullable and optional both applied when not nullish', () => {
    expect(applyMiniModifiers({ value: 'z.string()', nullable: true, optional: true })).toBe('z.optional(z.nullable(z.string()))')
  })

  test('default value', () => {
    expect(applyMiniModifiers({ value: 'z.string()', defaultValue: 'hi' })).toBe('z._default(z.string(), "hi")')
  })

  test('default value (object)', () => {
    expect(applyMiniModifiers({ value: 'z.object({})', defaultValue: {} })).toBe('z._default(z.object({}), {})')
  })
})

describe('containsSelfRef', () => {
  const resolver = undefined

  test('returns false for non-ref node', () => {
    const node = createSchema({ type: 'string' })
    expect(containsSelfRef(node, 'mySchema', resolver)).toBe(false)
  })

  test('returns true when ref name matches schema name', () => {
    const node = createSchema({ type: 'ref', ref: '#/components/schemas/Node', name: 'Node' })
    expect(containsSelfRef(node, 'Node', resolver)).toBe(true)
  })

  test('returns false when ref name does not match', () => {
    const node = createSchema({ type: 'ref', ref: '#/components/schemas/Other', name: 'Other' })
    expect(containsSelfRef(node, 'Node', resolver)).toBe(false)
  })

  test('finds self-ref inside object property', () => {
    const refNode = createSchema({ type: 'ref', ref: '#/components/schemas/Tree', name: 'Tree' })
    const node = createSchema({
      type: 'object',
      properties: [createProperty({ name: 'child', required: false, schema: refNode })],
    })
    expect(containsSelfRef(node, 'Tree', resolver)).toBe(true)
  })

  test('returns false when object has no self-ref', () => {
    const node = createSchema({
      type: 'object',
      properties: [createProperty({ name: 'label', required: true, schema: createSchema({ type: 'string' }) })],
    })
    expect(containsSelfRef(node, 'Tree', resolver)).toBe(false)
  })

  test('finds self-ref inside array items', () => {
    const refNode = createSchema({ type: 'ref', ref: '#/components/schemas/List', name: 'List' })
    const node = createSchema({ type: 'array', items: [refNode] })
    expect(containsSelfRef(node, 'List', resolver)).toBe(true)
  })

  test('finds self-ref inside union member', () => {
    const refNode = createSchema({ type: 'ref', ref: '#/components/schemas/Value', name: 'Value' })
    const node = createSchema({ type: 'union', members: [createSchema({ type: 'string' }), refNode] })
    expect(containsSelfRef(node, 'Value', resolver)).toBe(true)
  })

  test('finds self-ref inside intersection member', () => {
    const refNode = createSchema({ type: 'ref', ref: '#/components/schemas/Base', name: 'Base' })
    const node = createSchema({ type: 'intersection', members: [createSchema({ type: 'object' }), refNode] })
    expect(containsSelfRef(node, 'Base', resolver)).toBe(true)
  })

  test('does not infinitely recurse on circular graph', () => {
    const node = createSchema({ type: 'object', name: 'Circular' })
    const visited = new Set([node])
    expect(containsSelfRef(node, 'Circular', resolver, visited)).toBe(false)
  })
})
