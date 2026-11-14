import { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PARSER_OPTIONS } from '../../constants.ts'
import { isNullable } from '../../oas.ts'
import { createSchemaParser } from '../../parser.ts'
import { createRefs } from '../../refs.ts'
import type { Document, SchemaObject } from '../../types.ts'
import type { ConvertContext } from '../parseSchema.ts'
import { convertConst, convertEnum, convertFormat, convertFormattedEnum, convertNumeric, convertString } from './scalar.ts'

const document = { openapi: '3.1.0', info: { title: 'Scalars', version: '1' }, paths: {} } as Document
const refs = createRefs(document)

function context(schema: SchemaObject, options: Partial<ast.ParserOptions> = {}): ConvertContext {
  const type = Array.isArray(schema.type) ? schema.type.find((t) => t !== 'null') : schema.type
  return {
    schema,
    name: 'Value',
    nullable: isNullable(schema) || undefined,
    defaultValue: schema.default,
    type,
    options: { ...DEFAULT_PARSER_OPTIONS, ...options },
    parse: createSchemaParser({ document, refs, options }),
    document,
    refs,
  }
}

describe('convertConst', () => {
  it.each([
    { value: null, expected: { type: 'null', primitive: 'null' } },
    { value: 3, expected: { type: 'enum', primitive: 'number', enumValues: [3] } },
    { value: true, expected: { type: 'enum', primitive: 'boolean', enumValues: [true] } },
  ])('converts const $value', ({ value, expected }) => {
    expect(convertConst(context({ const: value, description: 'kept' } as SchemaObject))).toMatchObject({ ...expected, description: 'kept' })
  })
})

describe('convertFormat', () => {
  it('keeps a numeric format on a string as a string', () => {
    expect(convertFormat(context({ type: 'string', format: 'int64', pattern: '^\\d+$' }))).toMatchObject({
      type: 'string',
      format: 'int64',
      pattern: '^\\d+$',
    })
  })

  it.each([
    { integerType: 'bigint', expected: 'bigint' },
    { integerType: 'number', expected: 'integer' },
  ] as const)('maps int64 to $expected with integerType $integerType', ({ integerType, expected }) => {
    expect(convertFormat(context({ type: 'integer', format: 'int64', minimum: 0 }, { integerType }))).toMatchObject({ type: expected, min: 0 })
  })

  it.each([
    { format: 'date-time', dateType: 'string', expected: { type: 'datetime', offset: false, local: false } },
    { format: 'date-time', dateType: { dateTime: 'stringOffset' }, expected: { type: 'datetime', offset: true, local: false } },
    { format: 'date-time', dateType: 'date', expected: { type: 'date', representation: 'date' } },
    { format: 'date', dateType: 'string', expected: { type: 'date', representation: 'string' } },
    { format: 'time', dateType: 'date', expected: { type: 'time', representation: 'date' } },
  ] as const)('maps $format with dateType $dateType', ({ format, dateType, expected }) => {
    expect(convertFormat(context({ type: 'string', format }, { dateType }))).toMatchObject(expected)
  })

  it('keeps the numeric type of a string-only format', () => {
    expect(convertFormat(context({ type: 'integer', format: 'duration', maximum: 60 }))).toMatchObject({ type: 'integer', format: 'duration', max: 60 })
  })

  it('carries length bounds on a uuid', () => {
    expect(convertFormat(context({ type: 'string', format: 'uuid', minLength: 36, maxLength: 36 }))).toMatchObject({ type: 'uuid', min: 36, max: 36 })
  })
})

describe('convertEnum', () => {
  it('drops null and out-of-bounds values and marks the enum nullable', () => {
    expect(convertEnum(context({ type: 'integer', enum: [0, 1, 5, null], minimum: 1, maximum: 4 }))).toMatchObject({
      type: 'enum',
      nullable: true,
      namedEnumValues: [{ name: '1', value: 1, primitive: 'number' }],
    })
  })

  it('ignores bounds that exclude every value', () => {
    const node = convertEnum(context({ type: 'integer', enum: [1, 2], minimum: 10 }))
    expect(ast.schema.narrow(node, 'enum')?.namedEnumValues?.map((entry) => entry.value)).toStrictEqual([1, 2])
  })

  it('keeps float multiples within tolerance', () => {
    const node = convertEnum(context({ type: 'number', enum: [0.3, 0.35], multipleOf: 0.1 }))
    expect(ast.schema.narrow(node, 'enum')?.namedEnumValues?.map((entry) => entry.value)).toStrictEqual([0.3])
  })

  it('converts a NullEnum to null', () => {
    expect(convertEnum(context({ enum: [null] } as SchemaObject))).toMatchObject({ type: 'null' })
  })

  it('keeps x-enumNames and descriptions aligned after a value is dropped', () => {
    const schema = {
      type: 'integer',
      enum: [null, 1, 2],
      'x-enumNames': ['None', 'One', 'Two'],
      'x-enumDescriptions': ['-', 'first', 'second'],
    } as SchemaObject
    expect(ast.schema.narrow(convertEnum(context(schema)), 'enum')?.namedEnumValues).toStrictEqual([
      { name: 'One', value: 1, primitive: 'number', description: 'first' },
      { name: 'Two', value: 2, primitive: 'number', description: 'second' },
    ])
  })

  it('moves an array enum into its items', () => {
    const node = convertEnum(context({ type: 'array', items: { type: 'string' }, enum: ['a', 'b'] } as SchemaObject))
    expect(ast.schema.narrow(ast.schema.narrow(node, 'array')?.items?.[0], 'enum')?.enumValues).toStrictEqual(['a', 'b'])
  })
})

describe('convertFormattedEnum', () => {
  it('builds a nullable union of unique literals', () => {
    const node = convertFormattedEnum(context({ type: 'string', format: 'uuid', enum: ['a', 'a', 'b', null] } as SchemaObject))
    expect(node).toMatchObject({ type: 'union', nullable: true, format: 'uuid' })
    expect(ast.schema.narrow(node, 'union')?.members?.map((member) => ast.schema.narrow(member, 'enum')?.enumValues)).toStrictEqual([['a'], ['b']])
  })
})

describe('convertString', () => {
  it('reads contentMediaType, contentEncoding and contentSchema', () => {
    const node = convertString(context({ type: 'string', contentMediaType: 'application/json', contentEncoding: 'base64', contentSchema: { type: 'integer' } }))
    expect(node).toMatchObject({ type: 'string', content: { mediaType: 'application/json', encoding: 'base64', schema: { type: 'integer' } } })
  })
})

describe('convertNumeric', () => {
  it('reads only the numeric form of the exclusive bounds', () => {
    const node = convertNumeric(context({ type: 'number', exclusiveMinimum: 0, exclusiveMaximum: true } as unknown as SchemaObject), 'number')
    expect(node).toMatchObject({ type: 'number', exclusive: { min: 0 }, exclusiveMinimum: 0, exclusiveMaximum: undefined })
  })
})
