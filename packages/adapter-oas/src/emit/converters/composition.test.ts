import { ast } from '@kubb/kit'
import { describe, expect, it, test } from 'vitest'
import { adapterOas } from '../../adapter.ts'
import { createSchemaParser, type SchemaParserOptions } from '../../schemaParser.ts'
import { createRefs } from '../../refs.ts'
import type { Document, SchemaObject } from '../../types.ts'

const emptyDocument = { openapi: '3.0.0', info: { title: '', version: '' }, paths: {} } as Document
const emptyCtx: SchemaParserOptions = { document: emptyDocument, refs: createRefs(emptyDocument) }

function parseSchema(ctx: SchemaParserOptions, { schema, name }: { schema: SchemaObject; name?: string }): ast.SchemaNode {
  return createSchemaParser(ctx).parse({ schema, name })
}

async function parseOas(data: unknown): Promise<ast.InputNode> {
  return adapterOas({ validate: false }).parse({ type: 'data', data })
}

function findSchema(root: ast.InputNode, name: string): ast.SchemaNode | undefined {
  return root.schemas.find((schema) => schema.name === name)
}

describe.each(['oneOf', 'anyOf'] as const)('%s parent required properties', (keyword) => {
  test.each(['any'] as const)('keeps undeclared required keys unconstrained with emptySchemaType=%s', async (emptySchemaType) => {
    const root = await adapterOas({ validate: false, emptySchemaType }).parse({
      type: 'data',
      data: {
        openapi: '3.1.0',
        info: { title: 'Required key', version: '1' },
        paths: {},
        components: {
          schemas: {
            Pet: {
              type: 'object',
              required: ['missing'],
              [keyword]: [
                { type: 'object', properties: { a: { type: 'string' } } },
                { type: 'object', properties: { b: { type: 'string' } } },
              ],
            },
          },
        },
      },
    })
    const members = ast.schema.narrow(root.schemas[0], ast.schema.types.intersection)!.members!
    expect(ast.schema.narrow(members.at(-1), ast.schema.types.object)!.properties).toMatchObject([
      { name: 'missing', required: true, schema: { type: ast.schema.types.unknown } },
    ])
  })

  test.each([
    { openapi: '3.0.0', references: true, siblings: true },
    { openapi: '3.1.0', references: true, siblings: true },
    { openapi: '3.0.0', references: true, siblings: false },
    { openapi: '3.1.0', references: true, siblings: false },
  ])('preserves required member keys in $openapi with references=$references and siblings=$siblings', async ({ openapi, references, siblings }) => {
    const a = { type: 'object', properties: { a: { type: 'string', nullable: true } } }
    const b = { type: 'object', properties: { b: { type: 'string' } } }
    const root = await adapterOas({ validate: false }).parse({
      type: 'data',
      data: {
        openapi,
        info: { title: 'Required member fields', version: '1' },
        paths: {},
        components: {
          schemas: {
            A: a,
            B: b,
            Pet: {
              type: 'object',
              description: 'Parent description',
              required: siblings ? ['a', 'shared'] : ['a'],
              ...(siblings ? { properties: { shared: { type: 'string' } } } : {}),
              [keyword]: references ? [{ $ref: '#/components/schemas/A' }, { $ref: '#/components/schemas/B' }] : [a, b],
            },
          },
        },
      },
    })
    const pet = root.schemas.find((node) => node.name === 'Pet')!
    expect(pet).toMatchObject({ type: ast.schema.types.intersection, description: 'Parent description' })
    const members = ast.schema.narrow(pet, ast.schema.types.intersection)!.members!
    const union = ast.schema.narrow(members[0], ast.schema.types.union)!
    expect(union.strategy).toBe(keyword === 'oneOf' ? 'one' : 'any')
    expect(union.members).toHaveLength(2)
    const required = ast.schema.narrow(members.at(-1), ast.schema.types.object)!
    expect(required.properties).toMatchObject([{ name: 'a', required: true, schema: { type: ast.schema.types.unknown } }])
    expect(required.properties[0]!.schema.optional).toBeUndefined()
    expect(required.properties[0]!.schema.nullish).toBeUndefined()
    expect(
      ast.schema.narrow(
        root.schemas.find((node) => node.name === 'A')!,
        ast.schema.types.object,
      )!.properties[0]!,
    ).toMatchObject({ required: false, schema: { type: ast.schema.types.string, nullable: true } })
    if (siblings) {
      expect(ast.schema.narrow(members[1], ast.schema.types.object)!.properties).toMatchObject([{ name: 'shared', required: true }])
    }
  })

  test('keeps declared property types inside their own variants', async () => {
    const root = await adapterOas({ validate: false }).parse({
      type: 'data',
      data: {
        openapi: '3.1.0',
        info: { title: 'Required member types', version: '1' },
        paths: {},
        components: {
          schemas: {
            Pet: {
              type: 'object',
              required: ['value'],
              [keyword]: [
                { type: 'object', properties: { value: { type: 'string' } } },
                { type: 'object', properties: { value: { type: 'number' } } },
              ],
            },
          },
        },
      },
    })
    const members = ast.schema.narrow(root.schemas[0], ast.schema.types.intersection)!.members!
    const required = ast.schema.narrow(members.at(-1), ast.schema.types.object)!.properties[0]!
    expect(required.required).toBe(true)
    expect(required.schema.type).toBe(ast.schema.types.unknown)
    expect(ast.schema.narrow(members[0], ast.schema.types.union)!.members).toMatchObject([
      { type: ast.schema.types.object, properties: [{ name: 'value', schema: { type: ast.schema.types.string } }] },
      { type: ast.schema.types.object, properties: [{ name: 'value', schema: { type: ast.schema.types.number } }] },
    ])
  })
})

