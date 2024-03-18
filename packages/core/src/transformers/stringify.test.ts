import { stringify } from './stringify.ts'

describe('stringify', () => {
  test('return stringify text', () => {
    expect('Hello World!').toMatchInlineSnapshot(`"Hello World!"`)
    expect(stringify('Hello World!')).toMatchInlineSnapshot(`""Hello World!""`)
    expect(stringify('"Hello World!"')).toMatchInlineSnapshot(`""Hello World!""`)
    expect(stringify('`Hello World!`')).toMatchInlineSnapshot(`""Hello World!""`)
    expect(stringify("'Hello World!'")).toMatchInlineSnapshot(`""Hello World!""`)
  })
})
