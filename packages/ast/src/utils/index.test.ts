import { describe, expect, it } from 'vitest'
import { buildJSDoc, buildList, buildObject, childName, enumPropName, extractRefName, findDiscriminator, objectKey } from './index.ts'

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
