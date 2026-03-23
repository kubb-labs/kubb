import { parse } from '../src/oas/utils.ts'

export async function buildMinimalOas() {
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
            description: 'New pet to create',
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
