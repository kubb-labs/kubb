---
layout: doc

title: Templates tutorial
outline: deep
---

# Templates tutorial

This tutorial will describe how you can setup Kubb + use the Swagger-client plugin to generate a client based on the `petStore.yaml` file with a defined template.

More info about how templates are working behind the scenes can be found [here](/reference/templates).

<hr/>
The setup will contain from the beginning the following folder structure:

```typescript
.
├── src
├── templates
├── petStore.yaml
├── kubb.config.ts
└── package.json
```

## Step one

Create a React component inside the templates folder that will be used to override the default behavior of the `@kubb/swagger-client` generated client.

::: tip
Make sure you inherit from `Client.templates.default` instead of `Client.templates`.

In the future we will add more templates so that's why we have `default`.
:::

::: code-group

```typescript [@kubb/swagger-client/types]
import { Client, Operations } from '@kubb/swagger-client/components'

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

The following component will use the props of the template `React.ComponentProps<typeof Client.templates.default>` and return based on those props a function `axios.get`.

Here we also need to add a new import and for that we use `File.Import`. For the other props, we just pass them(JSDoc, params, ...).

::: code-group

```typescript [templates/CustomClientTemplates.tsx]
import { File, Function } from '@kubb/react'
import { Client } from '@kubb/swagger-client/components'
import React from 'react'

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

Based on the type we know that we need to return a template object with `client` and/or `operations`(see types.ts). To make it possible to override the templates we need to add the following export.

::: tip
Don't forget the `default`, in the future we will have multiple variants but the default will be used as a fallback.
:::

::: code-group

```typescript [templates/CustomClientTemplates.tsx]
import { PluginOptions } from '@kubb/swagger-client'

export const templates: PluginOptions['options']['templates'] = {
  client: {
    default: ClientTemplate,
  },
}
```

:::

This will result in the following folder structure.

```typescript
.
├── src/
├── templates/
│   └── CustomClientTemplates.tsx
├── petStore.yaml
├── kubb.config.ts
└── package.json
```

## Step three

Update your `kubb.config.ts` file to include the `templates` options.

::: code-group

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'

import { templates } from './templates/CustomClientTemplates.tsx'

export default defineConfig(async () => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src',
    },
    plugins: [
      createSwagger(
        {
          output: false,
          validate: true,
        },
      ),
      createSwaggerTS(
        {
          output: {
            path: 'models',
          },
          templates,
        },
      ),
    ],
  }
})
```

:::

## Step four

Run the Kubb script with the following command.

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun run generate
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm run generate
```

```shell [npm <img src="/feature/npm.svg"/>]
npm run generate
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn run generate
```

:::

## Step five

End result of a custom template.

::: code-group

```typescript [templates/CustomClientTemplates.tsx]
import { File, Function } from '@kubb/react'
import { PluginOptions } from '@kubb/swagger-client'
import { Client } from '@kubb/swagger-client/components'
import React from 'react'

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

export const templates: PluginOptions['options']['templates'] = {
  client: {
    default: ClientTemplate,
  },
}
```

```typescript [default template]
import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type { AddPetMutationRequest, AddPetMutationResponse } from '../../../models/ts/petController/AddPet'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * @link /pet */
export async function addPet(
  data: AddPetMutationRequest,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<AddPetMutationResponse>['data']> {
  const { data: resData } = await client<AddPetMutationResponse, AddPetMutationRequest>({
    method: 'post',
    url: `/pet`,
    data,
    ...options,
  })
  return resData
}
```

```typescript [custom template]
import client from '@kubb/swagger-client/client'
import axios from 'axios'
import type { ResponseConfig } from '@kubb/swagger-client/client'
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

:::