describe('sibling type on oneOf / anyOf members', () => {
  it('keeps a sibling binary type on members that only add a media type', () => {
    const node = parseSchema(emptyCtx, {
      schema: { type: 'string', format: 'binary', anyOf: [{ contentMediaType: 'image/png' }, { contentMediaType: 'image/jpeg' }] },
    })

    expect(ast.schema.narrow(node, 'union')?.members).toMatchObject([
      { type: 'blob', content: { mediaType: 'image/png' } },
      { type: 'blob', content: { mediaType: 'image/jpeg' } },
    ])
  })

  it.each(['oneOf', 'anyOf'] as const)('keeps a sibling integer type on %s members that only add bounds', (keyword) => {
    const node = parseSchema(emptyCtx, { schema: { type: 'integer', [keyword]: [{ minimum: 10 }, { maximum: 0 }] } })

    expect(ast.schema.narrow(node, 'union')?.members).toMatchObject([
      { type: 'integer', min: 10 },
      { type: 'integer', max: 0 },
    ])
  })

  it('keeps the own type of a member and skips multi-type parents', () => {
    const own = parseSchema(emptyCtx, { schema: { type: 'string', anyOf: [{ type: 'number' }, { format: 'uuid' }] } })
    const multi = parseSchema(emptyCtx, { schema: { type: ['string', 'number'], anyOf: [{ minimum: 1 }, { minLength: 1 }] } })

    expect(ast.schema.narrow(own, 'union')?.members?.map((member) => member.type)).toStrictEqual(['number', 'uuid'])
    expect(ast.schema.narrow(multi, 'union')?.members?.map((member) => member.type)).toStrictEqual(['number', 'string'])
  })
})

describe('parseSchema enum next to a nullable type or a union', () => {
  const Color = { type: 'string', enum: ['red', 'green', 'blue'] }
  const documents = {
    '3.1.0': {
      status: { type: ['string', 'null'], enum: ['draft', 'published'] },
      color: { oneOf: [{ $ref: '#/components/schemas/Color' }, { type: 'null' }], enum: ['red', 'green'] },
    },
    '3.0.3': {
      status: { type: 'string', nullable: true, enum: ['draft', 'published'] },
      color: { allOf: [{ $ref: '#/components/schemas/Color' }], nullable: true, enum: ['red', 'green'] },
    },
  }

  it.each([
    { openapi: '3.1.0', nullable: undefined },
    { openapi: '3.0.3', nullable: true },
  ] as const)('applies the sibling enum in OpenAPI $openapi', async ({ openapi, nullable }) => {
    const root = await parseOas({
      openapi,
      info: { title: 'Enums', version: '1' },
      paths: {},
      components: { schemas: { Color, Example: { type: 'object', properties: documents[openapi] } } },
    })
    const [status, color] = ast.schema.narrow(findSchema(root, 'Example'), 'object')!.properties!

    expect(status!.schema).toMatchObject({ type: 'enum', enumValues: ['draft', 'published'], nullable })
    expect(color!.schema).toMatchObject({
      type: 'intersection',
      members: [
        { type: 'union', members: [{ type: 'ref' }, { type: 'null' }] },
        { type: 'enum', enumValues: ['red', 'green'], nullable },
      ],
    })
  })

  it('keeps null out of the sibling enum of a non-nullable union in OpenAPI 3.0', async () => {
    const root = await parseOas({
      openapi: '3.0.3',
      info: { title: 'Enums', version: '1' },
      paths: {},
      components: { schemas: { Color, Example: { oneOf: [{ $ref: '#/components/schemas/Color' }], enum: ['red', 'green'] } } },
    })

    expect(findSchema(root, 'Example')).toMatchObject({
      type: 'intersection',
      members: [{ type: 'union' }, { type: 'enum', enumValues: ['red', 'green'], nullable: undefined }],
    })
  })

  it('keeps null in the sibling enum when a referenced union member is nullable in OpenAPI 3.0', async () => {
    const root = await parseOas({
      openapi: '3.0.3',
      info: { title: 'Enums', version: '1' },
      paths: {},
      components: {
        schemas: { Color: { ...Color, nullable: true }, Example: { oneOf: [{ $ref: '#/components/schemas/Color' }], enum: ['red', 'green'] } },
      },
    })

    expect(findSchema(root, 'Example')).toMatchObject({ members: [{ type: 'union' }, { type: 'enum', enumValues: ['red', 'green'], nullable: true }] })
  })

  it('applies the sibling enum to a union with required keys', () => {
    const node = parseSchema(emptyCtx, { schema: { oneOf: [{ type: 'object' }, { type: 'null' }], required: ['id'], enum: [{ id: 1 }] } as SchemaObject })

    expect(node).toMatchObject({ type: 'intersection', members: [{ type: 'intersection' }, { type: 'enum' }] })
  })

  it('drops null from a multi-type array whose enum leaves it out', () => {
    const node = parseSchema(emptyCtx, { schema: { type: ['string', 'number', 'null'], enum: ['a', 1] } as SchemaObject })

    expect(node).toMatchObject({ type: 'union', nullable: undefined })
    expect(ast.schema.narrow(node, ast.schema.types.union)!.members).not.toContainEqual(expect.objectContaining({ type: 'null' }))
  })
})
