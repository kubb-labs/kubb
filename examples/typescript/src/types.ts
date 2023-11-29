import type { Infer, Model, RequestParams, Response } from '@kubb/swagger-ts/oas'

import type { models } from './gen/index.ts'

export type UserModel = Model<models.Oas, 'User'>

const oas = {
  openapi: '3.0.1',
  info: {
    title: 'Swagger Petstore',
    description: 'A sample API that uses a petstore as an example to demonstrate features in the swagger-2.0 specification',
    termsOfService: 'http://swagger.io/terms/',
    contact: {
      name: 'Swagger API Team',
    },
    license: {
      name: 'MIT',
    },
    version: '1.0.0',
  },
  servers: [
    {
      url: 'http://petstore.swagger.io/api',
    },
  ],
  paths: {
    '/pets': {
      get: {
        description: 'Returns all pets from the system that the user has access to',
        operationId: 'findPets',
        parameters: [
          {
            name: 'tags',
            in: 'query',
            description: 'tags to filter by',
            style: 'form',
            explode: false,
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'maximum number of results to return',
            schema: {
              type: 'integer',
              format: 'int32',
            },
          },
        ],
        responses: {
          '200': {
            description: 'pet response',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Pet',
                  },
                },
              },
            },
          },
          default: {
            description: 'unexpected error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorModel',
                },
              },
            },
          },
        },
      },
      post: {
        description: 'Creates a new pet in the store.  Duplicates are allowed',
        operationId: 'addPet',
        requestBody: {
          description: 'Pet to add to the store',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NewPet',
              },
            },
          },
          required: true,
        },
        responses: {
          '200': {
            description: 'pet response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Pet',
                },
              },
            },
          },
          default: {
            description: 'unexpected error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorModel',
                },
              },
            },
          },
        },
        'x-codegen-request-body-name': 'pet',
      },
    },
  },
  components: {
    schemas: {
      Pet: {
        allOf: [
          {
            $ref: '#/components/schemas/NewPet',
          },
          {
            required: ['id'],
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                format: 'int64',
              },
            },
          },
        ],
      },
      NewPet: {
        required: ['name'],
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          tag: {
            type: 'string',
          },
        },
      },
      ErrorModel: {
        required: ['code', 'message'],
        type: 'object',
        properties: {
          code: {
            type: 'integer',
            format: 'int32',
          },
          message: {
            type: 'string',
          },
        },
      },
    },
  },
} as const

type Oas = Infer<typeof oas>

export type Pet = Model<Oas, 'Pet'>
//           ^?

export type AddPet = RequestParams<Oas, '/pets', 'post'>
//           ^?

export type AddPetResponse = Response<Oas, '/pets', 'post'>
//           ^?
