import { schemas } from '@kubb/plugin-oas/mocks'
import type { Schema } from '@kubb/plugin-oas'
import { schemaKeywords } from '@kubb/plugin-oas'
import { describe, expect, test } from 'vitest'
import * as parserFaker from './parser.ts'

describe('faker parse', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parserFaker.parse(
      {
        name,
        schema: {},
        parent: undefined,
        current: schema,
        siblings: [schema],
      },
      { typeName: 'Pet' },
    )
    expect(text).toMatchSnapshot()
  })
})

describe('hasIndirectRef', () => {
  test('returns false for schemas with no refs', () => {
    const input: Schema[] = [{ keyword: schemaKeywords.string }, { keyword: schemaKeywords.number }]
    expect(parserFaker.hasIndirectRef(input, 'createFoo')).toBe(false)
  })

  test('returns false when only ref is a self-ref', () => {
    const input: Schema[] = [
      { keyword: schemaKeywords.ref, args: { name: 'createFoo', $ref: '#/components/schemas/Foo', path: './Foo.ts' as any, isImportable: true } },
    ]
    expect(parserFaker.hasIndirectRef(input, 'createFoo')).toBe(false)
  })

  test('returns true when a ref points to a different type', () => {
    const input: Schema[] = [
      { keyword: schemaKeywords.ref, args: { name: 'createBar', $ref: '#/components/schemas/Bar', path: './Bar.ts' as any, isImportable: true } },
    ]
    expect(parserFaker.hasIndirectRef(input, 'createFoo')).toBe(true)
  })

  test('returns true for indirect ref nested inside an array', () => {
    const refSchema: Schema = { keyword: schemaKeywords.ref, args: { name: 'createBar', $ref: '#/components/schemas/Bar', path: './Bar.ts' as any, isImportable: true } }
    const input: Schema[] = [{ keyword: schemaKeywords.array, args: { items: [refSchema], min: undefined, max: undefined } }]
    expect(parserFaker.hasIndirectRef(input, 'createFoo')).toBe(true)
  })

  test('does not throw on a cyclic Schema IR', () => {
    const objSchema: any = {
      keyword: schemaKeywords.object,
      args: { properties: {}, additionalProperties: [] },
    }
    objSchema.args.properties = { self: [objSchema] }
    expect(() => parserFaker.hasIndirectRef([objSchema as Schema], 'createFoo')).not.toThrow()
  })

  test('handles moderately nested schemas without error', () => {
    let inner: Schema = { keyword: schemaKeywords.string }
    for (let i = 0; i < 200; i++) {
      const wrapper: Schema = {
        keyword: schemaKeywords.object,
        args: { properties: { child: [inner] }, additionalProperties: [] },
      }
      inner = wrapper
    }
    expect(() => parserFaker.hasIndirectRef([inner], 'createFoo')).not.toThrow()
  })
})
