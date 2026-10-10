import { type Diagnostic, Diagnostics } from '@kubb/kit'
import type { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { adapterOas } from './adapter.ts'
import type { Document, SchemaObject } from './types.ts'

const petSchema: SchemaObject = { type: 'object', properties: { name: { type: 'string' } } }
const petNode = { type: 'object', properties: [{ name: 'name', schema: { type: 'string' } }] }

function buildDocument(schemas: Record<string, SchemaObject>, paths: Document['paths'] = {}): Document {
  return {
    openapi: '3.0.3',
    info: { title: '', version: '' },
    paths,
    components: { schemas: { Pet: petSchema, ...schemas } },
  } as Document
}

async function parseSchemas(schemas: Record<string, SchemaObject>): Promise<Record<string, ast.SchemaNode>> {
  const input = await adapterOas({ validate: false }).parse({ type: 'data', data: buildDocument(schemas) })
  return Object.fromEntries(input.schemas.map((schema) => [schema.name, schema]))
}

describe('refs.resolve', () => {
  it('resolves a local $ref to its schema', async () => {
    const { Order } = await parseSchemas({ Order: { $ref: '#/components/schemas/Pet' } })

    expect(Order).toMatchObject({ name: 'Order', ...petNode })
  })

  it.each([
    { title: 'an empty ref', $ref: '', expected: { type: 'ref', ref: '', schema: null } },
    { title: 'a non-local (external) ref', $ref: 'https://example.com/schemas/Pet', expected: { type: 'unknown' } },
  ])('does not resolve $title', async ({ $ref, expected }) => {
    const { Order } = await parseSchemas({ Order: { type: 'object', properties: { pet: { $ref } } } })

    expect(Order).toMatchObject({ type: 'object', properties: [{ name: 'pet', schema: expected }] })
  })

  it('reports a refNotFound diagnostic and falls back to unknown when the pointer cannot be resolved', async () => {
    const reported: Array<Diagnostic> = []
    const { Order } = await Diagnostics.scope(
      (diagnostic) => reported.push(diagnostic),
      () => parseSchemas({ Order: { type: 'object', properties: { pet: { $ref: '#/components/schemas/Missing' } } } }),
    )

    expect(Order).toMatchObject({ type: 'object', properties: [{ name: 'pet', schema: { type: 'unknown' } }] })
    expect(reported).toContainEqual(
      expect.objectContaining({
        code: 'KUBB_REF_NOT_FOUND',
        severity: 'error',
        message: 'Could not find a definition for #/components/schemas/Missing.',
        location: { kind: 'schema', pointer: '#/components/schemas/Missing', ref: '#/components/schemas/Missing' },
      }),
    )
  })

  it('handles URL-encoded pointers', async () => {
    const { Order } = await parseSchemas({
      'Pet List': { type: 'array', items: { type: 'string' } },
      Order: { type: 'object', properties: { pets: { $ref: '#/components/schemas/Pet%20List' } } },
    })

    expect(Order).toMatchObject({
      properties: [{ name: 'pets', schema: { type: 'ref', name: 'Pet%20List', schema: { type: 'array', items: [{ type: 'string' }] } } }],
    })
  })

  it('unescapes ~1 and ~0 tokens and keeps an encoded slash inside its token', async () => {
    const document = buildDocument(
      {
        'a~b': { type: 'string' },
        'a/b': { type: 'number' },
        Order: {
          type: 'object',
          properties: { tilde: { $ref: '#/components/schemas/a~0b' }, slash: { $ref: '#/components/schemas/a%2Fb' } },
        },
      },
      { '/pets': { get: { operationId: 'listPets', responses: { '200': { description: 'OK' } } } }, '/alias': { $ref: '#/paths/~1pets' } },
    )
    const input = await adapterOas({ validate: false }).parse({ type: 'data', data: document })
    const Order = input.schemas.find((schema) => schema.name === 'Order')

    expect(Order).toMatchObject({
      properties: [
        { name: 'tilde', schema: { type: 'ref', schema: { type: 'string' } } },
        { name: 'slash', schema: { type: 'ref', schema: { type: 'number' } } },
      ],
    })
    expect(input.operations.map((operation) => operation.path)).toStrictEqual(['/pets', '/alias'])
  })

  it('throws when the pointer cannot be resolved outside a build scope', async () => {
    const document = buildDocument({}, { '/pets': { get: { responses: { '200': { $ref: '#/components/responses/Missing' } } } } })

    await expect(adapterOas({ validate: false }).parse({ type: 'data', data: document })).rejects.toThrow(
      'Could not find a definition for #/components/responses/Missing.',
    )
  })
})

describe('refs.derefKeepingRef', () => {
  it.each([
    { $ref: '#/components/schemas/Pet', expected: { name: 'Pet', schema: petNode } },
    {
      $ref: '#/components/schemas/Order',
      expected: { name: 'Order', schema: { type: 'object', properties: [{ name: 'pet', schema: { type: 'ref', name: 'Pet' } }] } },
    },
  ])('resolves a $$ref body and keeps the ref identity on the node', async ({ $ref, expected }) => {
    const document = buildDocument(
      { Order: { type: 'object', properties: { pet: { $ref: '#/components/schemas/Pet' } } } },
      { '/pets': { post: { requestBody: { content: { 'application/json': { schema: { $ref } } } }, responses: {} } } },
    )
    const input = await adapterOas({ validate: false }).parse({ type: 'data', data: document })

    expect(input.operations[0]?.requestBody?.content?.[0]?.schema).toMatchObject({ type: 'ref', ref: $ref, ...expected })
  })

  it('leaves a plain schema inline', async () => {
    const document = buildDocument(
      {},
      { '/pets': { post: { requestBody: { content: { 'application/json': { schema: { type: 'string' } } } }, responses: {} } } },
    )
    const input = await adapterOas({ validate: false }).parse({ type: 'data', data: document })

    expect(input.operations[0]?.requestBody?.content?.[0]?.schema).toMatchObject({ type: 'string' })
  })
})
