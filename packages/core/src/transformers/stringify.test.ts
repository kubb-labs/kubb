import { stringify } from './stringify.ts'
import { describe, expect, test } from 'vitest'


describe('stringify', () => {
  test('return stringify text', () => {
    expect('Hello World!').toMatchInlineSnapshot(`"Hello World!"`)
    expect(stringify('Hello World!')).toMatchInlineSnapshot(`""Hello World!""`)
    expect(stringify('"Hello World!"')).toMatchInlineSnapshot(`""Hello World!""`)
    expect(stringify('`Hello World!`')).toMatchInlineSnapshot(`""Hello World!""`)
    expect(stringify("'Hello World!'")).toMatchInlineSnapshot(`""Hello World!""`)
  })
})
