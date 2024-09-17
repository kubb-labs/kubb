---
layout: doc

title: Templates tutorial
outline: deep
---

# Templates tutorial

This tutorial will describe how you can setup Kubb and use our `plugin-client` plugin to generate a client based on Swagger/OpenAPI file.
More info about how templates are working behind the scenes can be found [here](/reference/templates).

<hr/>
The setup will contain from the beginning the following folder structure:

```
.
├── src
├── petStore.yaml
├── kubb.config.ts
└── package.json
```

::: code-group

```typescript [@kubb/plugin-client/types]
import { Client, Operations } from '@kubb/plugin-client/components'

type Templates = {
  operations: typeof Operations.templates
  client: typeof Client.templates
}
export type Options = {
  // ....
  /**
   * Make it possible to override one of the templates
   */
  templates?: Partial<Templates>
}
```

:::


## Step one

Create a React component that will be used to override the default behavior of the generated client(`@kubb/plugin`).<br/>
In this React component we want to return a function `export function addPet()` that will call Axios. To do that we add a `Function` component and as children we provide the following snippet:
```typescript
 {`return axios.${client.method}(${clientParams}`}
```

We also want to import `axios`, to do that we can use `File.Import`. Next to that we will also make it async, provide some JSDoc properties and define a name for the generated function.

::: code-group

```tsx [kubb.config.ts]
import React from 'react'

import { File, Function } from '@kubb/react'
import { Client } from '@kubb/plugin-client/components'

function ClientTemplate({ name, generics, returnType, params, JSDoc, client }: React.ComponentProps<typeof Client.templates.default>) {
  const clientParams = [client.path.template, client.withData ? 'data' : undefined, 'options'].filter(Boolean).join(', ')

  return (
    <>
      <File.Import name="axios" path="axios" />
      <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
        {`return axios.${client.method}(${clientParams}`}
      </Function>
    </>
  )
}
```

:::


## Step two

Update your `kubb.config.ts` file to include the custom template.
> [!TIP]
> If you want to use another language than JavaScript/TypeScript, override the root template with your own.
> See [examples/python](/examples/python) for an example on how you can do that.

::: code-group

```tsx [kubb.config.ts]
import React from 'react'

import { File, Function } from '@kubb/react'
import { Client } from '@kubb/plugin-client/components'
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginClient } from '@kubb/plugin-client'

function ClientTemplate({ name, generics, returnType, params, JSDoc, client }: React.ComponentProps<typeof Client.templates.default>) {
  const clientParams = [client.path.template, client.withData ? 'data' : undefined, 'options'].filter(Boolean).join(', ')

  return (
    <>
      <File.Import name="axios" path="axios" />
      <Function name={name} async export generics={generics} returnType={returnType} params={params} JSDoc={JSDoc}>
        {`return axios.${client.method}(${clientParams}`}
      </Function>
    </>
  )
}

const templates = {
  client: {
    default: ClientTemplate,
    root: Client.templates.root
  },
} as const

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src',
    },
    plugins: [
      pluginOas(
        {
          output: false,
          validate: true,
        },
      ),
      pluginClient(
        {
          output: {
            path: 'models',
          },
          templates: {
            client: templates.client,
            operations: false,
          },
        },
      ),
    ],
  }
})
```

:::

## Step three

Run the Kubb script with the following command.

::: code-group

```shell [bun]
bun run generate
```

```shell [pnpm]
pnpm run generate
```

```shell [npm]
npm run generate
```

```shell [yarn]
yarn run generate
```

:::

## Step four

The end result of a generated client based on the custom template.

> [!TIP]
> See [examples/react-query](/examples/tanstack-query/react-query) or [examples/python](/examples/python) for are more in depth example.

```typescript
import client from '@kubb/plugin-client/client'
import axios from 'axios'
import type { ResponseConfig } from '@kubb/plugin/client'
import type { AddPetMutationRequest, AddPetMutationResponse } from '../../../models/ts/petController/AddPet'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet */
export async function addPet(
  data: AddPetMutationRequest,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<AddPetMutationResponse>['data']> {
  return axios.post(`/pet`, data, options)
}
```
