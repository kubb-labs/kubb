import { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { createSchemaParser } from '../../parser.ts'
import { createRefs } from '../../refs.ts'
import type { Document, SchemaObject } from '../../types.ts'

const document = {
  openapi: '3.1.0',
  info: { title: 'Structures', version: '1' },
  paths: {},
  components: { schemas: { Cat: { type: 'object' }, Dog: { type: 'object' } } },
} as Document
const refs = createRefs(document)

function parse(schema: SchemaObject, name: string | null = 'Pet', options: Partial<ast.ParserOptions> = {}): ast.SchemaNode {
  return createSchemaParser({ document, refs, options })({ schema, name })
}

describe('object', () => {
  it('marks required and nullable properties and names inline enums after the parent', () => {
    const node = parse({
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'integer' }, status: { type: ['string', 'null'], enum: ['on', 'off'] } },
    } as SchemaObject)

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
    const node = parse({ type: 'object', additionalProperties } as SchemaObject, 'Pet', { unknownType: 'unknown' })
    expect(ast.schema.narrow(node, 'object')?.additionalProperties).toEqual(typeof expected === 'object' ? expect.objectContaining(expected) : expected)
  })

  it('pins the discriminator property to the typed mapping keys', () => {
    const node = parse({
      type: 'object',
      properties: { code: { type: 'integer' } },
      discriminator: { propertyName: 'code', mapping: { '1': '#/components/schemas/Cat', '2': '#/components/schemas/Dog' } },
    } as SchemaObject)

    expect(ast.schema.narrow(node, 'object')?.properties?.[0]?.schema).toMatchObject({ type: 'enum', name: 'PetCodeEnum', enumValues: [1, 2] })
  })
})

describe('tuple', () => {
  it.each([
    { items: false, rest: undefined },
    { items: undefined, rest: { type: 'unknown' } },
    { items: { type: 'string' }, rest: { type: 'string' } },
  ])('sets the rest for items $items', ({ items, rest }) => {
    const node = parse({ prefixItems: [{ type: 'integer' }], ...(items !== undefined && { items }) } as SchemaObject)
    const tuple = ast.schema.narrow(node, 'tuple')!

    expect(tuple.items).toMatchObject([{ type: 'integer' }])
    if (rest) expect(tuple.rest).toMatchObject(rest)
    else expect(tuple.rest).toBeUndefined()
  })
})
