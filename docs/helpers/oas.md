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

Start by creating a TypeScript file that exports your OpenAPI document. Due to limitations in TypeScript, importing types directly from JSON files isn't currently supported. To work around this, simply copy and paste the relevant parts of your Swagger/OpenAPI file into a TypeScript module and export it with the `as const` modifier.

```typescript
// oas.ts
export const oas = {
  openapi: '3.0.1',
  paths: {
    '/pets': {
      get: {
        operationId: 'findPets',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Pet' },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: 'addPet',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NewPet' },
            },
          },
        },
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Pet' },
              },
            },
          },
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
          id: { type: 'integer' },
          name: { type: 'string' },
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
    },
  },
} as const
```

For the examples below, keep this file minimal—unrelated operations can be omitted to reduce editor noise and bundle size.

### Inferring OAS Schema Types

#### Model

Use the Model type to infer models from an OpenAPI document.

```typescript
import type { Infer, Model, RequestParams, Response } from '@kubb/oas'
import { oas } from './oas'

type Oas = Infer<typeof oas>
type Pet = Model<Oas, 'Pet'>
type AddPetParams = RequestParams<Oas, '/pets', 'post'>
type ListPetsParams = RequestParams<Oas, '/pets', 'get'>
type AddPetResponse = Response<Oas, '/pets', 'post'>
```

#### RequestParams

Use `RequestParams` to infer the request body or query parameters, as shown by `AddPetParams` and `ListPetsParams` above.

#### Response

`Response` extracts the typed response payload from a specific status code—in this case `AddPetResponse` resolves to the success payload of the `POST /pets` operation.
