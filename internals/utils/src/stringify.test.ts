import { describe, expect, test } from 'vitest'
import { stringify } from './object.ts'

describe('stringify', () => {
  test('return stringify text', () => {
    expect('Hello World!').toMatchInlineSnapshot(`"Hello World!"`)
    expect(stringify('Hello World!')).toMatchInlineSnapshot(`""Hello World!""`)
    expect(stringify('"Hello World!"')).toMatchInlineSnapshot(`""Hello World!""`)
    expect(stringify('`Hello World!`')).toMatchInlineSnapshot(`""Hello World!""`)
    expect(stringify("'Hello World!'")).toMatchInlineSnapshot(`""Hello World!""`)
  })
})
