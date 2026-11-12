import { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { adapterOas } from '../../adapter.ts'

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
