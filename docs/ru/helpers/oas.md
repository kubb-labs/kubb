---
layout: doc

title: \@kubb/oas
outline: deep
---

# @kubb/oas

## Установка

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

С помощью типа `Infer` вы можете выводить типы из вашей [Swagger/OpenAPI](/ru/knowledge-base/oas) схемы без необходимости создания типов.
Это дает вам возможности TypeScript с автодополнением для конкретных путей, методов и схем.

> [!TIP]
> Это также можно использовать как автономное решение без генерации через CLI.


### Подготовка

Начните с создания TypeScript файла, который экспортирует ваш OpenAPI документ. Из-за ограничений TypeScript прямой импорт типов из JSON файлов в настоящее время не поддерживается. Чтобы обойти это, просто скопируйте и вставьте содержимое вашего Swagger/OpenAPI файла в TypeScript файл, а затем экспортируйте его с модификатором `as const`.

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

### Вывод типов OAS схемы

#### Model

Для вывода моделей из OpenAPI документа используйте тип Model.

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

Для вывода параметров тела запроса из OpenAPI документа используйте тип RequestParams

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

Для вывода тела ответа из OpenAPI документа используйте тип Response

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
