---
layout: doc

title: \@kubb/swagger-ts
outline: deep
---

# Infer

With the type `Infer` you can infer your Swagger/OpenAPI schema without the need of creating the types. This gives you the TypeScript power with autocomplete of specific paths and methods related to that path. <br/>

::: warning
To use the `Infer` type you need OpenAPI v3 or higher. <br/>
When using the `@kubb/swagger-ts` with option `oasType` set to true it will already convert your Swagger v2 to v3 and create the `oas.ts` file with the type `Oas`(you can skip the prepare step).
:::

::: tip
This can also be used as a standalone solution without doing the generation.
:::

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/swagger-ts
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/swagger-ts
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/swagger-ts
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/swagger-ts
```

:::

## Prepare

Start by creating a TypeScript file that exports your OpenAPI document. Due to limitations in TypeScript, importing types directly from JSON files isn't currently supported. To work around this, simply copy and paste the content of your Swagger/OpenAPI file into the TypeScript file and then export it with the `as const` modifier.

::: code-group

```typescript [oas.ts]
export default { openapi: '3.0.0' /* ... */ } as const
```

```typescript [oas.ts]
const oas = {
  'openapi': '3.0.1',
  'info': {
    'title': 'Swagger Petstore',
    'description': 'A sample API that uses a petstore as an example to demonstrate features in the swagger-2.0 specification',
    'termsOfService': 'http://swagger.io/terms/',
    'contact': {
      'name': 'Swagger API Team',
    },
    'license': {
      'name': 'MIT',
    },
    'version': '1.0.0',
  },
  'servers': [
    {
      'url': 'http://petstore.swagger.io/api',
    },
  ],
  'paths': {
    '/pets': {
      'get': {
        'description': 'Returns all pets from the system that the user has access to',
        'operationId': 'findPets',
        'parameters': [
          {
            'name': 'tags',
            'in': 'query',
            'description': 'tags to filter by',
            'style': 'form',
            'explode': false,
            'schema': {
              'type': 'array',
              'items': {
                'type': 'string',
              },
            },
          },
          {
            'name': 'limit',
            'in': 'query',
            'description': 'maximum number of results to return',
            'schema': {
              'type': 'integer',
              'format': 'int32',
            },
          },
        ],
        'responses': {
          '200': {
            'description': 'pet response',
            'content': {
              'application/json': {
                'schema': {
                  'type': 'array',
                  'items': {
                    '$ref': '#/components/schemas/Pet',
                  },
                },
              },
            },
          },
          'default': {
            'description': 'unexpected error',
            'content': {
              'application/json': {
                'schema': {
                  '$ref': '#/components/schemas/ErrorModel',
                },
              },
            },
          },
        },
      },
      'post': {
        'description': 'Creates a new pet in the store.  Duplicates are allowed',
        'operationId': 'addPet',
        'requestBody': {
          'description': 'Pet to add to the store',
          'content': {
            'application/json': {
              'schema': {
                '$ref': '#/components/schemas/NewPet',
              },
            },
          },
          'required': true,
        },
        'responses': {
          '200': {
            'description': 'pet response',
            'content': {
              'application/json': {
                'schema': {
                  '$ref': '#/components/schemas/Pet',
                },
              },
            },
          },
          'default': {
            'description': 'unexpected error',
            'content': {
              'application/json': {
                'schema': {
                  '$ref': '#/components/schemas/ErrorModel',
                },
              },
            },
          },
        },
        'x-codegen-request-body-name': 'pet',
      },
    },
  },
  'components': {
    'schemas': {
      'Pet': {
        'allOf': [
          {
            '$ref': '#/components/schemas/NewPet',
          },
          {
            'required': [
              'id',
            ],
            'type': 'object',
            'properties': {
              'id': {
                'type': 'integer',
                'format': 'int64',
              },
            },
          },
        ],
      },
      'NewPet': {
        'required': [
          'name',
        ],
        'type': 'object',
        'properties': {
          'name': {
            'type': 'string',
          },
          'tag': {
            'type': 'string',
          },
        },
      },
      'ErrorModel': {
        'required': [
          'code',
          'message',
        ],
        'type': 'object',
        'properties': {
          'code': {
            'type': 'integer',
            'format': 'int32',
          },
          'message': {
            'type': 'string',
          },
        },
      },
    },
  },
} as const // [!code ++]
```

:::

## Inferring OAS Schema Types

### Model

To infer models from an OpenAPI document, use the Model type.

```typescript
import type { Infer, Model } from '@kubb/swagger-ts/oas'

import type { oas } from './oas.ts'

export type Oas = Infer<typeof oas>

export type Pet = Model<Oas, 'Pet'>
//           ^? { [x: string]: unknown; tag?: string | undefined; name: string; id: number; }
```

### RequestParams

To infer request body parameters from an OpenAPI document, utilize the RequestParams type

```typescript
import type { Infer, RequestParams } from '@kubb/swagger-ts/oas'

import type { oas } from './oas.ts'

export type Oas = Infer<typeof oas>

export type AddPet = RequestParams<Oas, '/pets', 'post'>
//           ^? { json: { tag?: string | undefined; name: string; }; }
```

### Response

To infer the response body of an OpenAPI document, utilize the Response type

```typescript
import type { Infer, Response } from '@kubb/swagger-ts/oas'

import type { oas } from './oas.ts'

export type Oas = Infer<typeof oas>

export type AddPetResponse = Response<Oas, '/pets', 'post'>
//           ^?{ [x: string]: unknown; tag?: string | undefined; name: string; id: number; }
```
