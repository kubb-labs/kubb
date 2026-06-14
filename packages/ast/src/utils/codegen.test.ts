import { describe, expect, it } from 'vitest'
import { buildJSDoc, buildList, buildObject, objectKey } from './codegen.ts'

describe('buildJSDoc', () => {
  it('builds a comment block from lines', () => {
    expect(buildJSDoc(['@type string', '@example hello'])).toBe('/**\n   * @type string\n   * @example hello\n   */\n  ')
  })

  it('returns the fallback when there are no comments', () => {
    expect(buildJSDoc([])).toBe('  ')
    expect(buildJSDoc([], { fallback: '' })).toBe('')
  })
})

describe('objectKey', () => {
  it('leaves valid identifiers unquoted', () => {
    expect(objectKey('id')).toMatchInlineSnapshot(`"id"`)
  })

  it('leaves reserved words and globals unquoted', () => {
    expect(objectKey('name')).toMatchInlineSnapshot(`"name"`)
    expect(objectKey('class')).toMatchInlineSnapshot(`"class"`)
  })

  it('single-quotes keys that are not valid identifiers', () => {
    expect(objectKey('x-total')).toMatchInlineSnapshot(`"'x-total'"`)
    expect(objectKey('200')).toMatchInlineSnapshot(`"'200'"`)
  })
})

describe('buildObject', () => {
  it('returns an empty object literal for no entries', () => {
    expect(buildObject([])).toMatchInlineSnapshot(`"{}"`)
  })

  it('indents entries and adds a trailing comma', () => {
    expect(buildObject(['id: z.number()', 'name: z.string()'])).toMatchInlineSnapshot(`
      "{
        id: z.number(),
        name: z.string(),
      }"
    `)
  })

  it('indents a nested object cumulatively', () => {
    const address = `address: ${buildObject(['street: z.string()'])}`
    expect(buildObject(['id: z.number()', address])).toMatchInlineSnapshot(`
      "{
        id: z.number(),
        address: {
          street: z.string(),
        },
      }"
    `)
  })
})

describe('buildList', () => {
  it('returns an empty list for no items', () => {
    expect(buildList([])).toMatchInlineSnapshot(`"[]"`)
  })

  it('keeps single-line items inline', () => {
    expect(buildList(['z.string()', 'z.number()'])).toMatchInlineSnapshot(`"[z.string(), z.number()]"`)
  })

  it('wraps and indents when an item spans multiple lines', () => {
    const member = buildObject(['id: z.number()'])
    expect(buildList([`z.object(${member})`, 'z.string()'])).toMatchInlineSnapshot(`
      "[
        z.object({
          id: z.number(),
        }),
        z.string(),
      ]"
    `)
  })

  it('uses custom brackets', () => {
    expect(buildList(['a', 'b'], ['(', ')'])).toMatchInlineSnapshot(`"(a, b)"`)
  })
})
