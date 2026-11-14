import { describe, expect, it } from 'vitest'
import { type ArrayExpression, type ObjectExpression, parseExpression } from './ast.ts'
import { appendItem, printValue, quotes, removeItem } from './text.ts'

/** Parses `source` as one object or array literal; an object needs parentheses to read as an expression. */
function literal(source: string): ObjectExpression | ArrayExpression {
  return parseExpression(source) as ObjectExpression | ArrayExpression
}

describe('printValue', () => {
  it.each([
    { value: `it's "x"\n`, quote: quotes.single, expected: `'it\\'s "x"\\n'` },
    { value: `it's "x"`, quote: quotes.double, expected: `"it's \\"x\\""` },
    { value: { a: [1, null, true], 'b-c': {} }, quote: quotes.single, expected: `{ a: [1, null, true], 'b-c': {} }` },
  ])('prints $value with $quote quotes', ({ value, quote, expected }) => {
    expect(printValue(value, quote)).toBe(expected)
  })
})

describe('appendItem', () => {
  it.each([
    { title: 'an empty object', source: '({})', expected: '({ b: 2 })' },
    { title: 'an empty array', source: '[]', expected: '[b: 2]' },
    { title: 'an inline object', source: '({ a: 1 })', expected: '({ a: 1, b: 2 })' },
    { title: 'a multiline object with a trailing comma', source: '({\n  a: 1, // note\n})', expected: '({\n  a: 1, // note\n  b: 2,\n})' },
    { title: 'a multiline object without a trailing comma', source: '({\n    a: 1\n})', expected: '({\n    a: 1,\n    b: 2\n})' },
  ])('adds to $title', ({ source, expected }) => {
    expect(appendItem(source, literal(source), 'b: 2')).toBe(expected)
  })
})

describe('removeItem', () => {
  it.each([
    { title: 'the only item', source: '[1]', index: 0, expected: '[]' },
    { title: 'an item on its own line', source: '({\n  a: 1,\n  b: 2, // note\n})', index: 1, expected: '({\n  a: 1,\n})' },
    { title: 'the last inline item', source: '({ a: 1, b: 2 })', index: 1, expected: '({ a: 1 })' },
  ])('drops $title', ({ source, index, expected }) => {
    expect(removeItem(source, literal(source), index)).toBe(expected)
  })
})
