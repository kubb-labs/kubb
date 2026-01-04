---
layout: doc

title: \@kubb/oas
outline: deep
---

# @kubb/oas

## Installation

::: code-group

```shell [bun]
bun add -d @kubb/oas
```

```shell [pnpm]
pnpm add -D @kubb/oas
```

```shell [npm]
npm install --save-dev @kubb/oas
```

```shell [yarn]
yarn add -D @kubb/oas
```

:::

## Infer <img src="/icons/experimental.svg"/> <Badge type="tip" text="beta" />

With the type `Infer` you can infer your [Swagger/OpenAPI](/knowledge-base/oas) schema without the need of creating the types.
This gives you TypeScript power with autocompletion of specific paths, methods and schemas.

> [!TIP]
> This can also be used as a standalone solution without the CLI generation.


### Prepare

Start by creating a TypeScript file that exports your OpenAPI document. Due to limitations in TypeScript, importing types directly from JSON files isn't currently supported. To work around this, simply copy and paste the content of your Swagger/OpenAPI file into the TypeScript file and then export it with the `as const` modifier.

::: code-group

```typescript [oas.ts]
export default { openapi: '3.0.0' /* ... */ } as const
```

```typescript [oas.ts]
const oas = {
  'openapi': '3.0.1',
  'info': {
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
        },
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
    },
  },
} as const // [!code ++]
```

:::

### Inferring OAS Schema Types

#### Model

To infer models from an OpenAPI document, use the Model type.

```typescript twoslash
import type { Infer, Model } from '@kubb/oas'

const oas = {
  'openapi': '3.0.1',
  'info': {
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
        },
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
    },
  },
} as const

export type Oas = Infer<typeof oas>

export type Pet = Model<Oas, 'Pet'>
//          ^?
```

#### RequestParams

To infer request body parameters from an OpenAPI document, utilize the RequestParams type

```typescript twoslash
import type { Infer, RequestParams } from '@kubb/oas'

const oas = {
  'openapi': '3.0.1',
  'info': {
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
        },
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
    },
  },
} as const

export type Oas = Infer<typeof oas>

export type AddPet = RequestParams<Oas, '/pets', 'post'>
export type GetPet = RequestParams<Oas, '/pets', 'get'>
//          ^?
```

#### Response

To infer the response body of an OpenAPI document, utilize the Response type

```typescript twoslash
import type { Infer, Response } from '@kubb/oas'

const oas = {
  'openapi': '3.0.1',
  'info': {
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
        },
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
    },
  },
} as const

export type Oas = Infer<typeof oas>

export type AddPetResponse = Response<Oas, '/pets', 'post'>
//            ^?
```
