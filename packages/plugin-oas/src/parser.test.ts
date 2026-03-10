import { parse } from '@kubb/oas'
import { describe, expect, it } from 'vitest'
import { buildAst } from './parser.ts'

async function buildMinimalOas() {
  return parse({
    openapi: '3.0.3',
    info: { title: 'Test', version: '1.0.0' },
    paths: {
      '/pets': {
        get: {
          operationId: 'listPets',
          summary: 'List all pets',
          tags: ['pets'],
          parameters: [
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: { type: 'integer', minimum: 1, maximum: 100 },
            },
          ],
          responses: {
            '200': {
              description: 'A list of pets',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PetList' },
                },
              },
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        post: {
          operationId: 'createPet',
          tags: ['pets'],
          deprecated: true,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NewPet' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Pet created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Pet' },
                },
              },
            },
          },
        },
      },
      '/pets/{petId}': {
        get: {
          operationId: 'getPetById',
          tags: ['pets'],
          parameters: [
            {
              name: 'petId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': {
              description: 'A single pet',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Pet' },
                },
              },
            },
            '404': { description: 'Not found' },
          },
        },
      },
    },
    components: {
      schemas: {
        Pet: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'integer', readOnly: true },
            name: { type: 'string' },
            tag: { type: 'string', nullable: true },
          },
        },
        NewPet: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            tag: { type: 'string' },
          },
        },
        PetList: {
          type: 'array',
          items: { $ref: '#/components/schemas/Pet' },
        },
        Error: {
          type: 'object',
          required: ['code', 'message'],
          properties: {
            code: { type: 'integer' },
            message: { type: 'string' },
          },
        },
        Status: {
          type: 'string',
          enum: ['active', 'inactive', 'pending'],
        },
        PetOrError: {
          oneOf: [{ $ref: '#/components/schemas/Pet' }, { $ref: '#/components/schemas/Error' }],
        },
        FullPet: {
          allOf: [
            { $ref: '#/components/schemas/Pet' },
            {
              type: 'object',
              properties: {
                createdAt: { type: 'string', format: 'date-time' },
                email: { type: 'string', format: 'email' },
              },
            },
          ],
        },
        NullableString: {
          example: 'some-value',
          readOnly: true,
          allOf: [{ type: 'string', nullable: true }],
        },
        NullableRef: {
          allOf: [{ $ref: '#/components/schemas/Pet', nullable: true }],
        },
      },
    },
  })
}

