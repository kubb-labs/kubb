import type { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PARSER_OPTIONS } from '../constants.ts'
import { createSchemaParser } from '../parser.ts'
import { createRefs } from '../refs.ts'
import type { Document, SchemaObject } from '../types.ts'
import { convertMultiType, convertRef } from './converters/composition.ts'
import { convertConst, convertEnum, convertFormat, convertFormattedEnum, convertString } from './converters/scalar.ts'
import { type ConvertContext, schemaRules } from './parseSchema.ts'

const document = { openapi: '3.1.0', info: { title: 'Rules', version: '1' }, paths: {} } as Document
const refs = createRefs(document)

/** The converter of the first rule that matches `schema`, the one the parser runs. */
function ruleFor(schema: SchemaObject, options: Partial<ast.ParserOptions> = {}): (typeof schemaRules)[number]['convert'] {
  const context: ConvertContext = {
    schema,
    name: 'Value',
    nullable: undefined,
    defaultValue: undefined,
    type: Array.isArray(schema.type) ? schema.type.find((t) => t !== 'null') : schema.type,
    options: { ...DEFAULT_PARSER_OPTIONS, ...options },
    parse: createSchemaParser({ document, refs, options }),
    document,
    refs,
  }
  return schemaRules.find((rule) => rule.match(context))!.convert
}

describe('schemaRules', () => {
  it('lets a const win over a $ref sibling, and a $ref win otherwise', () => {
    expect(ruleFor({ $ref: '#/components/schemas/Pet', const: 'cat' } as SchemaObject)).toBe(convertConst)
    expect(ruleFor({ $ref: '#/components/schemas/Pet', description: 'x' } as SchemaObject)).toBe(convertRef)
  })

  it('splits a multi-type array before applying its format', () => {
    expect(ruleFor({ type: ['null', 'integer', 'string'], format: 'int32' } as SchemaObject)).toBe(convertMultiType)
    expect(ruleFor({ type: ['integer', 'null'], format: 'int32' } as SchemaObject)).toBe(convertFormat)
  })

  it.each<{ title: string; schema: SchemaObject; options: Partial<ast.ParserOptions>; expected: unknown }>([
    { title: 'a plain-printing format', schema: { type: 'string', format: 'uuid', enum: ['a'] }, options: {}, expected: convertFormattedEnum },
    { title: 'a Date format', schema: { type: 'string', format: 'date', enum: ['2024-01-01'] }, options: { dateType: 'date' }, expected: convertFormat },
    { title: 'a bigint format', schema: { type: 'integer', format: 'int64', enum: [1] }, options: { integerType: 'bigint' }, expected: convertFormat },
    { title: 'dateType false', schema: { type: 'string', format: 'date', enum: ['2024-01-01'] }, options: { dateType: false }, expected: convertEnum },
    { title: 'an unhandled format', schema: { type: 'string', format: 'color', enum: ['red'] }, options: {}, expected: convertEnum },
  ])('routes an enum with $title', ({ schema, options, expected }) => {
    expect(ruleFor(schema, options)).toBe(expected)
  })

  it('reads string keywords on an untyped schema, before its enum', () => {
    expect(ruleFor({ pattern: '^a' })).toBe(convertString)
    expect(ruleFor({ contentMediaType: 'image/png' })).toBe(convertString)
    expect(ruleFor({ minLength: 1, enum: ['a'] } as SchemaObject)).toBe(convertString)
  })

  it('leaves an empty schema to the fallback', () => {
    expect(schemaRules.some((rule) => rule.match({ schema: {}, type: undefined, options: DEFAULT_PARSER_OPTIONS } as unknown as ConvertContext))).toBe(false)
  })
})
