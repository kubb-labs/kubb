---
layout: doc
title: Your first TypeScript client from an API spec
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

Generate TypeScript types and an Axios client for one Petstore operation. You need Node.js 22.12 or higher and npm. You'll inspect the generated operation and its types.

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

## Add the specification {#_2-add-the-specification}

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

The `getPetById` operation accepts a pet ID and returns a pet with an ID and name.

## Configure generation {#_3-configure-generation}

Create `kubb.config.ts` beside the specification:

```typescript twoslash [kubb.config.ts]
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

This configuration writes types to `src/gen/models` and the client to `src/gen/clients`.

> [!WARNING]
> Keep `src/gen` dedicated to generated files. `clean: true` removes its contents before each run.

## Generate the client {#_4-generate-the-client}

```shell [Terminal]
npx kubb generate
```

Kubb reports a successful build and writes this tree. Open `src/gen/clients/getPetById.ts` and notice that `getPetById` accepts typed path parameters and returns a typed result. Its imported types live in `src/gen/models`.

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

The `.kubb` directory holds shared client and serialization helpers.

## Regenerate after a change {#_5-regenerate-after-a-change}

Add a `tag` property to the `Pet` schema in `petStore.yaml`, alongside `id` and `name`:

```yaml [petStore.yaml — properties]
tag:
  type: string
```

Run `npx kubb generate` again and open `src/gen/models/Pet.ts`. It now includes an optional `tag` field because `tag` is not listed in the schema's `required` array. The client continues to import the regenerated types.

You now have a typed client and have seen how a specification change flows into its output.

::

## Continue

::card-group

:::card{title="Call generated operations" icon="i-iconoir-code" to="/extensions/kubb-labs/plugin-axios/guides/calling-operations"}
Use the generated Axios client. [Configure its host](/extensions/kubb-labs/plugin-axios/guides/base-url) for your API.
:::

:::card{title="Configure generation" icon="i-iconoir-settings" to="/docs/5.x/how-to/recipes"}
Add React or Vue hooks, validation, and mocks.
:::

:::card{title="Configuration reference" icon="i-iconoir-bookmark" to="/docs/5.x/reference/configuration"}
Look up specification versions, options, and config formats.
:::

::
