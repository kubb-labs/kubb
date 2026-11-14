import { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { createSchemaParser } from '../../parser.ts'
import { createRefs } from '../../refs.ts'
import type { Document, SchemaObject } from '../../types.ts'

const document = { openapi: '3.1.0', info: { title: 'Scalars', version: '1' }, paths: {} } as Document
const refs = createRefs(document)

function parse(schema: SchemaObject, options: Partial<ast.ParserOptions> = {}): ast.SchemaNode {
  return createSchemaParser({ document, refs, options })({ schema, name: 'Value' })
}

describe('const', () => {
  it.each([
    { value: null, expected: { type: 'null', primitive: 'null' } },
    { value: 3, expected: { type: 'enum', primitive: 'number', enumValues: [3] } },
    { value: true, expected: { type: 'enum', primitive: 'boolean', enumValues: [true] } },
  ])('converts const $value', ({ value, expected }) => {
    expect(parse({ const: value, description: 'kept' } as SchemaObject)).toMatchObject({ ...expected, description: 'kept' })
  })
})

describe('format', () => {
  it.each([
    { integerType: 'bigint', expected: 'bigint' },
    { integerType: 'number', expected: 'integer' },
  ] as const)('maps int64 to $expected with integerType $integerType', ({ integerType, expected }) => {
    expect(parse({ type: 'integer', format: 'int64', minimum: 0 }, { integerType })).toMatchObject({ type: expected, min: 0 })
  })

  it.each([
    { format: 'date-time', dateType: 'string', expected: { type: 'datetime', offset: false, local: false } },
    { format: 'date-time', dateType: 'date', expected: { type: 'date', representation: 'date' } },
  ] as const)('maps $format with dateType $dateType', ({ format, dateType, expected }) => {
    expect(parse({ type: 'string', format }, { dateType })).toMatchObject(expected)
  })
})

describe('enum', () => {
  it('drops null and out-of-bounds values and marks the enum nullable', () => {
    expect(parse({ type: 'integer', enum: [0, 1, 5, null], minimum: 1, maximum: 4 })).toMatchObject({
      type: 'enum',
      nullable: true,
      namedEnumValues: [{ name: '1', value: 1, primitive: 'number' }],
    })
  })

  it('ignores bounds that exclude every value', () => {
    const node = parse({ type: 'integer', enum: [1, 2], minimum: 10 })
    expect(ast.schema.narrow(node, 'enum')?.namedEnumValues?.map((entry) => entry.value)).toStrictEqual([1, 2])
  })

  it('keeps float multiples within tolerance', () => {
    const node = parse({ type: 'number', enum: [0.3, 0.35], multipleOf: 0.1 })
    expect(ast.schema.narrow(node, 'enum')?.namedEnumValues?.map((entry) => entry.value)).toStrictEqual([0.3])
  })

  it('keeps x-enumNames and descriptions aligned after a value is dropped', () => {
    const schema = {
      type: 'integer',
      enum: [null, 1, 2],
      'x-enumNames': ['None', 'One', 'Two'],
      'x-enumDescriptions': ['-', 'first', 'second'],
    } as SchemaObject
    expect(ast.schema.narrow(parse(schema), 'enum')?.namedEnumValues).toStrictEqual([
      { name: 'One', value: 1, primitive: 'number', description: 'first' },
      { name: 'Two', value: 2, primitive: 'number', description: 'second' },
    ])
  })
})
