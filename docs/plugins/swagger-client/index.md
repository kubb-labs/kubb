---
layout: doc

title: \@kubb/swagger-client
outline: deep
---

# @kubb/swagger-client <a href="https://paka.dev/npm/@kubb/swagger-client@latest/api">🦙</a>

With the Swagger client plugin you can create [Axios](https://axios-http.com/docs/intro) API calls.

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/swagger-client @kubb/swagger-ts @kubb/swagger
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/swagger-client @kubb/swagger-ts @kubb/swagger
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/swagger-client @kubb/swagger-ts @kubb/swagger
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/swagger-client @kubb/swagger-ts @kubb/swagger
```

:::

## Options

### output

Output to save the clients.
::: info
Type: `string` <br/>
Default: `'clients'`

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerClient from '@kubb/swagger-client'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient({ output: './axios' }),
  ],
})
```

:::

### groupBy

Group the clients based on the provided name.

#### type

Tag will group based on the operation tag inside the Swagger file.

Type: `'tag'` <br/>
Required: `true`

#### output

::: v-pre
Relative path to save the grouped clients.
`{{tag}}` will be replaced by the current tagName.
:::

::: v-pre
Type: `string` <br/>
Example: `clients/{{tag}}Controller` => `clients/PetController` <br/>
Default: `${output}/{{tag}}Controller`
:::

#### exportAs

::: v-pre
Name to be used for the `export * as {{exportAs}} from './`
:::

::: v-pre
Type: `string` <br/>
Default: `'{{tag}}Service'`
:::

::: info

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerClient from '@kubb/swagger-client'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        output: './clients/axios',
        groupBy: { type: 'tag', output: './clients/axios/{{tag}}Service' },
      },
    ),
  ],
})
```

:::

### client <Badge type="danger" text="deprecated" />

Path to the client that will be used to do the API calls.<br/>
Relative to the root

::: info

Type: `string` <br/>
Default: `'@kubb/swagger-client/client'`

Deprecated. Use `clientImportPath` instead. It will be skipped if `clientImportPath` is provided.
:::

### clientImportPath

Path to the client import path that will be used to do the API calls.<br/>
It will be used as `import client from '${clientImportPath}'`.<br/>
It allow both relative and absolute path. the path will be applied as is,
so relative path shoule be based on the file being generated.

::: info
Type: `string` <br/>
Default: `'@kubb/swagger-client/client'`

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerClient from '@kubb/swagger-client'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        clientImportPath: '../../client.ts',
      },
    ),
  ],
})
```

:::

### dataReturnType <Badge type="warning" text="experimental" />

ReturnType that needs to be used when calling client().

`'data'` will return ResponseConfig[data]. <br/>
`'full'` will return ResponseConfig.

::: info type

::: code-group

```typescript ['data']
export async function getPetById<TData>(
  petId: GetPetByIdPathParams,
): Promise<ResponseConfig<TData>["data"]> {
  ...
}
```

```typescript ['full']
export async function getPetById<TData>(
  petId: GetPetByIdPathParams,
): Promise<ResponseConfig<TData>> {
  ...
}
```

:::

::: info

Type: `'data' | 'full'` <br/>
Default: `'data'`

::: code-group

```typescript ['data']
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerClient from '@kubb/swagger-client'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        dataReturnType: 'data',
      },
    ),
  ],
})
```

```typescript ['full']
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerClient from '@kubb/swagger-client'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        dataReturnType: 'full',
      },
    ),
  ],
})
```

:::

### pathParamsType <Badge type="warning" text="experimental" />

How to pass your pathParams.

`'object'` will return the pathParams as an object. <br/>
`'inline'` will return the pathParams as comma separated params.

::: info type

::: code-group

```typescript ['object']
export async function getPetById<TData>(
  { petId }: GetPetByIdPathParams,
): Promise<ResponseConfig<TData>> {
  ...
}
```

```typescript ['inline']
export async function getPetById<TData>(
  petId: GetPetByIdPathParams,
): Promise<ResponseConfig<TData>> {
  ...
}
```

:::

::: info

Type: `'object' | 'inline'` <br/>
Default: `'data'`

::: code-group

```typescript ['object']
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerClient from '@kubb/swagger-client'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        pathParamsType: 'object',
      },
    ),
  ],
})
```

```typescript ['inline']
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerClient from '@kubb/swagger-client'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        pathParamsType: 'inline',
      },
    ),
  ],
})
```

:::

### skipBy

Array containing skipBy paramaters to exclude/skip tags/operations/methods/paths.

::: info type

```typescript [SkipBy]
export type SkipBy = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
}
```

:::

::: info

Type: `Array<SkipBy>` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerClient from '@kubb/swagger-client'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        skipBy: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
      },
    ),
  ],
})
```

:::

### overrideBy

Array containing overrideBy paramaters to override `options` based on tags/operations/methods/paths.

::: info type

```typescript [OverrideBy]
export type OverrideBy = {
  type: 'tag' | 'operationId' | 'path' | 'method'
  pattern: string | RegExp
  options: PluginOptions
}
```

:::

::: info

Type: `Array<OverrideBy>` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerClient from '@kubb/swagger-client'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        overrideBy: [
          {
            type: 'tag',
            pattern: 'pet',
            options: {
              output: './custom',
            },
          },
        ],
      },
    ),
  ],
})
```

:::

### transformers

#### name

Override the name of the client that is getting generated, this will also override the name of the file.

::: info

Type: `(name: string) => string` <br/>

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/swagger'
import createSwagger from '@kubb/swagger'
import createSwaggerClient from '@kubb/swagger-client'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({}),
    createSwaggerClient(
      {
        transformers: {
          name: (name) => {
            return `${name}Client`
          },
        },
      },
    ),
  ],
})
```

:::

## Depended

- [`@kubb/swagger`](/plugins/swagger)
- [`@kubb/swagger-ts`](/plugins/swagger-ts)

## Links

- [Axios](https://axios-http.com/docs/intro)
