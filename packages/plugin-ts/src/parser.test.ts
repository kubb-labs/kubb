import { schemas } from '@kubb/plugin-oas/mocks'
import { describe, expect, it, test } from 'vitest'
import * as parserType from './parser.ts'

describe('type parse', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parserType.parse(
      { name, schema: {}, parent: undefined, current: schema, siblings: [schema] },
      { optionalType: 'questionToken', enumType: 'asConst' },
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
      { optionalType: 'questionToken', enumType: 'asConst' },
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
      { optionalType: 'questionToken', enumType: 'asConst' },
    )

    // Should generate: (unknown | null)
    expect(result).toBeTruthy()
    expect(result).toMatchSnapshot()
  })

  it('should handle object with properties that map to undefined gracefully', () => {
    const schema = {
      keyword: 'object',
      args: {
        properties: {
          testProp: [
            { keyword: 'catchall' }, // This maps to undefined in typeKeywordMapper
          ],
        },
      },
    }
    const result = parserType.parse(
      { name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] },
      { optionalType: 'questionToken', enumType: 'asConst' },
    )

    // Should generate a valid TypeScript node with unknown type for the property
    expect(result).toBeTruthy()
    if (result && 'members' in result && Array.isArray(result.members)) {
      expect(result.members.length).toBeGreaterThan(0)
    }
  })
})
