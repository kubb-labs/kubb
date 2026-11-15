---
layout: doc
title: Generate TypeScript from OpenAPI in five steps
description: Follow five steps to generate TypeScript types and a typed Axios client from a one-operation Petstore API spec, then inspect the output and regenerate it.
outline:
  - 2
  - 3
order: 1
navigation:
  title: Generate your first client
  icon: i-iconoir-rocket
---

# Your first TypeScript client from an API spec

Kubb turns a one-operation Petstore spec into TypeScript types and an Axios client. Then you change the spec and run Kubb again. You need npm and a Node.js version from [Prerequisites](/docs/5.x/how-to/installation#prerequisites).

::steps{level="2"}

## Create a project {#_1-create-a-project}

```shell [Terminal]
mkdir kubb-first-client
cd kubb-first-client
npm init -y
npm pkg set type=module
npm install -D kubb typescript @kubb/plugin-ts @kubb/plugin-axios
npm install axios
```

The generated client calls `axios` at runtime, so it is a regular dependency.

## Add the spec {#_2-add-the-specification}

Create `petStore.yaml` in the project root:

```yaml [petStore.yaml]
openapi: 3.0.3
info:
  title: Petstore
  version: 1.0.0
servers:
  - url: https://petstore.swagger.io/v2
paths:
  /pet/{petId}:
    get:
      operationId: getPetById
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: A pet
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
components:
  schemas:
    Pet:
      type: object
      required: [id, name]
      properties:
        id:
          type: integer
        name:
          type: string
```

## Configure generation {#_3-configure-generation}

Create `kubb.config.ts` beside the spec:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginAxios } from '@kubb/plugin-axios'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen', clean: true },
  plugins: [
    pluginTs({ output: { path: 'models' } }),
    pluginAxios({ output: { path: 'clients' } }),
  ],
})
```

> [!WARNING]
> `clean: true` empties `src/gen` before each run. Keep your own files elsewhere.

## Generate the client {#_4-generate-the-client}

```shell [Terminal]
npx kubb generate
```

Kubb writes this tree. `getPetById` in `src/gen/clients/getPetById.ts` takes a typed path parameter and returns a typed result.

:::file-tree
---
tree:
  - name: src
    type: dir
    children:
      - name: gen
        type: dir
        children:
          - name: .kubb
            type: dir
          - name: clients
            type: dir
            children:
              - name: getPetById.ts
          - name: models
            type: dir
            children:
              - name: GetPetById.ts
              - name: Pet.ts
---
:::

`.kubb` holds shared client and serialization helpers.

## Change the spec {#_5-regenerate-after-a-change}

Add a `tag` property to `Pet` in `petStore.yaml`, next to `id` and `name`:

```yaml [petStore.yaml]
tag:
  type: string
```

Run `npx kubb generate` again. `Pet` in `src/gen/models/Pet.ts` now has an optional `tag` field, because `required` does not list it.

::

## Continue

::card-group

:::card{title="Call generated operations" icon="i-iconoir-code" to="/extensions/kubb-labs/plugin-axios/guides/calling-operations"}
Use the generated Axios client. [Set the base URL](/extensions/kubb-labs/plugin-axios/guides/configure-requests#set-the-base-url) for your API.
:::

:::card{title="Configure generation" icon="i-iconoir-settings" to="/docs/5.x/how-to/recipes"}
Add React or Vue hooks, validation, and mocks.
:::

:::card{title="Configuration reference" icon="i-iconoir-bookmark" to="/docs/5.x/reference/configuration"}
Look up spec versions, options, and config formats.
:::

::
