import { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PARSER_OPTIONS } from '../../constants.ts'
import { isNullable } from '../../oas.ts'
import { createSchemaParser } from '../../parser.ts'
import { createRefs } from '../../refs.ts'
import type { Document, SchemaObject } from '../../types.ts'
import type { ConvertContext } from '../parseSchema.ts'
import { convertArray, convertObject, convertTuple } from './structural.ts'

const document = {
  openapi: '3.1.0',
  info: { title: 'Structures', version: '1' },
  paths: {},
  components: { schemas: { Cat: { type: 'object' }, Dog: { type: 'object' } } },
} as Document
const refs = createRefs(document)

function context(schema: SchemaObject, name: string | null = 'Pet', options: Partial<ast.ParserOptions> = {}): ConvertContext {
  return {
    schema,
    name,
    nullable: isNullable(schema) || undefined,
    defaultValue: schema.default,
    type: Array.isArray(schema.type) ? schema.type.find((t) => t !== 'null') : schema.type,
    options: { ...DEFAULT_PARSER_OPTIONS, ...options },
    parse: createSchemaParser({ document, refs, options }),
    document,
    refs,
  }
}

describe('convertObject', () => {
  it('marks required and nullable properties and names inline enums after the parent', () => {
    const node = convertObject(
      context({
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer' }, status: { type: ['string', 'null'], enum: ['on', 'off'] } },
      } as SchemaObject),
    )

    expect(ast.schema.narrow(node, 'object')?.properties).toMatchObject([
      { name: 'id', required: true, schema: { type: 'integer' } },
      { name: 'status', required: false, schema: { type: 'enum', name: 'PetStatusEnum', nullable: true } },
    ])
  })

  it.each([
    { additionalProperties: true, expected: true },
    { additionalProperties: false, expected: false },
    { additionalProperties: {}, expected: { type: 'unknown' } },
    { additionalProperties: { type: 'string' }, expected: { type: 'string' } },
  ])('maps additionalProperties $additionalProperties', ({ additionalProperties, expected }) => {
    const node = convertObject(context({ type: 'object', additionalProperties } as SchemaObject, 'Pet', { unknownType: 'unknown' }))
    expect(ast.schema.narrow(node, 'object')?.additionalProperties).toEqual(typeof expected === 'object' ? expect.objectContaining(expected) : expected)
  })

  it('maps patternProperties and propertyNames, with false as never', () => {
    const node = convertObject(
      context({ type: 'object', patternProperties: { '^x-': false, '^y-': true }, propertyNames: { pattern: '^[a-z]+$' } } as SchemaObject, 'Pet', {
        unknownType: 'any',
      }),
    )

    expect(node).toMatchObject({
      patternProperties: { '^x-': { type: 'never' }, '^y-': { type: 'any' } },
      propertyNames: { type: 'string', pattern: '^[a-z]+$' },
    })
  })

  it('pins the discriminator property to the typed mapping keys', () => {
    const node = convertObject(
      context({
        type: 'object',
        properties: { code: { type: 'integer' } },
        discriminator: { propertyName: 'code', mapping: { '1': '#/components/schemas/Cat', '2': '#/components/schemas/Dog' } },
      } as SchemaObject),
    )

    expect(ast.schema.narrow(node, 'object')?.properties?.[0]?.schema).toMatchObject({ type: 'enum', name: 'PetCodeEnum', enumValues: [1, 2] })
  })
})

describe('convertTuple', () => {
  it.each([
    { items: false, rest: undefined },
    { items: undefined, rest: { type: 'unknown' } },
    { items: { type: 'string' }, rest: { type: 'string' } },
  ])('sets the rest for items $items', ({ items, rest }) => {
    const node = convertTuple(context({ prefixItems: [{ type: 'integer' }], ...(items !== undefined && { items }) } as SchemaObject))
    const tuple = ast.schema.narrow(node, 'tuple')!

    expect(tuple.items).toMatchObject([{ type: 'integer' }])
    if (rest) expect(tuple.rest).toMatchObject(rest)
    else expect(tuple.rest).toBeUndefined()
  })
})

describe('convertArray', () => {
  it('names an enum item, and reads uniqueItems and contains bounds', () => {
    const node = convertArray(
      context(
        { type: 'array', items: { type: 'string', enum: ['a'] }, uniqueItems: true, contains: { type: 'string' }, minContains: 1 } as SchemaObject,
        'Tags',
      ),
    )

    expect(node).toMatchObject({
      type: 'array',
      unique: true,
      items: [{ type: 'enum', name: 'TagsEnum' }],
      contains: { schema: { type: 'string' }, min: 1 },
    })
    expect(ast.schema.narrow(node, 'array')?.contains?.max).toBeUndefined()
  })
})