describe('buildAst', () => {
  it('returns a RootNode', async () => {
    const oas = await buildMinimalOas()
    const root = buildAst(oas)
    expect(root.kind).toBe('Root')
  })

  describe('schemas', () => {
    it('converts named component schemas', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const names = root.schemas.map((s) => s.name)
      expect(names).toContain('Pet')
      expect(names).toContain('NewPet')
      expect(names).toContain('Error')
    })

    it('converts object schema with properties', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const pet = root.schemas.find((s) => s.name === 'Pet')
      expect(pet?.type).toBe('object')
      expect(pet?.properties?.map((p) => p.name)).toEqual(expect.arrayContaining(['id', 'name', 'tag']))
    })

    it('marks required properties', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const pet = root.schemas.find((s) => s.name === 'Pet')
      const idProp = pet?.properties?.find((p) => p.name === 'id')
      const tagProp = pet?.properties?.find((p) => p.name === 'tag')
      expect(idProp?.required).toBe(true)
      expect(tagProp?.required).toBe(false)
    })

    it('converts array schema', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const list = root.schemas.find((s) => s.name === 'PetList')
      expect(list?.type).toBe('array')
      expect(list?.items).toHaveLength(1)
      expect(list?.items?.[0]?.type).toBe('ref')
    })

    it('converts enum schema', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const status = root.schemas.find((s) => s.name === 'Status')
      expect(status?.type).toBe('enum')
      expect(status?.enumValues).toEqual(['active', 'inactive', 'pending'])
    })

    it('converts oneOf to union', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const petOrError = root.schemas.find((s) => s.name === 'PetOrError')
      expect(petOrError?.type).toBe('union')
      expect(petOrError?.members).toHaveLength(2)
    })

    it('converts allOf to intersection', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const fullPet = root.schemas.find((s) => s.name === 'FullPet')
      expect(fullPet?.type).toBe('intersection')
      expect(fullPet?.members).toHaveLength(2)
    })

    it('flattens single-member allOf and propagates nullable', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const nullableString = root.schemas.find((s) => s.name === 'NullableString')
      // Should be flattened to 'string' — not an intersection
      expect(nullableString?.type).toBe('string')
      expect(nullableString?.nullable).toBe(true)
      expect(nullableString?.readOnly).toBe(true)
      expect(nullableString?.example).toBe('some-value')
    })

    it('flattens single-member allOf for nullable $ref', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const nullableRef = root.schemas.find((s) => s.name === 'NullableRef')
      // Should be flattened to a ref — not an intersection
      expect(nullableRef?.type).toBe('ref')
      expect(nullableRef?.ref).toBe('Pet')
      expect(nullableRef?.nullable).toBe(true)
    })

    it('maps format date-time to datetime SchemaType', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const fullPet = root.schemas.find((s) => s.name === 'FullPet')
      // second member is an inline object with createdAt (datetime) and email
      const objectMember = fullPet?.members?.find((m) => m.type === 'object')
      const createdAt = objectMember?.properties?.find((p) => p.name === 'createdAt')
      expect(createdAt?.schema.type).toBe('datetime')
    })

    it('maps format email to email SchemaType', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const fullPet = root.schemas.find((s) => s.name === 'FullPet')
      const objectMember = fullPet?.members?.find((m) => m.type === 'object')
      const email = objectMember?.properties?.find((p) => p.name === 'email')
      expect(email?.schema.type).toBe('email')
    })
  })

  describe('operations', () => {
    it('converts all operations', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      expect(root.operations).toHaveLength(3)
    })

    it('sets operationId, method, path, tags', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const listPets = root.operations.find((op) => op.operationId === 'listPets')
      expect(listPets?.method).toBe('GET')
      expect(listPets?.path).toBe('/pets')
      expect(listPets?.tags).toContain('pets')
      expect(listPets?.summary).toBe('List all pets')
    })

    it('sets deprecated flag', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const createPet = root.operations.find((op) => op.operationId === 'createPet')
      expect(createPet?.deprecated).toBe(true)
    })

    it('uses uppercase HTTP method per RFC 9110', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      for (const op of root.operations) {
        expect(op.method).toBe(op.method.toUpperCase())
      }
    })

    it('converts query parameters', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const listPets = root.operations.find((op) => op.operationId === 'listPets')
      const limit = listPets?.parameters.find((p) => p.name === 'limit')
      expect(limit?.in).toBe('query')
      expect(limit?.required).toBe(false)
      expect(limit?.schema.type).toBe('integer')
    })

    it('converts path parameters', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const getPet = root.operations.find((op) => op.operationId === 'getPetById')
      const petId = getPet?.parameters.find((p) => p.name === 'petId')
      expect(petId?.in).toBe('path')
      expect(petId?.required).toBe(true)
      expect(petId?.schema.type).toBe('integer')
    })

    it('converts requestBody', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const createPet = root.operations.find((op) => op.operationId === 'createPet')
      expect(createPet?.requestBody).toBeDefined()
      expect(createPet?.requestBody?.type).toBe('ref')
    })

    it('converts responses with statusCode and schema', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const listPets = root.operations.find((op) => op.operationId === 'listPets')
      const ok = listPets?.responses.find((r) => r.statusCode === '200')
      expect(ok?.description).toBe('A list of pets')
      expect(ok?.schema?.type).toBe('ref')
    })

    it('converts responses without a body schema', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const getPet = root.operations.find((op) => op.operationId === 'getPetById')
      const notFound = getPet?.responses.find((r) => r.statusCode === '404')
      expect(notFound?.description).toBe('Not found')
      expect(notFound?.schema).toBeUndefined()
    })

    it('sets mediaType on responses', async () => {
      const oas = await buildMinimalOas()
      const root = buildAst(oas)
      const listPets = root.operations.find((op) => op.operationId === 'listPets')
      const ok = listPets?.responses.find((r) => r.statusCode === '200')
      expect(ok?.mediaType).toBe('application/json')
    })
  })
})

describe('buildAst snapshots', async () => {
  const oas = await buildMinimalOas()
  const root = buildAst(oas)

  it('full RootNode', () => {
    expect(root).toMatchSnapshot()
  })

  it.each([{ operationId: 'listPets' }, { operationId: 'createPet' }, { operationId: 'getPetById' }])('operation $operationId', ({ operationId }) => {
    const op = root.operations.find((o) => o.operationId === operationId)
    expect(op).toMatchSnapshot()
  })

  it.each([
    { name: 'Pet', label: 'object with required props' },
    { name: 'PetList', label: 'array of refs' },
    { name: 'Status', label: 'enum' },
    { name: 'PetOrError', label: 'oneOf / union' },
    { name: 'FullPet', label: 'allOf / intersection with format fields' },
  ])('schema $name ($label)', ({ name }) => {
    const schema = root.schemas.find((s) => s.name === name)
    expect(schema).toMatchSnapshot()
  })
})
