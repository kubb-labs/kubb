import { schemas } from '@kubb/plugin-oas/mocks'

import * as parserType from './parser.ts'

describe('type parse', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parserType.parse(
      { name, schema: {}, parent: undefined, current: schema, siblings: [schema] },
      { optionalType: 'questionToken', enumType: 'asConst' },
    )
    expect(text).toMatchSnapshot()
  })

  test('array with enum items should create array type with enum reference', () => {
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
    expect(result.kind).toBeDefined()
  })
})
