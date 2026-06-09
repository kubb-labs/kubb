import { describe, expect, it } from 'vitest'
import {
  buildJSDoc,
  buildList,
  buildObject,
  childName,
  enumPropName,
  extractRefName,
  findDiscriminator,
  getNestedAccessor,
  jsStringEscape,
  objectKey,
  stringify,
  stringifyObject,
  toRegExpString,
  trimQuotes,
} from './index.ts'

describe('trimQuotes', () => {
  it('strips a balanced double-quote pair', () => {
    expect(trimQuotes('"hello"')).toBe('hello')
  })

  it('strips a balanced single-quote pair', () => {
    expect(trimQuotes("'hello'")).toBe('hello')
  })

  it('strips a balanced backtick pair', () => {
    expect(trimQuotes('`hello`')).toBe('hello')
  })

  it('leaves an unquoted string unchanged', () => {
    expect(trimQuotes('hello')).toBe('hello')
  })

  it('leaves a mismatched pair unchanged', () => {
    expect(trimQuotes('"hello\'')).toBe('"hello\'')
  })
})

describe('stringify', () => {
  it('wraps a plain string in single quotes', () => {
    expect(stringify('hello')).toBe("'hello'")
  })

  it('strips existing surrounding quotes first', () => {
    expect(stringify('"hello"')).toBe("'hello'")
  })

  it('escapes an embedded single quote', () => {
    expect(stringify("o'clock")).toBe("'o\\'clock'")
  })

  it('escapes a newline', () => {
    expect(stringify('a\nb')).toBe("'a\\nb'")
  })

  it('serializes numbers and booleans', () => {
    expect(stringify(42)).toBe("'42'")
    expect(stringify(true)).toBe("'true'")
  })

  it('returns empty quotes for undefined', () => {
    expect(stringify(undefined)).toBe("''")
  })
})

describe('jsStringEscape', () => {
  it('escapes quotes and backslashes', () => {
    expect(jsStringEscape('say "hi"')).toBe('say \\"hi\\"')
    expect(jsStringEscape("o'clock")).toBe("o\\'clock")
    expect(jsStringEscape('a\\b')).toBe('a\\\\b')
  })

  it('escapes line terminators', () => {
    expect(jsStringEscape('a\nb\rc')).toBe('a\\nb\\rc')
    expect(jsStringEscape('a\u2028b\u2029c')).toBe('a\\u2028b\\u2029c')
  })
})

describe('toRegExpString', () => {
  it('renders a RegExp constructor call', () => {
    expect(toRegExpString('foo')).toBe('new RegExp("foo")')
  })

  it('extracts inline flags into a second argument', () => {
    expect(toRegExpString('^(?im)foo')).toBe('new RegExp("^foo", "im")')
  })

  it('renders a regex literal when func is null', () => {
    expect(toRegExpString('^(?im)foo', null)).toBe('/^foo/im')
  })

  it('strips surrounding quotes before parsing', () => {
    expect(toRegExpString('"foo"')).toBe('new RegExp("foo")')
  })
})

describe('stringifyObject', () => {
  it('renders flat key-value pairs', () => {
    expect(stringifyObject({ a: 1, b: 'x' })).toBe('a: 1,\nb: x')
  })

  it('renders nested objects with indentation', () => {
    expect(stringifyObject({ foo: 'bar', nested: { a: 1 } })).toBe('foo: bar,\nnested: {\n        a: 1\n      }')
  })
})

describe('getNestedAccessor', () => {
  it('renders an optional-chaining accessor from a dotted path', () => {
    expect(getNestedAccessor('pagination.next.id', 'lastPage')).toBe("lastPage?.['pagination']?.['next']?.['id']")
  })

  it('accepts a string array', () => {
    expect(getNestedAccessor(['a', 'b'], 'root')).toBe("root?.['a']?.['b']")
  })

  it('returns null for an empty path', () => {
    expect(getNestedAccessor('', 'root')).toBeNull()
  })
})

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

describe('extractRefName', () => {
  it('extracts schema name from component schema refs', () => {
    expect(extractRefName('#/components/schemas/Order')).toBe('Order')
  })

  it('extracts name from component response refs', () => {
    expect(extractRefName('#/components/responses/NotFound')).toBe('NotFound')
  })

  it('falls back to the full string when no slash is present', () => {
    expect(extractRefName('SomeName')).toBe('SomeName')
  })
})

describe('childName', () => {
  it('returns null when parentName is undefined', () => {
    expect(childName(undefined, 'params')).toBeNull()
  })

  it('returns PascalCase of `parentName + propName`', () => {
    expect(childName('Order', 'params')).toBe('OrderParams')
    expect(childName('Order', 'shipping_address')).toBe('OrderShippingAddress')
  })
})

describe('enumPropName', () => {
  it('combines parentName, propName, and enumSuffix', () => {
    expect(enumPropName('Order', 'status', 'enum')).toBe('OrderStatusEnum')
  })

  it('works without parentName and with a custom suffix', () => {
    expect(enumPropName(undefined, 'status', 'enum')).toBe('StatusEnum')
    expect(enumPropName('Order', 'status', 'Type')).toBe('OrderStatusType')
  })
})

describe('findDiscriminator', () => {
  it('returns the mapping key for a matching discriminator ref', () => {
    const mapping = {
      cat: '#/components/schemas/Cat',
      dog: '#/components/schemas/Dog',
    }

    expect(findDiscriminator(mapping, '#/components/schemas/Dog')).toBe('dog')
  })

  it.each([
    {
      label: 'mapping is missing',
      mapping: undefined,
      ref: '#/components/schemas/Dog' as string | undefined,
    },
    {
      label: 'ref is missing',
      mapping: { cat: '#/components/schemas/Cat' },
      ref: undefined,
    },
    {
      label: 'ref does not match any mapping entry',
      mapping: { cat: '#/components/schemas/Cat' },
      ref: '#/components/schemas/Dog',
    },
  ])('returns null when $label', ({ mapping, ref }) => {
    expect(findDiscriminator(mapping, ref)).toBeNull()
  })
})
