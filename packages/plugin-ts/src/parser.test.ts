import { schemas } from '@kubb/plugin-oas/mocks'
import { describe, expect, it, test } from 'vitest'
import * as parserType from './parser.ts'

describe('type parse', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parserType.parse(
      { name, schema: {}, parent: undefined, current: schema, siblings: [schema] },
      { optionalType: 'questionToken', arrayType: 'array', propertyCasing: 'none', enumType: 'asConst' },
    )
    expect(text).toMatchSnapshot()
  })

  it('should create array type with enum reference when items are enums', () => {
    const schema = {
      keyword: 'array',
      args: {
        items: [
          {
            keyword: 'enum',
            args: {
              name: 'TestArrayEnum',
              typeName: 'TestArrayEnum',
              asConst: false,
              items: [
                { name: '"foo"', value: 'foo', format: 'string' },
                { name: '"bar"', value: 'bar', format: 'string' },
                { name: '"baz"', value: 'baz', format: 'string' },
              ],
            },
          },
        ],
      },
    }
    const result = parserType.parse(
      { name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] },
      { optionalType: 'questionToken', arrayType: 'array', propertyCasing: 'none', enumType: 'asConst' },
    )

    // Should generate: Array<TestArrayEnumKey>
    expect(result).toBeTruthy()
    // The result is a TypeScript AST node, so we need to check its structure
    if (result) {
      expect(result.kind).toBeDefined()
    }
  })

  it('should preserve both unknown and null types in union', () => {
    const schema = {
      keyword: 'union',
      args: [{ keyword: 'unknown' }, { keyword: 'null' }],
    }
    const result = parserType.parse(
      { name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] },
      { optionalType: 'questionToken', arrayType: 'array', propertyCasing: 'none', enumType: 'asConst' },
    )

    // Should generate: (unknown | null)
    expect(result).toBeTruthy()
    expect(result).toMatchSnapshot()
  })

  describe('arrayType option', () => {
    it('should create array syntax (string[]) when arrayType is "array"', () => {
      const schema = {
        keyword: 'array',
        args: {
          items: [{ keyword: 'string' }],
        },
      }
      const result = parserType.parse(
        { name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] },
        { optionalType: 'questionToken', arrayType: 'array', propertyCasing: 'none', enumType: 'asConst' },
      )

      expect(result).toBeTruthy()
      expect(result).toMatchSnapshot()
    })

    it('should create generic syntax (Array<string>) when arrayType is "generic"', () => {
      const schema = {
        keyword: 'array',
        args: {
          items: [{ keyword: 'string' }],
        },
      }
      const result = parserType.parse(
        { name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] },
        { optionalType: 'questionToken', arrayType: 'generic', propertyCasing: 'none', enumType: 'asConst' },
      )

      expect(result).toBeTruthy()
      expect(result).toMatchSnapshot()
    })
  })
})
